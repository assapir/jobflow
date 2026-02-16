# Deployment Guide

JobFlow is designed to be self-hosted on a Raspberry Pi (or any Linux server) using Docker.

## Architecture

```
Internet → Cloudflare (HTTPS) → Tunnel → cloudflared → Caddy → Docker containers
                                                          │
                                         ┌────────────────┼────────────────┐
                                         │                │                │
                                     Frontend         Backend         PostgreSQL
                                    (static)         (Express)          (DB)
```

No open ports on the server or router. The Cloudflare Tunnel creates an outbound-only connection from the server to Cloudflare's edge network.

## Stack

| Component     | Technology                                     |
| ------------- | ---------------------------------------------- |
| Ingress       | Cloudflare Tunnel (HTTPS, no open ports)       |
| Reverse Proxy | Caddy (HTTP internally, TLS handled by Tunnel) |
| Backend       | Node.js 22 on Alpine Linux                     |
| Database      | PostgreSQL 16                                  |
| Frontend      | Static files served by Caddy                   |
| CI/CD         | GitHub Actions                                 |

## Deployment Files

| File                           | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `docker-compose.prod.yml`      | Production container orchestration                  |
| `Caddyfile`                    | HTTP reverse proxy configuration (internal)         |
| `cloudflared-config.yml`       | Cloudflare Tunnel routing configuration             |
| `cloudflared-credentials.json` | Tunnel credentials (not in git, see setup below)    |
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

### 4. Set up Cloudflare Tunnel

No open ports or port forwarding required. The tunnel connects outbound to Cloudflare.

```bash
# Install cloudflared
# Arch: yay -S cloudflared
# Or: curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared

# Authenticate with Cloudflare
cloudflared tunnel login

# Create the tunnel
cloudflared tunnel create jobflow

# Route DNS (replace with your domain)
cloudflared tunnel route dns --overwrite-dns jobflow jobflow.yourdomain.com

# Copy credentials to the project directory
cp ~/.cloudflared/<TUNNEL_ID>.json /opt/jobflow/cloudflared-credentials.json
```

Update the tunnel ID in `cloudflared-config.yml` to match your tunnel.

### 5. Start the application

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
