# Development image for the Expo dev server (web build + Metro bundler).
# The source is bind-mounted by docker-compose.yml; node_modules lives in a
# named volume because the host's copy holds macOS-only native packages.
FROM node:22-bookworm-slim

COPY docker/node/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /app
ENTRYPOINT ["entrypoint"]
