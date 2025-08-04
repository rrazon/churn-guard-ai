# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S churnguard -u 1001 -G nginx

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chown -R churnguard:nginx /usr/share/nginx/html && \
    chown -R churnguard:nginx /var/cache/nginx && \
    chown -R churnguard:nginx /var/log/nginx && \
    chown -R churnguard:nginx /etc/nginx/conf.d

# Switch to non-root user
USER churnguard

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
