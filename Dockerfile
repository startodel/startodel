FROM node:26.13.1-bookworm-slim AS node

FROM node AS base
WORKDIR /app
RUN npm install --global corepack@0.36.0 && corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
RUN corepack install && pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN NITRO_PRESET=node-server pnpm build && find apps/web/.output -name '*.map' -delete

FROM node AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
WORKDIR /app/.output/server
COPY --from=build /app/apps/web/.output /app/.output
COPY packages/db/migrate.mjs docker/start.mjs ./
COPY packages/db/migrations/*.sql ./migrations/
COPY packages/db/migrations/meta/_journal.json ./migrations/meta/
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD ["node", "--input-type=module", "-e", "const r = await fetch('http://127.0.0.1:' + process.env.PORT + '/api/health'); const h = await r.json(); process.exit(r.ok && h.ok === true && h.db === 'up' ? 0 : 1)"]
CMD ["node", "start.mjs"]
