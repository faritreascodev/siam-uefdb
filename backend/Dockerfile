# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install all dependencies for build
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dependencies for Puppeteer and Prisma
RUN apk add --no-cache openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont
RUN corepack enable pnpm

# Copy build assets and production dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Puppeteer Configuration for Alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Expose port
EXPOSE 4000

# Start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
