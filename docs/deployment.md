# Deployment Guide

JobFlow is designed to be self-hosted on a Raspberry Pi (or any Linux server) using Docker.

## Architecture

```
Internet → Router (80/443) → Server (Caddy) → Docker containers
                                    │
                   ┌────────────────┼────────────────┐
                   │                │                │
               Frontend         Backend         PostgreSQL
              (static)         (Express)          (DB)
```

## Stack

| Component     | Technology                                |
| ------------- | ----------------------------------------- |
| Reverse Proxy | Caddy (automatic HTTPS via Let's Encrypt) |
| Backend       | Node.js 22 on Alpine Linux                |
| Database      | PostgreSQL 16                             |
| Frontend      | Static files served by Caddy              |
| CI/CD         | GitHub Actions                            |

## Deployment Files

| File                           | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `docker-compose.prod.yml`      | Production container orchestration                  |
| `Caddyfile`                    | HTTPS reverse proxy configuration                   |
| `backend/Dockerfile`           | Backend image with Playwright for LinkedIn scraping |
| `frontend/Dockerfile`          | Frontend static build                               |
| `.github/workflows/deploy.yml` | CI/CD pipeline                                      |
| `.env.example`                 | Environment variables template                      |

## Initial Server Setup

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. Clone the repository

```bash
git clone git@github.com:YOUR_USER/jobflow.git /opt/jobflow
cd /opt/jobflow
```

### 3. Create production environment

```bash
cp .env.example .env
nano .env
```

Generate secrets:

```bash
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For REFRESH_TOKEN_SECRET
```

### 4. Configure DNS

Add an A record pointing your domain to your server's IP.

### 5. Configure router

Forward ports 80 and 443 to your server.

### 6. Start the application

```bash
docker compose -f docker-compose.prod.yml up -d
```

## CI/CD with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys on push to `main`:

1. Runs linting and tests
2. SSHs into the server
3. Pulls latest code
4. Builds Docker containers
5. Runs database migrations
6. Restarts services

### Required GitHub Secrets

| Secret       | Description       |
| ------------ | ----------------- |
| `PI_HOST`    | Server IP address |
| `PI_PORT`    | SSH port          |
| `PI_USER`    | SSH username      |
| `PI_SSH_KEY` | SSH private key   |

Add secrets via GitHub CLI:

```bash
gh secret set PI_HOST
gh secret set PI_PORT
gh secret set PI_USER
gh secret set PI_SSH_KEY < ~/.ssh/your_deploy_key
```

## Manual Operations

### Run database migrations

```bash
docker compose -f docker-compose.prod.yml run --rm db-migrate
```

### Restart services

```bash
docker compose -f docker-compose.prod.yml restart
```

### View container status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Rebuild and restart

```bash
docker compose -f docker-compose.prod.yml up -d --build
```
