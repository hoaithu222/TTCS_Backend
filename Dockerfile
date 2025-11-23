FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./

ENV NODE_ENV=production
RUN npm prune --production

EXPOSE 5000

# Command to run the app
CMD ["node", "dist/server.js"]