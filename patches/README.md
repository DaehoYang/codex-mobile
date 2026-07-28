# JupyterHub deployment build

This branch contains the reverse-proxy base-path support, loopback-only
binding option, regression checklist, and a portable patch for Codex Mobile
`0.1.87`.

## Clone the ready-to-build branch

The simplest reproducible workflow is to clone this branch directly:

```bash
git clone \
  --branch personal/jupyterhub-deployment \
  https://github.com/DaehoYang/codex-mobile.git
cd codex-mobile
```

Install, test, and build:

```bash
npx --yes pnpm@10.34.5 install --no-frozen-lockfile
npx --yes pnpm@10.34.5 run test:unit
npx --yes pnpm@10.34.5 run build
```

The examples below were validated with:

```text
Node.js 20.19.5
pnpm 10.34.5
Codex CLI 0.144.4
```

## Apply the portable patch instead

`jupyterhub-base-path.patch` is based on upstream commit `fac2291`
(Codex Mobile `0.1.87`). From a clean checkout at that commit:

```bash
git apply --check /path/to/jupyterhub-base-path.patch
git apply /path/to/jupyterhub-base-path.patch
```

To try a three-way application after a later upstream update:

```bash
git apply --3way /path/to/jupyterhub-base-path.patch
```

Resolve any conflicts and rerun all tests before deployment.

## Build a package for a Docker image

Build and pack the modified package:

```bash
npx --yes pnpm@10.34.5 install --no-frozen-lockfile
npx --yes pnpm@10.34.5 run test:unit
npx --yes pnpm@10.34.5 run build

mkdir -p container-artifacts
npx --yes pnpm@10.34.5 pack --pack-destination container-artifacts
```

The result should be similar to:

```text
container-artifacts/codexapp-0.1.87.tgz
```

Confirm that the package contains both compiled outputs:

```bash
tar -tf container-artifacts/codexapp-0.1.87.tgz \
  | grep -E '^package/(dist|dist-cli)/'
```

Keep this tarball with the Docker build context. Do not use
`npm install -g codexapp` in the runtime image because that downloads the
unmodified public package.

## Add the package to an existing Jupyter image

The image must provide Node.js 18 or newer and npm:

```dockerfile
FROM <existing-jupyter-gpu-image>

USER root

ARG CODEX_CLI_VERSION=0.144.4
COPY container-artifacts/codexapp-0.1.87.tgz /tmp/codexapp-patched.tgz

RUN npm install -g \
      /tmp/codexapp-patched.tgz \
      "@openai/codex@${CODEX_CLI_VERSION}" \
    && codexapp --help | grep -q -- "--host <host>" \
    && codex --version \
    && rm -f /tmp/codexapp-patched.tgz \
    && npm cache clean --force

# Restore the normal USER from the original Jupyter image here.
```

If npm needs to compile the optional `node-pty` dependency, install `python3`,
`make`, and `g++` during the `npm install` layer. `node-pty` is required for
the integrated terminal.

Do not add `EXPOSE 4199` or publish the Codex Mobile port.
`jupyter-server-proxy` and `codexapp` should run in the same container or
network namespace and communicate over loopback.

Build the image:

```bash
docker build \
  --build-arg CODEX_CLI_VERSION=0.144.4 \
  -t <registry>/jupyter-gpu-codexapp:0.1.87-jupyterhub \
  .
```

## Verify the image

Check the installed CLI before starting JupyterHub:

```bash
docker run --rm \
  <registry>/jupyter-gpu-codexapp:0.1.87-jupyterhub \
  sh -lc '
    node --version
    codex --version
    codexapp --help | grep -- "--host <host>"
  '
```

After JupyterHub starts a single-user container, open a Jupyter terminal and
run:

```bash
codexapp \
  --host 127.0.0.1 \
  --port 4199 \
  --no-password \
  --no-open \
  --no-tunnel \
  --no-login
```

Then open:

```text
https://<jupyterhub>/user/<username>/proxy/4199/
```

Verify:

```text
[ ] Unauthenticated access redirects to JupyterHub login
[ ] Authenticated document request returns HTTP 200
[ ] JS and CSS load below /user/<username>/proxy/4199/
[ ] API calls remain below /user/<username>/proxy/4199/codex-api/
[ ] WebSocket connects below /user/<username>/proxy/4199/codex-api/ws
[ ] No request leaks to root /assets/, /codex-api/, or /codex-local-*
[ ] codexapp listens only on 127.0.0.1
[ ] No service worker is registered by default
```

## Persist user-specific state

Each JupyterHub user must have an independent home directory and `CODEX_HOME`.
Never bake a user's `.codex` directory into the image.

The launcher should use:

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
```

Mount or preserve the user's home directory so conversations, authentication,
and workspace state survive container or Slurm job restarts.

## Named jupyter-server-proxy entry

Register a named proxy whose command starts the patched CLI with:

```bash
codexapp "$CODEX_PROJECT" \
  --no-tunnel \
  --no-open \
  --no-login \
  --no-password \
  --host 127.0.0.1 \
  --port {port}
```

Use `absolute_url: False` and open:

```text
https://<jupyterhub>/user/<username>/codex/
```

Leave `VITE_ENABLE_SERVICE_WORKER` unset or set it to `0` for the initial
proxied deployment. JupyterHub remains the authentication boundary; never
expose the Codex Mobile port outside loopback while `--no-password` is used.
