# Use Node.js 18 Alpine base image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only for smaller image)
RUN npm ci --only=production

# Copy TypeScript configuration
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Install dev dependencies needed for build
RUN npm install --save-dev typescript

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port 3001
EXPOSE 3001

# Set CMD to start server
CMD ["node", "dist/server.js"]
