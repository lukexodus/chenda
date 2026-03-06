FROM node:20-alpine AS base
WORKDIR /app

# Install production dependencies only
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Runtime image
FROM base AS runner
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Persistent volume for uploaded product images
VOLUME ["/app/uploads"]

EXPOSE 3001
CMD ["node", "app.js"]
