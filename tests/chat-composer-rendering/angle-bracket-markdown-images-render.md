### Angle-bracket Markdown images render

#### Feature/Change Name
Render CommonMark image destinations wrapped in angle brackets, including
absolute local paths with spaces.

#### Prerequisites/Setup
1. Build and start Codex Mobile.
2. Create or identify a readable local PNG image whose absolute path contains
   a space.
3. Open a test thread in light or dark mode.

#### Steps
1. Render an assistant message containing
   `![Local preview](</absolute/path/with space/preview.png>)`.
2. Render the same image without destination wrappers:
   `![Local preview](/absolute/path/with space/preview.png)`.
3. Render an HTTPS image with an angle-wrapped destination.
4. Put an identical image token inside a fenced code block.
5. Select each rendered image to open the existing image preview modal.
6. Repeat below a configured reverse-proxy base path.

#### Expected Results
- Both wrapped and unwrapped local destinations render the image rather than
  their literal Markdown source.
- The local image request uses the authenticated `codex-local-image` route
  below the active reverse-proxy prefix.
- The HTTPS destination remains an HTTPS image URL.
- Markdown inside a fenced code block remains literal.
- Selecting an image opens the existing preview modal.
- Existing equation rendering and ordinary Markdown links are unchanged.

#### Rollback/Cleanup
- Remove any temporary image created for the test.
- Revert the image-destination normalizer and its integration to restore the
  previous parsing behavior.
