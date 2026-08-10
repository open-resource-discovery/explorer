# Stage 1: build the SPA
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY app/package*.json ./app/
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: nginx serving the SPA + reverse-proxying /proxy-api to the proxy sidecar
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
