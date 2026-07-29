import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import { createMarkdownPreviewHtml } from './localBrowseUi'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => (
    rm(path, { force: true, recursive: true })
  )))
})

describe('local Markdown preview page', () => {
  it('builds a proxied, editable preview with rendered equations', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'codex-markdown-preview-'))
    temporaryDirectories.push(directory)
    const markdownPath = join(directory, 'paper draft.md')
    await writeFile(markdownPath, [
      '# Paper',
      '',
      String.raw`Inline \(a+b\) and $c+d$.`,
      '',
      String.raw`\[`,
      String.raw`U_R=P_{2d}M_{+\phi_2}U`,
      String.raw`\]`,
      '',
      '<script>alert("preview")</script>',
    ].join('\n'), 'utf8')

    const html = await createMarkdownPreviewHtml(markdownPath)

    expect(html).toContain('<title>paper draft.md</title>')
    expect(html).toContain('<main class="markdown-body">')
    expect(html).toContain('<h1>Paper</h1>')
    expect(html.match(/<math/gu)).toHaveLength(3)
    expect(html).toContain('/codex-local-edit')
    expect(html).toContain('/codex-local-file?path=')
    expect(html).toContain('const appBasePath =')
    expect(html).toContain('&lt;script&gt;alert(&quot;preview&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<script>alert("preview")</script>')
  })
})
