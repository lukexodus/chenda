FROM node:20-alpine AS base
WORKDIR /app

# Install all dependencies for development target
FROM base AS dev-deps
COPY package.json package-lock.json* ./
RUN npm ci

# Install production dependencies only
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Development image (used by docker-compose.dev.yml)
FROM base AS dev
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "dev"]

# Runtime image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persistent volume for uploaded product images
VOLUME ["/app/uploads"]

EXPOSE 3001
CMD ["node", "app.js"]
