FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
ENV NODE_ENV=production PORT=5175
EXPOSE 5175
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5175"]
