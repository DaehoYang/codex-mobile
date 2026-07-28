### JupyterHub subpath proxy routing

#### Feature/Change Name
Serve Codex Mobile below a JupyterHub `jupyter-server-proxy` path without bypassing JupyterHub authentication or exposing the application port.

#### Prerequisites/Setup
1. Build the package with `pnpm run build`.
2. Configure a named `jupyter-server-proxy` route at `/user/<username>/codex/` with `absolute_url: False`.
3. Start Codex Mobile with `--no-password --no-open --no-tunnel --no-login --host 127.0.0.1`.
4. Keep service workers disabled by leaving `VITE_ENABLE_SERVICE_WORKER` unset or setting it to `0`.

#### Steps
1. Sign in to JupyterHub and open `/user/<username>/codex/`.
2. In browser developer tools, reload the page and inspect document, script, stylesheet, icon, API, SSE, and WebSocket requests.
3. Create a thread, send a message, reload the page, and reopen the thread.
4. Open a local image and a filesystem directory from the conversation or project controls.
5. Open an editable text file, return to the directory listing, and verify that both pages remain below the proxy prefix.
6. Open the integrated terminal and run a harmless command such as `pwd`.
7. On the compute node, inspect the listening socket for the Codex Mobile port.
8. Sign out of JupyterHub or use an unauthenticated browser session and try the proxied URL.

#### Expected Results
- All application requests remain below `/user/<username>/codex/`; no request is sent to root `/codex-api/*`, `/codex-local-*`, `/assets/*`, or `/icons/*`.
- RPC and WebSocket or SSE connections succeed through the prefix.
- Thread creation, messaging, reload, local image/file browsing, editing, and terminal access work.
- No service worker is registered by default.
- The Codex Mobile port listens only on `127.0.0.1`, while the proxied URL remains accessible.
- JupyterHub rejects unauthenticated access before the request reaches Codex Mobile.

#### Rollback/Cleanup
- Stop the Codex Mobile process and its `jupyter-server-proxy` launcher.
- Remove the named proxy entry if the deployment is being rolled back.
