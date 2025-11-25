# ============================================
# STAGE 1: Dependencias base
# ============================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar manifests necesarios del monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/tsconfig/package.json ./packages/tsconfig/
COPY apps/scanner/package.json ./apps/scanner/

# Instalar dependencias (todas las workspaces relevantes)
RUN pnpm install --frozen-lockfile

# ============================================
# STAGE 2: Builder - Compilar la app del scanner
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Reusar node_modules y paquetes ya resueltos
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/scanner/node_modules ./apps/scanner/node_modules

# Copiar todo el repo (codigo fuente)
COPY . .

WORKDIR /app/apps/scanner

# La URL del API se inyecta en build-time
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL

# Compilar bundle estatico
RUN pnpm run build

# ============================================
# STAGE 3: Runner - nginx sirviendo estaticos
# ============================================
FROM nginx:alpine AS runner

# Configurar nginx para SPA
COPY apps/scanner/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados
COPY --from=builder /app/apps/scanner/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
