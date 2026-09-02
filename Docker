# ---- Build-Stage ----
FROM node:20-alpine AS builder
WORKDIR /repo

# Root-Package-Definitionen zuerst (für npm-Workspaces-Erkennung)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/mobile/package.json apps/mobile/package.json

RUN npm ci

COPY apps/api apps/api
COPY tsconfig*.json ./

RUN npm run build --workspace=apps/api

# ---- Runtime-Stage, schlank ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /repo/apps/api/dist ./dist
COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/package.json ./package.json

ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]
