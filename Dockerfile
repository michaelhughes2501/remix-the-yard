# The Yard - Vite + Express
FROM node:20-alpine as base
WORKDIR /app
RUN npm install -g npm@11.17.0
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --frozen-lockfile --legacy-peer-deps || npm install --legacy-peer-deps

FROM node:20-alpine as builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/package.json .

RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001 && chown -R appuser:nodejs /app

USER appuser

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

EXPOSE 3000
CMD ["npm", "start"]
