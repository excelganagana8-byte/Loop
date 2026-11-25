# Dockerfile for LOOP API Server
FROM node:20-alpine

WORKDIR /app

# Copy root manifests and package files
COPY package.json package-lock.json ./
COPY shared ./shared
COPY server ./server

# Install dependencies
RUN npm install --omit=dev

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace=server"]
