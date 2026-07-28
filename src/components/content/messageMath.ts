import katex from 'katex'

export type InlineMathPart =
  | { kind: 'text'; value: string }
  | { kind: 'math'; value: string }

export type DisplayMathBlock = {
  value: string
  nextIndex: number
}

const MATH_HTML_CACHE_LIMIT = 500
const mathHtmlCache = new Map<string, string>()

function isEscaped(value: string, index: number): boolean {
  let backslashCount = 0
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    backslashCount += 1
  }
  return backslashCount % 2 === 1
}

function findUnescapedDelimiter(value: string, delimiter: string, fromIndex: number): number {
  let index = value.indexOf(delimiter, fromIndex)
  while (index >= 0) {
    if (!isEscaped(value, index)) return index
    index = value.indexOf(delimiter, index + delimiter.length)
  }
  return -1
}

export function splitInlineMath(value: string): InlineMathPart[] {
  if (!value.includes('\\(')) return [{ kind: 'text', value }]

  const parts: InlineMathPart[] = []
  let cursor = 0

  while (cursor < value.length) {
    const openIndex = findUnescapedDelimiter(value, '\\(', cursor)
    if (openIndex < 0) break

    const closeIndex = findUnescapedDelimiter(value, '\\)', openIndex + 2)
    if (closeIndex < 0) break

    if (openIndex > cursor) {
      parts.push({ kind: 'text', value: value.slice(cursor, openIndex) })
    }

    const expression = value.slice(openIndex + 2, closeIndex).trim()
    if (expression) {
      parts.push({ kind: 'math', value: expression })
    } else {
      parts.push({ kind: 'text', value: value.slice(openIndex, closeIndex + 2) })
    }
    cursor = closeIndex + 2
  }

  if (cursor < value.length) {
    parts.push({ kind: 'text', value: value.slice(cursor) })
  }

  return parts.length > 0 ? parts : [{ kind: 'text', value }]
}

export function isDisplayMathOpeningLine(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('\\[') || trimmed.startsWith('$$')
}

export function readDisplayMathBlock(lines: string[], startIndex: number): DisplayMathBlock | null {
  const firstLine = lines[startIndex]?.trim() ?? ''
  const delimiter = firstLine.startsWith('\\[')
    ? { open: '\\[', close: '\\]' }
    : firstLine.startsWith('$$')
      ? { open: '$$', close: '$$' }
      : null
  if (!delimiter) return null

  const expressionLines: string[] = []
  let index = startIndex
  let current = firstLine.slice(delimiter.open.length)

  while (index < lines.length) {
    const closeIndex = current.lastIndexOf(delimiter.close)
    if (closeIndex >= 0) {
      const afterClose = current.slice(closeIndex + delimiter.close.length).trim()
      if (afterClose) return null
      expressionLines.push(current.slice(0, closeIndex))
      const value = expressionLines.join('\n').trim()
      return value ? { value, nextIndex: index + 1 } : null
    }

    expressionLines.push(current)
    index += 1
    if (index >= lines.length) break
    current = lines[index]
  }

  return null
}

export function renderMathToHtml(value: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'display' : 'inline'}\u0000${value}`
  const cached = mathHtmlCache.get(cacheKey)
  if (cached !== undefined) {
    mathHtmlCache.delete(cacheKey)
    mathHtmlCache.set(cacheKey, cached)
    return cached
  }

  const html = katex.renderToString(value, {
    displayMode,
    throwOnError: false,
    strict: 'warn',
    trust: false,
    output: 'htmlAndMathml',
  })

  mathHtmlCache.set(cacheKey, html)
  while (mathHtmlCache.size > MATH_HTML_CACHE_LIMIT) {
    const oldestKey = mathHtmlCache.keys().next().value as string | undefined
    if (oldestKey === undefined) break
    mathHtmlCache.delete(oldestKey)
  }
  return html
}
