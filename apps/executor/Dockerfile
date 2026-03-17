FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS installer
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
# Copy only package.json files first for layer caching
COPY packages/shared/package.json packages/shared/
COPY packages/adapters/package.json packages/adapters/
COPY packages/adapter-utils/package.json packages/adapter-utils/
COPY apps/executor/package.json apps/executor/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/shared/node_modules packages/shared/node_modules
COPY --from=installer /app/packages/adapters/node_modules packages/adapters/node_modules
COPY --from=installer /app/packages/adapter-utils/node_modules packages/adapter-utils/node_modules
COPY --from=installer /app/apps/executor/node_modules apps/executor/node_modules
# Copy source
COPY packages/shared packages/shared
COPY packages/adapters packages/adapters
COPY packages/adapter-utils packages/adapter-utils
COPY apps/executor apps/executor
# Build in dependency order
RUN pnpm --filter @aicompany/shared build
RUN pnpm --filter @aicompany/adapter-utils build
RUN pnpm --filter @aicompany/adapters build
RUN pnpm --filter @aicompany/executor build

FROM node:20-alpine AS runner
WORKDIR /app
# Install claude CLI globally before copying app files
RUN npm install -g @anthropic-ai/claude-code
# Copy executor dist and its runtime dependencies
COPY --from=builder /app/apps/executor/dist ./dist
COPY --from=builder /app/apps/executor/node_modules ./node_modules
# Copy workspace package dists (resolved as local deps)
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/adapters/dist ./packages/adapters/dist
COPY --from=builder /app/packages/adapter-utils/dist ./packages/adapter-utils/dist

ENV PORT=3200
EXPOSE 3200
CMD ["node", "dist/main.js"]
