# Jupyter Codex Mobile Proxy

This package registers Codex Mobile with `jupyter-server-proxy`. It adds a
Codex Mobile tile to the JupyterLab launcher and starts `codexapp` on an
automatically selected loopback port when the tile is opened.

The `codexapp` executable must already be installed and available on `PATH`.

## Build

From the repository root:

```bash
python -m pip wheel \
  --no-deps \
  --wheel-dir container-artifacts \
  ./jupyter-codexapp-proxy
```

## Install

Install directly from the GitHub release:

```bash
python -m pip install \
  https://github.com/DaehoYang/codex-mobile/releases/download/jupyterhub-v0.1.87-b2417fc/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl
```

Alternatively, install a locally built wheel:

```bash
python -m pip install \
  container-artifacts/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl
```

Restart JupyterLab after installation, then open the **Codex Mobile** launcher
tile. The application is served at the named proxy path `codex/`.
