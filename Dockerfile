# Multi-stage build for Angular application

# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/ns-app /usr/share/nginx/html

# Copy appsettings.json to be accessible
COPY --from=builder /app/dist/ns-app/browser /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
