# syntax=docker/dockerfile:1

# Stage 1: Build & Compile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs and workspace package definitions
COPY package.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Compile TypeScript packages and applications
RUN npm run build

# Stage 2: Hardened Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy compiled artifacts and packages
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/ ./apps/

# Create non-root execution user for defense-in-depth
USER node

EXPOSE 4000

# Native healthcheck using Node.js
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('node:http').get('http://localhost:4000/api/v1/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "apps/web/dist/index.js"]

