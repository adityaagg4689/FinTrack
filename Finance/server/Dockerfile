FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./


RUN npm ci --only=production
COPY . .
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
EXPOSE 5000
CMD ["node", "src/index.js"]