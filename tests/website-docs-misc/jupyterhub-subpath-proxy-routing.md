### JupyterHub subpath proxy routing

#### Feature/Change Name
Serve Codex Mobile below a JupyterHub `jupyter-server-proxy` path without bypassing JupyterHub authentication or exposing the application port.

#### Prerequisites/Setup
1. Build the package with `pnpm run build`.
2. Build and install the `jupyter-codexapp-proxy` wheel from this repository.
3. Ensure the `codexapp` executable is installed and available on the Jupyter Server process `PATH`.
4. Restart JupyterLab. The package registers a named `jupyter-server-proxy` route with `absolute_url: False`.
5. Keep service workers disabled by leaving `VITE_ENABLE_SERVICE_WORKER` unset or setting it to `0`.

#### Steps
1. Sign in to JupyterHub and open JupyterLab.
2. In the launcher, verify that a **Codex Mobile** tile with an icon appears in the **Notebook** section.
3. Check the launcher in both the light and dark JupyterLab themes.
4. Select the tile and verify that Codex Mobile opens in a new browser tab at `/user/<username>/codex/`.
5. Select the tile again and verify that the existing proxy process is reused instead of starting a duplicate process.
6. In browser developer tools, reload the page and inspect document, script, stylesheet, icon, API, SSE, and WebSocket requests.
7. Create a thread, send a message, reload the page, and reopen the thread.
8. Open a local image and a filesystem directory from the conversation or project controls.
9. Open an editable text file, return to the directory listing, and verify that both pages remain below the proxy prefix.
10. Open the integrated terminal and run a harmless command such as `pwd`.
11. On the compute node, inspect the listening socket for the Codex Mobile port.
12. Sign out of JupyterHub or use an unauthenticated browser session and try the proxied URL.

#### Expected Results
- The launcher tile and its icon remain readable in both light and dark themes.
- Selecting the tile lazily starts one Codex Mobile process bound to an automatically selected `127.0.0.1` port; later selections reuse that process.
- All application requests remain below `/user/<username>/codex/`; no request is sent to root `/codex-api/*`, `/codex-local-*`, `/assets/*`, or `/icons/*`.
- RPC and WebSocket or SSE connections succeed through the prefix.
- Thread creation, messaging, reload, local image/file browsing, editing, and terminal access work.
- No service worker is registered by default.
- The Codex Mobile port listens only on `127.0.0.1`, while the proxied URL remains accessible.
- JupyterHub rejects unauthenticated access before the request reaches Codex Mobile.

#### Rollback/Cleanup
- Stop the Codex Mobile process and its `jupyter-server-proxy` launcher.
- Remove the named proxy entry if the deployment is being rolled back.
