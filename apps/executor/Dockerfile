# Stage 1: Install dependencies
FROM node:20-slim AS base
RUN npm install -g pnpm

FROM base AS installer
WORKDIR /app
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/adapter-utils/ ./packages/adapter-utils/
COPY packages/adapters/ ./packages/adapters/
COPY apps/executor/ ./apps/executor/
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM installer AS builder
RUN pnpm --filter @aicompany/executor build

# Stage 3: Runtime
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=builder /app/apps/executor/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Install agent CLIs
RUN npm install -g @anthropic-ai/claude-code

EXPOSE 3200
CMD ["node", "dist/main.js"]
