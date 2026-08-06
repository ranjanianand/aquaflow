# AquaFlow dashboard — Next.js standalone.
#
# NEXT_PUBLIC_API_URL is INLINED INTO THE JAVASCRIPT AT BUILD TIME. It must be
# a build argument, not a runtime variable: set it at runtime and the browser
# still calls whatever was baked in — 127.0.0.1:8000, which resolves to the
# visitor's own machine and fails with no useful error.
#
# On Railway, add it under Variables before the first build; Railway passes
# variables as build args automatically.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Fail the build if the API URL is missing. The alternative is a deploy that
# looks entirely successful and shows "Cannot reach the readings API" to every
# visitor — a failure that costs far more to diagnose than to prevent.
RUN test -n "$NEXT_PUBLIC_API_URL" || \
    (echo "NEXT_PUBLIC_API_URL is required at build time" && exit 1)
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 10001 nodejs && adduser -u 10001 -G nodejs -S nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Railway injects PORT. Next's standalone server reads it from the environment.
CMD ["node", "server.js"]
