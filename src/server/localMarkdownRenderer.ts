import { extname } from 'node:path'
import katex from 'katex'
import MarkdownIt from 'markdown-it'

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown', '.mkd'])
export const MAX_MARKDOWN_PREVIEW_BYTES = 2 * 1024 * 1024

function isEscaped(value: string, index: number): boolean {
  let backslashCount = 0
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    backslashCount += 1
  }
  return backslashCount % 2 === 1
}

function findInlineMathClose(
  value: string,
  delimiter: '$' | '\\)',
  fromIndex: number,
): number {
  let index = value.indexOf(delimiter, fromIndex)
  while (index >= 0) {
    if (!isEscaped(value, index)) {
      if (delimiter !== '$' || (value[index - 1] !== '$' && value[index + 1] !== '$')) {
        return index
      }
    }
    index = value.indexOf(delimiter, index + delimiter.length)
  }
  return -1
}

function renderMath(value: string, displayMode: boolean): string {
  return katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: 'warn',
    trust: false,
    output: 'mathml',
  })
}

function installMathRules(markdown: MarkdownIt): void {
  markdown.inline.ruler.before('escape', 'math_inline', (state, silent) => {
    const source = state.src
    const start = state.pos
    const isParenMath = source.startsWith('\\(', start)
    const isDollarMath = source[start] === '$' && source[start + 1] !== '$'
    if (!isParenMath && !isDollarMath) return false

    const openLength = isParenMath ? 2 : 1
    const closeDelimiter = isParenMath ? '\\)' : '$'
    const expressionStart = start + openLength
    if (isDollarMath && /\s/u.test(source[expressionStart] ?? '')) return false

    let closeIndex = findInlineMathClose(source, closeDelimiter, expressionStart)
    while (
      closeIndex >= 0
      && isDollarMath
      && /\s/u.test(source[closeIndex - 1] ?? '')
    ) {
      closeIndex = findInlineMathClose(source, closeDelimiter, closeIndex + 1)
    }
    if (closeIndex < 0) return false

    const expression = source.slice(expressionStart, closeIndex).trim()
    if (!expression || expression.includes('\n')) return false
    if (silent) return true

    const token = state.push('math_inline', 'math', 0)
    token.content = expression
    token.markup = isParenMath ? '\\(\\)' : '$'
    state.pos = closeIndex + closeDelimiter.length
    return true
  })

  markdown.block.ruler.before('fence', 'math_block', (state, startLine, endLine, silent) => {
    if (state.sCount[startLine] - state.blkIndent >= 4) return false

    const firstStart = state.bMarks[startLine] + state.tShift[startLine]
    const firstLine = state.src.slice(firstStart, state.eMarks[startLine]).trim()
    const delimiter = firstLine.startsWith('\\[')
      ? { open: '\\[', close: '\\]' }
      : firstLine.startsWith('$$')
        ? { open: '$$', close: '$$' }
        : null
    if (!delimiter) return false

    const expressionLines: string[] = []
    let line = startLine
    let current = firstLine.slice(delimiter.open.length)
    let expression = ''

    while (line < endLine) {
      const closeIndex = current.lastIndexOf(delimiter.close)
      if (closeIndex >= 0) {
        if (current.slice(closeIndex + delimiter.close.length).trim()) return false
        expressionLines.push(current.slice(0, closeIndex))
        expression = expressionLines.join('\n').trim()
        break
      }

      expressionLines.push(current)
      line += 1
      if (line >= endLine) return false
      current = state.src.slice(
        state.bMarks[line] + state.tShift[line],
        state.eMarks[line],
      )
    }

    if (!expression) return false
    if (silent) return true

    const token = state.push('math_block', 'math', 0)
    token.block = true
    token.content = expression
    token.map = [startLine, line + 1]
    token.markup = delimiter.open
    state.line = line + 1
    return true
  })

  markdown.renderer.rules.math_inline = (tokens, index) => (
    `<span class="math-inline">${renderMath(tokens[index].content, false)}</span>`
  )
  markdown.renderer.rules.math_block = (tokens, index) => (
    `<div class="math-display">${renderMath(tokens[index].content, true)}</div>\n`
  )
}

function isExternalUrl(value: string): boolean {
  return /^(?:https?:|mailto:|tel:)/iu.test(value)
}

function normalizeFileUrl(value: string): string {
  const pathValue = value.startsWith('file://')
    ? value.slice('file://'.length)
    : value
  if (!value.startsWith('file://') && !value.startsWith('/')) return value
  try {
    return decodeURI(pathValue)
  } catch {
    return pathValue
  }
}

function localBrowseHref(pathValue: string): string {
  return `/codex-local-browse${encodeURI(pathValue)}`
}

function localImageHref(pathValue: string): string {
  return `/codex-local-image?path=${encodeURIComponent(pathValue)}`
}

function installLocalLinkRules(markdown: MarkdownIt): void {
  const defaultLinkOpen = markdown.renderer.rules.link_open
    ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
  markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const hrefIndex = token.attrIndex('href')
    if (hrefIndex >= 0) {
      const original = token.attrs?.[hrefIndex]?.[1] ?? ''
      const normalized = normalizeFileUrl(original)
      if (normalized.startsWith('/')) {
        token.attrSet('href', localBrowseHref(normalized))
      } else if (isExternalUrl(normalized)) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
      }
    }
    return defaultLinkOpen(tokens, index, options, env, self)
  }

  const defaultImage = markdown.renderer.rules.image
    ?? ((tokens, index, options, _env, self) => self.renderToken(tokens, index, options))
  markdown.renderer.rules.image = (tokens, index, options, env, self) => {
    const token = tokens[index]
    const srcIndex = token.attrIndex('src')
    if (srcIndex >= 0) {
      const original = token.attrs?.[srcIndex]?.[1] ?? ''
      const normalized = normalizeFileUrl(original)
      if (normalized.startsWith('/')) {
        token.attrSet('src', localImageHref(normalized))
      }
    }
    return defaultImage(tokens, index, options, env, self)
  }
}

function createMarkdownRenderer(): MarkdownIt {
  const markdown = new MarkdownIt({
    breaks: false,
    html: false,
    linkify: true,
    typographer: false,
  })
  const defaultValidateLink = markdown.validateLink.bind(markdown)
  markdown.validateLink = (value) => (
    value.startsWith('file:///') || defaultValidateLink(value)
  )
  installMathRules(markdown)
  installLocalLinkRules(markdown)
  return markdown
}

const markdownRenderer = createMarkdownRenderer()

export function isMarkdownFilePath(pathValue: string): boolean {
  return MARKDOWN_EXTENSIONS.has(extname(pathValue).toLowerCase())
}

export function canRenderMarkdownPreview(pathValue: string, size: number): boolean {
  return isMarkdownFilePath(pathValue)
    && Number.isFinite(size)
    && size >= 0
    && size <= MAX_MARKDOWN_PREVIEW_BYTES
}

export function renderLocalMarkdown(markdown: string): string {
  return markdownRenderer.render(markdown)
}
