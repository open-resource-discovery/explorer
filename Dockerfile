# Stage 1: build the SPA
FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS builder
WORKDIR /app
COPY package*.json .npmrc ./
COPY app/package*.json ./app/
RUN npm install --global --ignore-scripts npm@11.20.0 && npm ci --ignore-scripts
COPY . .
RUN npm run build

# Stage 2: nginx serving the SPA + reverse-proxying /proxy-api to the proxy sidecar
FROM nginx:alpine@sha256:fb4658584bd9a916ffb6f6e365f97c25cfdb2923801f551ea08356e695f14ff7
COPY --from=builder /app/dist/app /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
