### LaTeX equations render with KaTeX

#### Feature/Change Name
KaTeX rendering for standard inline and display LaTeX delimiters in chat and
plan Markdown.

#### Prerequisites/Setup
1. Build or run Codex Mobile with its dependencies installed.
2. Open a thread in which Markdown messages are visible.
3. Make light and dark themes available.

#### Steps
1. Send or inspect a message containing inline equations such as
   `\(M_{+\phi}\)` and `\(M_{-\phi}\)`.
2. Include a display equation delimited by `\[` and `\]`, with the opening and
   closing delimiters on separate lines.
3. Repeat the display equation with `$$` delimiters.
4. Include the same delimiters inside a backticked inline-code span and a
   fenced code block.
5. Include a malformed or unterminated equation.
6. Check the rendered message in light and dark themes and at a narrow mobile
   viewport.

#### Expected Results
- Inline equations render as inline KaTeX without breaking surrounding text.
- Display equations render as centered blocks with horizontal scrolling when
  they exceed the message width.
- KaTeX output includes MathML for accessible equation text.
- Delimiters inside inline or fenced code remain literal code.
- Malformed equations remain visible through the KaTeX error fallback; they
  do not crash or remove the rest of the message.
- Equation text and error fallback remain readable in light and dark themes.

#### Rollback/Cleanup
- Revert the KaTeX dependency and the message math parser/renderer integration
  if equations must return to literal Markdown text.

---
