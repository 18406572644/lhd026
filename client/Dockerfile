FROM node:20-alpine AS builder

ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2026
ENV HOST=0.0.0.0

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package*.json ./

EXPOSE 2026

CMD ["node", ".output/server/index.mjs"]
