# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="DCMetas"

WORKDIR /app
ENV NODE_ENV="production"


# ========== Build Stage ==========
FROM base AS build

# Pacotes necessários para compilar better-sqlite3
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Instalar dependências (incluindo dev para build do frontend)
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copiar código e compilar frontend
COPY . .
RUN npm run build

# Remover dependências de desenvolvimento
RUN npm prune --omit=dev


# ========== Production Stage ==========
FROM base AS production

# Pacotes necessários para better-sqlite3 em runtime
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y libsqlite3-0 && \
    rm -rf /var/lib/apt/lists/*

# Copiar node_modules de produção
COPY --from=build /app/node_modules /app/node_modules

# Copiar backend modular
COPY --from=build /app/server.js /app/server.js
COPY --from=build /app/server /app/server
COPY --from=build /app/package.json /app/package.json

# Copiar frontend compilado
COPY --from=build /app/dist /app/dist

# Volume para persistência do SQLite
RUN mkdir -p /data
VOLUME /data

# Variáveis de ambiente padrão
ENV SQLITE_PATH="/data/database.sqlite"
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server.js"]
