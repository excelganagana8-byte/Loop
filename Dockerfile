# Dockerfile for LOOP API Server (Monorepo root)
FROM node:20-alpine

WORKDIR /app

# Copy root manifests and workspace configs
COPY package.json package-lock.json ./
COPY shared ./shared
COPY server ./server

# Install production dependencies across monorepo
RUN npm install --omit=dev

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "run", "start", "--workspace=server"]
