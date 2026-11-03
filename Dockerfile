# Optimized multi-stage Docker build for Full-Stack Node + React website
FROM node:20-slim AS builder

WORKDIR /app

# Prisma engines require OpenSSL at build time for generate/build tasks
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy dependency mappings
COPY package*.json ./

# Install packages
RUN npm ci

# Copy codebase
COPY . .

# Generate Prisma client during build so runtime imports are always initialized.
RUN npm run prisma:generate

# Build Client static SPA + esbuild compiled Express backend server
RUN npm run build

# Stage 2: Runtime Container
FROM node:20-slim AS runner

WORKDIR /app

# Prisma engines require OpenSSL at runtime for DB operations
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy necessary files from build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts/startup_helpers/init_db.sh ./scripts/startup_helpers/init_db.sh

RUN chmod +x ./scripts/startup_helpers/init_db.sh

EXPOSE 3000

# Entrypoint is centralized in package.json start script
CMD ["npm", "start"]
