# Multi-stage build for Next.js app with Prisma

FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
# Install all deps including devDeps (needed for prisma generate in build stage)
# System deps needed by Prisma engines
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl libssl3 \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm ci --ignore-scripts

FROM node:20-slim AS builder
WORKDIR /app
# System deps needed by Prisma engines during generate
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl libssl3 \
	&& rm -rf /var/lib/apt/lists/*
COPY package*.json ./
# Reuse deps installed earlier to avoid reinstall
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
 # Ensure Prisma runtime has OpenSSL available
RUN apt-get update -y \
	&& apt-get install -y --no-install-recommends openssl libssl3 \
	&& rm -rf /var/lib/apt/lists/*

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy necessary runtime artifacts
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
# Copy generated Prisma client and engines from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expose port and run
EXPOSE 3000
CMD ["npm", "run", "start"]
