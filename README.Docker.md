# Docker Setup for Neha Surgical Frontend

This project is Docker-ready with configurations for both development and production environments.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Development Mode

Run the application in development mode with hot-reload:

```bash
# Using docker-compose
docker-compose --profile dev up

# Or build and run manually
docker build -f Dockerfile.dev -t neha-surgical-dev .
docker run -p 4200:4200 -v $(pwd)/src:/app/src neha-surgical-dev
```

The application will be available at `http://localhost:4200`

### Production Mode

Build and run the production-optimized version:

```bash
# Using docker-compose
docker-compose --profile prod up

# Or build and run manually
docker build -t neha-surgical-prod .
docker run -p 80:80 neha-surgical-prod
```

The application will be available at `http://localhost`

## Docker Commands

### Build Images

```bash
# Development image
docker build -f Dockerfile.dev -t neha-surgical:dev .

# Production image
docker build -t neha-surgical:prod .
```

### Run Containers

```bash
# Development (with hot-reload)
docker-compose --profile dev up -d

# Production
docker-compose --profile prod up -d

# Stop containers
docker-compose down
```

### View Logs

```bash
# Development logs
docker-compose logs -f neha-surgical-dev

# Production logs
docker-compose logs -f neha-surgical-prod
```

### Shell Access

```bash
# Development container
docker exec -it neha-surgical-dev sh

# Production container
docker exec -it neha-surgical-prod sh
```

## Configuration

### API Backend URL

Update the `public/appsettings.json` file to point to your API backend:

```json
{
  "apiUrl": "http://your-backend-api:5280"
}
```

### Environment Variables

Create a `.env` file from `.env.example` and update values as needed.

## Docker Compose Profiles

This setup uses Docker Compose profiles to separate development and production environments:

- **dev**: Development environment with hot-reload
- **prod**: Production environment with Nginx

Only one profile can be active at a time.

## Project Structure

```
├── Dockerfile              # Production multi-stage build
├── Dockerfile.dev          # Development configuration
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore          # Files to exclude from Docker context
├── nginx.conf             # Nginx configuration for production
└── README.Docker.md       # This file
```

## Production Optimizations

The production Docker image includes:

- Multi-stage build to minimize image size
- Nginx for efficient static file serving
- Gzip compression enabled
- Static asset caching (1 year)
- Security headers configured
- Angular routing support (SPA)

## Troubleshooting

### Port Already in Use

If port 4200 or 80 is already in use, modify the ports in `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Use port 8080 instead of 80
```

### Hot Reload Not Working

Ensure volume mappings are correct in `docker-compose.yml` and the `--poll` flag is set in the dev server command.

### Build Failures

Clear Docker cache and rebuild:

```bash
docker-compose down
docker system prune -f
docker-compose build --no-cache
```

## Network Configuration

If connecting to a backend API in Docker:

1. Ensure both containers are on the same network
2. Update `appsettings.json` with the backend service name
3. Use Docker DNS for service discovery

Example:
```json
{
  "apiUrl": "http://backend-api:5280"
}
```

## Health Checks

To add health checks, modify the `docker-compose.yml`:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)
