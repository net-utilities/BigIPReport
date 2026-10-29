# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY webpack.config.cjs tsconfig.json ./
COPY src ./src
COPY underlay ./underlay
RUN npm run build \
    && sed -i "s#js/bigipreport.js#js/bigipreport.js?v=$(sha256sum underlay/js/bigipreport.js | cut -c1-12)#" underlay/index.html

FROM ghcr.io/nginx/nginx-unprivileged:stable-alpine3.24
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/underlay/ /usr/share/nginx/html/
