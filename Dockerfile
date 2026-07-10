# Stage 1: Build stage
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma
RUN bun prisma generate

# Copy source code and build Next.js application
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Stage 2: Runner stage
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=2202
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only the necessary files for production run
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/lib/generated/prisma ./lib/generated/prisma

EXPOSE 2202

# Run migrations and start the next server
CMD ["sh", "-c", "bun prisma migrate deploy && bun run start"]
