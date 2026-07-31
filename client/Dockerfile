# --- Build Stage ---
FROM node:20-alpine AS build
WORKDIR /repo/client
COPY client/package*.json .
RUN npm ci
COPY client/ .
COPY CHANGELOG.md /repo/CHANGELOG.md
RUN npm run build

# --- Runtime Stage ---
FROM nginx:alpine
COPY --from=build /repo/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5173