FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache openssl chromium nss freetype harfbuzz ca-certificates ttf-freefont
RUN corepack enable pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código y prisma
COPY . .

# Generar cliente de Prisma y compilar el proyecto
RUN npx prisma generate
RUN pnpm run build

# Configurar Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Puerto
EXPOSE 4000

# Comando de arranque con seeding y búsqueda de main.js
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-demo.js && if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]
