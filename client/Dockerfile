FROM node:20-alpine
WORKDIR /repo/client
COPY client/package*.json .
RUN npm ci
COPY client/ .
COPY CHANGELOG.md /repo/CHANGELOG.md
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]