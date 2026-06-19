# Docker deployment

This repository ships a production-ready container that builds the Vite SPA
and serves it with `nginx:alpine`. It targets a Ugreen NAS (or any Docker /
Docker Compose host) running on port `8080` by default.

## What's in here

- `Dockerfile` — multi-stage build: `node:22-alpine` compiles the app, then
  `nginx:1.27-alpine` serves the static output.
- `nginx.conf` — SPA fallback (`try_files ... /index.html`), gzip,
  immutable cache headers for `/assets/*`, no-cache for `index.html`.
- `docker-compose.yml` — single `pingsdorf` service exposing `8080:8080`.
- `.dockerignore` — keeps `node_modules`, tests, git metadata, and editor
  cruft out of the build context.

## Build & run locally

```bash
docker compose up -d --build
# then open http://localhost:8080
```

Stop and clean up:

```bash
docker compose down
```

## Deploying to a Ugreen NAS

The Ugreen NAS UI uses Docker under the hood. There are two reasonable paths:

### Option A — Build on the NAS (simplest)

1. Copy this whole folder to the NAS (e.g. via SMB, scp, or `git clone`).
2. SSH into the NAS, `cd` into the folder.
3. Run `docker compose up -d --build`.
4. Open `http://<nas-ip>:8080` in a browser.

This needs ~500 MB of free space for the build dependencies inside the image
build layers. The final image is ~50 MB.

### Option B — Build elsewhere, deploy a published image

1. Build and tag locally / in CI:
   ```bash
   docker build -t ghcr.io/<you>/pingsdorf:latest .
   docker push ghcr.io/<you>/pingsdorf:latest
   ```
2. On the NAS, replace the `build:` block in `docker-compose.yml` with:
   ```yaml
   image: ghcr.io/<you>/pingsdorf:latest
   ```
3. `docker compose pull && docker compose up -d`.

## Port collisions

Ugreen's own admin UI sometimes claims `80`, `443`, `8080`, or `5000`. If
`8080` is taken, change just the host side of the port mapping:

```yaml
ports:
  - "9090:8080"   # host 9090 -> container 8080
```

The container always listens on `8080` internally (so it can run as a
non-root user); only the host side changes.

## Behind a reverse proxy / HTTPS

The container speaks plain HTTP on `8080`. For HTTPS, terminate TLS at a
reverse proxy in front (Ugreen's built-in proxy, Caddy, Traefik, or
nginx-proxy-manager). Proxy all paths through — the SPA handles its own
routing.

## Verifying the image

```bash
docker compose up -d --build
docker compose ps                # state should be "healthy" within ~10s
docker compose logs -f pingsdorf # tail nginx logs
curl -sI http://localhost:8080/  # expect HTTP/1.1 200
```

The container's `HEALTHCHECK` hits `/` every 30s; `docker compose ps` will
flip to `unhealthy` if the SPA stops responding.

## Updating

```bash
git pull
docker compose up -d --build      # rebuilds & rolls the container
docker image prune -f             # reclaim space from old layers
```

## Notes & caveats

- **All data is currently client-side only.** Pings live in React state in
  the browser. Refreshing the page loses them. This is documented in
  `CLAUDE.md` under "Future Features — Backend and Database".
- The floor plan image is loaded from Wikimedia Commons at runtime, so the
  NAS needs outbound internet for the SPA to be useful.
- No volumes are mounted — there's nothing to persist yet. When the backend
  lands, add a `db` service and a named volume.
