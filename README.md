# JobFlow - Job Search Manager

> _Where applications flow, offers follow_

A modern job search management application with a Trello-style kanban board to track your job applications.

## Features

- 📋 **Kanban Board** - 6 columns: Wishlist, Applied, Phone Screen, Interview, Offer, Rejected
- 🖱️ **Drag & Drop** - Easily move jobs between stages
- 🔍 **LinkedIn Job Search** - Search and import jobs directly from LinkedIn
- 🌙 **Dark/Light Theme** - Beautiful glassmorphism design
- 🌐 **i18n Support** - English and Hebrew languages
- 📱 **Responsive** - Works on all screen sizes

## Tech Stack

| Layer    | Technologies                                         |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, Vite 6, Mantine v7, @hello-pangea/dnd      |
| Backend  | Node.js, Express 5, TypeScript, Drizzle ORM, Zod     |
| Database | PostgreSQL 17                                        |
| Infra    | Docker, Caddy, Cloudflare Tunnel, GitHub Actions     |

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Setup backend
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobflow" > backend/.env
npm install --prefix backend
cd backend && npm run db:push && cd ..

# 3. Setup frontend
npm install --prefix frontend --legacy-peer-deps

# 4. Run
npm run dev
```

## Development

```bash
# Run tests
cd frontend && npm test
cd backend && npm test

# Linting
cd frontend && npm run lint
cd backend && npm run lint
```

## Documentation

- [Deployment Guide](docs/deployment.md) - Production setup, CI/CD, server configuration
- [Operations Guide](docs/operations.md) - Logging, monitoring, troubleshooting

## API Endpoints

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| GET    | `/api/jobs`           | Get all job applications   |
| GET    | `/api/jobs/:id`       | Get a specific job         |
| POST   | `/api/jobs`           | Create new job application |
| PUT    | `/api/jobs/:id`       | Update job application     |
| DELETE | `/api/jobs/:id`       | Delete job application     |
| PATCH  | `/api/jobs/:id/stage` | Update job stage           |
| PATCH  | `/api/jobs/reorder`   | Reorder jobs (drag-drop)   |
| GET    | `/api/linkedin/search`| Search LinkedIn jobs       |
| GET    | `/api/auth/status`    | Auth configuration status  |
| GET    | `/api/auth/linkedin`  | Initiate LinkedIn OAuth    |
| GET    | `/api/auth/linkedin/callback` | OAuth callback       |
| POST   | `/api/auth/refresh`   | Refresh access token       |
| GET    | `/api/auth/me`        | Get current user           |
| POST   | `/api/auth/logout`    | Logout                     |
| GET    | `/api/auth/profile`   | Get user profile           |
| PATCH  | `/api/auth/profile`   | Update user profile        |
| GET    | `/api/health`         | Health check (public)      |
| GET    | `/api/metrics`        | System metrics (auth required) |

## License

MIT
