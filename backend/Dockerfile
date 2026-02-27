FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 4000

# Start development server with hot reload
CMD ["npm", "run", "start:dev"]
