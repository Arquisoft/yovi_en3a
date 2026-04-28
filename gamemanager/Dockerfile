FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production --silent

COPY game-manager.js ./
COPY models/ ./models/

USER node

EXPOSE 5000
CMD ["node", "game-manager.js"]