# JupyterHub deployment build

This branch contains reverse-proxy base-path support, loopback-only binding,
KaTeX equation rendering in conversations and local Markdown previews,
persisted Goal controls, angle-bracket Markdown image support, regression
checklists, and portable patches for Codex Mobile `0.1.87`.

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

## Apply the portable patches instead

`jupyterhub-base-path.patch` is based on upstream commit `fac2291`
(Codex Mobile `0.1.87`). `katex-equation-rendering.patch` contains only the
conversation equation-rendering change from source commit `1ab53c4`.
`markdown-file-preview.patch` contains the local Markdown preview change from
source commit `93f6622`. `thread-goal-mode.patch` contains the goal API,
state, command, and GUI change from source commit `5de721e`.
`angle-bracket-markdown-images.patch` contains the chat image compatibility
fix from source commit `14727a3`.

The KaTeX patch has a deliberately narrow scope:

- one runtime dependency in `package.json`;
- one isolated parser/renderer module and its unit tests;
- small integration points and styles in `ThreadConversation.vue`; and
- one manual regression test.

It does not change the server, reverse-proxy handling, authentication, or
workspace persistence. It was generated with reduced patch context so it can
be applied either directly to `fac2291` or after
`jupyterhub-base-path.patch`.

The Markdown preview patch:

- renders `.md`, `.markdown`, `.mdown`, and `.mkd` files opened through
  `codex-local-browse`;
- supports `$...$`, `$$...$$`, `\(...\)`, and `\[...\]` equations;
- escapes raw HTML and renders equations as self-contained MathML;
- keeps local links, images, and toolbar actions below the active proxy
  prefix; and
- falls back to the existing raw response for files larger than 2 MiB.

It depends on the KaTeX patch and is intended to be applied after both earlier
patches. It also uses reduced patch context to limit conflicts with later
upstream changes.

The goal-mode patch:

- uses Codex app-server's persisted `thread/goal/set`, `thread/goal/get`, and
  `thread/goal/clear` methods;
- adds a responsive progress row and inline editor above the composer;
- exposes Goal in the composer **+** menu and supports `/goal` commands;
- updates state directly from goal notifications without refreshing the
  thread list or conversation; and
- keeps ordinary chat usable with older Codex CLIs that do not expose goals.

It was validated with Codex CLI `0.144.4` and is intended to be applied after
the other three patches. The ready-to-build
`personal/jupyterhub-deployment` branch contains the integrated source.

The angle-bracket image patch accepts standard image destinations such as
`![Preview](</absolute/path/with space/image.png>)`. It only removes a matched
outer `<...>` pair before the existing local-image or HTTPS URL conversion.
It does not change equation parsing, ordinary links, or local-file serving.
Apply it after the KaTeX equation patch; applying it last is the simplest
deployment order.

From a clean checkout at `fac2291`, apply the patches needed by the
deployment. Applying the reverse-proxy patch first is the recommended order:

```bash
git apply --check /path/to/jupyterhub-base-path.patch
git apply /path/to/jupyterhub-base-path.patch

git apply --check /path/to/katex-equation-rendering.patch
git apply /path/to/katex-equation-rendering.patch

git apply --check /path/to/markdown-file-preview.patch
git apply /path/to/markdown-file-preview.patch

git apply --check /path/to/thread-goal-mode.patch
git apply /path/to/thread-goal-mode.patch

git apply --check /path/to/angle-bracket-markdown-images.patch
git apply /path/to/angle-bracket-markdown-images.patch
```

Do not reapply a patch when the checked-out branch already contains its source
commit.

After a later upstream update, check each patch separately before modifying
the worktree. If a normal application no longer succeeds, try a three-way
application:

```bash
git apply --3way /path/to/jupyterhub-base-path.patch
git apply --3way /path/to/katex-equation-rendering.patch
git apply --3way /path/to/markdown-file-preview.patch
git apply --3way /path/to/thread-goal-mode.patch
git apply --3way /path/to/angle-bracket-markdown-images.patch
```

The most likely equation-patch conflict point is
`src/components/content/ThreadConversation.vue` if upstream changes its
message parser or renderer. The most likely Markdown-preview conflict points
are `src/server/httpServer.ts`, `src/server/localBrowseUi.ts`, and
`vite.config.ts` if upstream changes local-file routing. The most likely
goal-patch conflict points are `src/App.vue`,
`src/components/content/ThreadComposer.vue`, and
`src/composables/useDesktopState.ts`. The angle-bracket image patch can
conflict in `src/components/content/ThreadConversation.vue` if upstream
replaces its Markdown image parser. Resolve any conflicts, reinstall
dependencies, and rerun all tests before deployment.

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

## Build the JupyterLab launcher

The optional `jupyter-codexapp-proxy` package in this repository registers a
**Codex Mobile** launcher tile and a named `jupyter-server-proxy` route. Build
its wheel next to the Codex Mobile package:

```bash
python -m pip wheel \
  --no-deps \
  --wheel-dir container-artifacts \
  ./jupyter-codexapp-proxy
```

The result should be:

```text
container-artifacts/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl
```

For a fast Docker build, download the published launcher wheel after
`jupyter-server-proxy` and the patched `codexapp` package are installed:

```dockerfile
ADD https://github.com/DaehoYang/codex-mobile/releases/download/jupyterhub-v0.1.87-goal-image/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl \
  /tmp/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl

RUN echo "ad04008839523fd333131de36de890d38fa367b7dd4bd477199e6c726869086e  /tmp/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl" \
      | sha256sum -c - \
    && pip install --no-cache-dir \
      /tmp/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl \
    && rm -f /tmp/jupyter_codexapp_proxy-0.1.0-py3-none-any.whl
```

For an offline build, copy the locally built wheel into the Docker build
context and replace the `ADD` instruction with `COPY`.

No separate JupyterLab frontend build is required. Restarting the Jupyter
single-user server discovers the Python entry point and adds the launcher
tile.

## Fast Docker build from the release package

The recommended Dockerfile downloads the prebuilt package from the
fork-specific GitHub prerelease. It does not clone the repository, install
development dependencies, run tests, or rebuild the frontend:

```dockerfile
FROM <existing-jupyter-gpu-image>

USER root

ARG CODEX_CLI_VERSION=0.144.4

ADD https://github.com/DaehoYang/codex-mobile/releases/download/jupyterhub-v0.1.87-goal-image/codexapp-0.1.87-jupyterhub-goal-image.tgz \
  /tmp/codexapp-patched.tgz

RUN echo "10381a9574b37a60db24410fd572390088f98a444313ab6c8f732fbe70fe58c3  /tmp/codexapp-patched.tgz" \
      | sha256sum -c - \
    && npm install -g \
      /tmp/codexapp-patched.tgz \
      "@openai/codex@${CODEX_CLI_VERSION}" \
    && codexapp --help | grep -q -- "--host <host>" \
    && codex --version \
    && rm -f /tmp/codexapp-patched.tgz \
    && npm cache clean --force

# Restore the normal USER from the original Jupyter image here.
```

The release includes the Goal implementation from source commit `5de721e` and
the angle-bracket image fix from `14727a3`. Change both the release URL and
checksum when selecting a newer deployment build.

This package includes KaTeX equation rendering in conversations and local
Markdown previews, persisted Goal controls, and angle-bracket Markdown image
support. The launcher wheel is unchanged in behavior from the earlier
deployment build, but is duplicated in this release so both Docker downloads
use one release tag.

## Rebuild from source inside Docker

Use this slower alternative when the entire package must be reproduced inside
the Docker build rather than downloaded as a prebuilt release asset.

Use a multi-stage build so Docker clones, tests, builds, and packs the
deployment branch. The final image receives only the packed package.
The existing Jupyter image must provide Node.js 18 or newer and npm:

```dockerfile
FROM node:20-bookworm-slim AS codexapp-builder

ARG PNPM_VERSION=10.34.5

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      git \
      g++ \
      make \
      python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

RUN git clone \
      --branch personal/jupyterhub-deployment \
      https://github.com/DaehoYang/codex-mobile.git

WORKDIR /build/codex-mobile

RUN npx --yes pnpm@${PNPM_VERSION} install --no-frozen-lockfile \
    && npx --yes pnpm@${PNPM_VERSION} run test:unit \
    && npx --yes pnpm@${PNPM_VERSION} run build \
    && mkdir -p /artifacts \
    && npx --yes pnpm@${PNPM_VERSION} pack \
      --pack-destination /artifacts

FROM <existing-jupyter-gpu-image>

USER root

ARG CODEX_CLI_VERSION=0.144.4
COPY --from=codexapp-builder \
  /artifacts/codexapp-*.tgz \
  /tmp/codexapp-patched.tgz

RUN npm install -g \
      /tmp/codexapp-patched.tgz \
      "@openai/codex@${CODEX_CLI_VERSION}" \
    && codexapp --help | grep -q -- "--host <host>" \
    && codex --version \
    && rm -f /tmp/codexapp-patched.tgz \
    && npm cache clean --force

# Restore the normal USER from the original Jupyter image here.
```

The builder installs `python3`, `make`, and `g++` for native dependencies.
If the final `npm install -g` also needs to compile the optional `node-pty`
dependency, make the same tools available in the runtime stage during that
layer. `node-pty` is required for the integrated terminal.

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

When the launcher wheel is installed, open JupyterLab and select **Codex
Mobile** instead. It starts the process on an automatically selected loopback
port and opens:

```text
https://<jupyterhub>/user/<username>/codex/
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
