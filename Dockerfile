FROM node:24-alpine

WORKDIR /app

# Install deps (production only for runtime)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Railway provides PORT
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
