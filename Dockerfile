# syntax=docker/dockerfile:1

FROM node:16.19.1

WORKDIR /app
COPY .npmrc package.json package-lock.json index.js manifest.json webpack.config.js ./
RUN npm ci