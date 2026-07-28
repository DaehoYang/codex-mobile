import { describe, expect, it } from 'vitest'
import {
  readDisplayMathBlock,
  renderMathToHtml,
  splitInlineMath,
} from './messageMath'

describe('message math rendering', () => {
  it('splits standard inline LaTeX delimiters without consuming surrounding text', () => {
    expect(splitInlineMath('branches \\(+\\phi\\) and \\(-\\phi\\) remain')).toEqual([
      { kind: 'text', value: 'branches ' },
      { kind: 'math', value: '+\\phi' },
      { kind: 'text', value: ' and ' },
      { kind: 'math', value: '-\\phi' },
      { kind: 'text', value: ' remain' },
    ])
  })

  it('keeps unmatched delimiters as plain text', () => {
    expect(splitInlineMath('unfinished \\(x + y')).toEqual([
      { kind: 'text', value: 'unfinished \\(x + y' },
    ])
  })

  it('reads bracketed and double-dollar display equations', () => {
    expect(readDisplayMathBlock([
      '\\[',
      'U_R=P_{2d}M_{+\\phi_2}P_{12}M_{+\\phi_1}U,',
      '\\qquad',
      'U_L=P_{2d}M_{-\\phi_2}P_{12}M_{-\\phi_1}U',
      '\\]',
      'after',
    ], 0)).toEqual({
      value: 'U_R=P_{2d}M_{+\\phi_2}P_{12}M_{+\\phi_1}U,\n\\qquad\nU_L=P_{2d}M_{-\\phi_2}P_{12}M_{-\\phi_1}U',
      nextIndex: 5,
    })
    expect(readDisplayMathBlock(['$$E=mc^2$$'], 0)).toEqual({
      value: 'E=mc^2',
      nextIndex: 1,
    })
  })

  it('leaves an unterminated display equation to the Markdown fallback', () => {
    expect(readDisplayMathBlock(['\\[', 'x+y'], 0)).toBeNull()
  })

  it('renders inline and display equations with accessible MathML', () => {
    const inline = renderMathToHtml('U_R=P_{2d}M_{+\\phi_2}U', false)
    const display = renderMathToHtml('U_L=P_{2d}M_{-\\phi_2}U', true)

    expect(inline).toContain('class="katex"')
    expect(inline).toContain('<math')
    expect(display).toContain('class="katex-display"')
    expect(display).toContain('<math')
  })

  it('does not trust dangerous LaTeX URLs', () => {
    const html = renderMathToHtml('\\href{javascript:alert(1)}{unsafe}', false)
    expect(html).not.toContain('href="javascript:')
  })
})
