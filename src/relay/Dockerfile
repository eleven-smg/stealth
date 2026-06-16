FROM node:20-alpine AS builder
WORKDIR /app
COPY ../../package.json .
COPY ../../pnpm-lock.yaml .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY ../../src ./src
RUN pnpm run build --filter ./src/relay...

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/relay/index.js"]
