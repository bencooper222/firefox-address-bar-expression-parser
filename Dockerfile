# syntax=docker/dockerfile:1

FROM node:16.19.1

WORKDIR /app

RUN npm ci