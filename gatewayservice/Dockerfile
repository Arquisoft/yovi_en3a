FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --silent

#Copies code from project to container
COPY . . 
EXPOSE 8000
CMD ["node", "gateway-service.js"]