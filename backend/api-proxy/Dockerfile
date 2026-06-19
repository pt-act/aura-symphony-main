FROM node:26-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY server.js .
EXPOSE 3005
CMD ["node", "server.js"]