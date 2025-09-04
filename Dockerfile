# Multi-stage build for Next.js app with Prisma

FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
# Install all deps including devDeps (needed for prisma generate in build stage)
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
# Generate Prisma client and build Next.js
RUN npx prisma generate && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps (skip postinstall scripts like prisma generate)
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

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
