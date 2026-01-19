FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Start development server with hot reload
CMD ["pnpm", "run", "start:dev"]
