FROM node:20-alpine AS base
WORKDIR /app

# Install all deps needed for build
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# Development image (used by docker-compose.dev.yml)
FROM deps AS dev
COPY . .
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# Build the Next.js app
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Minimal runtime image using Next.js standalone output
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
