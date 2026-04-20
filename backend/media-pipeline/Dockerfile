FROM node:22-slim

# Install FFmpeg for frame extraction and audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install --production

COPY server.js .

EXPOSE 3002 3003

CMD ["node", "server.js"]
