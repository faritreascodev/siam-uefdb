FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma and enable pnpm
RUN apk add --no-cache openssl
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies (production + development for building)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the app
RUN pnpm run build

# Expose port
EXPOSE 4000

# Start production server
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm run start:prod"]
