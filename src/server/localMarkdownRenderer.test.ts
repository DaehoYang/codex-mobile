import { describe, expect, it } from 'vitest'
import {
  canRenderMarkdownPreview,
  isMarkdownFilePath,
  MAX_MARKDOWN_PREVIEW_BYTES,
  renderLocalMarkdown,
} from './localMarkdownRenderer'

describe('local Markdown rendering', () => {
  it('renders common Markdown while escaping raw HTML', () => {
    const html = renderLocalMarkdown([
      '# Heading',
      '',
      '**bold** and `inline code`',
      '',
      '- first',
      '- second',
      '',
      '<script>alert("preview")</script>',
    ].join('\n'))

    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>inline code</code>')
    expect(html).toContain('<li>first</li>')
    expect(html).toContain('&lt;script&gt;alert(&quot;preview&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert("preview")</script>')
  })

  it('renders dollar and Codex-style inline and display equations as MathML', () => {
    const html = renderLocalMarkdown([
      'Dollar inline: $E=mc^2$.',
      '',
      String.raw`Codex inline: \(a^2+b^2=c^2\).`,
      '',
      '$$',
      String.raw`\int_0^\infty e^{-x}\,dx = 1`,
      '$$',
      '',
      String.raw`\[`,
      String.raw`U_R=P_{2d}M_{+\phi_2}U`,
      String.raw`\]`,
    ].join('\n'))

    expect(html.match(/<math/gu)).toHaveLength(4)
    expect(html.match(/class="math-inline"/gu)).toHaveLength(2)
    expect(html.match(/class="math-display"/gu)).toHaveLength(2)
    expect(html).toContain('<msup>')
    expect(html).not.toContain('$$')
    expect(html).not.toContain(String.raw`\(`)
    expect(html).not.toContain(String.raw`\[`)
  })

  it('leaves equations inside inline and fenced code untouched', () => {
    const html = renderLocalMarkdown([
      'Keep `$x$` and `\\(y\\)` literal.',
      '',
      '```text',
      '$$',
      'z',
      '$$',
      '```',
    ].join('\n'))

    expect(html).not.toContain('class="math-inline"')
    expect(html).not.toContain('class="math-display"')
    expect(html).toContain('$x$')
    expect(html).toContain(String.raw`\(y\)`)
    expect(html).toContain('$$\nz\n$$')
  })

  it('routes absolute local links and images through local endpoints', () => {
    const html = renderLocalMarkdown([
      '[Local file](</home/example/My File.md>)',
      '',
      '![Local image](<file:///home/example/plot.png>)',
      '',
      '[Relative](notes/next.md)',
      '',
      '[External](https://example.com/docs)',
      '',
      '[Unsafe](javascript:alert(1))',
    ].join('\n'))

    expect(html).toContain('href="/codex-local-browse/home/example/My%20File.md"')
    expect(html).toContain('src="/codex-local-image?path=%2Fhome%2Fexample%2Fplot.png"')
    expect(html).toContain('href="notes/next.md"')
    expect(html).toContain('href="https://example.com/docs"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).not.toContain('href="javascript:')
  })

  it('recognizes supported Markdown filename extensions case-insensitively', () => {
    expect(isMarkdownFilePath('/tmp/report.md')).toBe(true)
    expect(isMarkdownFilePath('/tmp/report.MARKDOWN')).toBe(true)
    expect(isMarkdownFilePath('/tmp/report.txt')).toBe(false)
    expect(canRenderMarkdownPreview('/tmp/report.md', MAX_MARKDOWN_PREVIEW_BYTES)).toBe(true)
    expect(canRenderMarkdownPreview('/tmp/report.md', MAX_MARKDOWN_PREVIEW_BYTES + 1)).toBe(false)
  })
})
