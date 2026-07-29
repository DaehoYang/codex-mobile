### Markdown file preview with KaTeX

#### Feature/Change Name
Render local Markdown files opened through `codex-local-browse` instead of
showing their raw source.

#### Prerequisites/Setup
1. Build and start Codex Mobile, either directly or through the JupyterHub
   `jupyter-server-proxy` launcher.
2. Create a local `.md` file containing headings, lists, code, links, images,
   and each equation form: `$...$`, `$$...$$`, `\(...\)`, and `\[...\]`.
3. Include a literal `<script>alert("preview")</script>` line to verify that
   raw HTML is not executed.

#### Steps
1. Open a conversation containing a link to the Markdown file.
2. Select the file link and confirm that the new tab stays below the active
   `/codex/codex-local-browse/` or `/proxy/<port>/codex-local-browse/` prefix.
3. Inspect headings, paragraphs, emphasis, lists, code blocks, tables, local
   links, and images.
4. Inspect inline and display equations using all four supported delimiter
   forms.
5. Use the **Back**, **Edit**, and **Raw** toolbar actions.
6. Repeat in light and dark browser color schemes and at mobile width.

#### Expected Results
- The Markdown document is rendered as formatted HTML rather than raw text.
- `$...$` and `\(...\)` render inline; `$$...$$` and `\[...\]` render as
  scrollable display equations.
- Equations inside inline code or fenced code blocks remain literal.
- Raw HTML is displayed as text and does not execute.
- Markdown files larger than 2 MiB fall back to the existing raw response
  instead of being parsed into memory.
- Relative document/image links keep working from the Markdown file's
  directory, while absolute local paths stay under authenticated
  `codex-local-browse` or `codex-local-image` routes.
- Toolbar actions and generated local links stay below the reverse-proxy
  prefix.
- The preview remains readable in light, dark, desktop, and mobile layouts.

#### Rollback/Cleanup
- Remove the temporary Markdown file if it was created only for testing.
- Revert the Markdown preview renderer and route integration to restore raw
  `.md` file responses.
