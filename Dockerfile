# AquaFlow dashboard — static export, served by nginx.
#
# next.config sets `output: "export"`, so the build produces a directory of
# files and no Node server. An earlier version of this file copied
# .next/standalone and ran server.js, which that output mode never creates:
# the build failed at the COPY, after installing everything.
#
# NEXT_PUBLIC_API_URL IS INLINED INTO THE JAVASCRIPT AT BUILD TIME. It must be
# a build argument, not a runtime variable — set it at runtime and the browser
# still calls whatever was baked in, which is 127.0.0.1:8000: the visitor's own
# machine, failing with no useful error.
#
# On Railway, add it under Variables before the first build; Railway passes
# service variables to the builder automatically.

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

FROM nginx:1.27-alpine AS runner

# The export, and the config that serves it. The config is a template because
# Railway assigns $PORT per deploy and nginx cannot read the environment.
COPY --from=builder /app/out /usr/share/nginx/html
COPY deploy/railway-nginx.conf.template /etc/nginx/templates/default.conf.template

# The nginx image runs envsubst over /etc/nginx/templates at start-up. Only
# $PORT is substituted: leaving the list open would also replace nginx's own
# $uri and $host, breaking every location block.
ENV NGINX_ENVSUBST_FILTER="PORT"
ENV PORT=8080
EXPOSE 8080
