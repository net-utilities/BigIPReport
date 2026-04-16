# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY webpack.config.cjs tsconfig.json ./
COPY src ./src
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY default.conf /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY underlay/ /usr/share/nginx/html/
COPY --from=builder /app/underlay/js/bigipreport.js /usr/share/nginx/html/js/bigipreport.js
