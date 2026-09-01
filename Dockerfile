# Built and run with podman; `podman build -t coracle .`
# ---- build ----
FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Surfaced on the About page; CI passes the real SHA
ARG BUILD_COMMIT=unknown
ENV VITE_BUILD_HASH=$BUILD_COMMIT
ENV VITE_BUILD_VERSION=$BUILD_COMMIT

# This bundle has OOM'd under the default heap ceiling
RUN NODE_OPTIONS=--max_old_space_size=4096 pnpm run build:web

# ---- serve ----
FROM alpine:3.21

# nginx-mod-http-brotli gives us brotli_static; without it the config falls back
# to gzip_static and costs ~200KB per cold load
RUN apk add --no-cache nginx nginx-mod-http-brotli \
 && mkdir -p /run/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
