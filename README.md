# JobFlow - Job Search Manager

> _Where applications flow, offers follow_

A modern job search management application with a Trello-style kanban board to track your job applications.

## Tech Stack

### Frontend

- **React 19** - Latest React with TypeScript
- **Vite 6** - Fast build tool
- **Mantine v7** - Beautiful UI components
- **@hello-pangea/dnd** - Drag and drop functionality
- **react-i18next** - Internationalization (English & Hebrew)
- **Vitest** - Testing framework
- **oxlint** - Fast Rust-based linter

### Backend

- **Node.js + Express** - API server
- **TypeScript** - Type safety
- **Drizzle ORM** - Lightweight, type-safe ORM
- **PostgreSQL** - Database
- **Zod** - Schema validation
- **Crawlee + Playwright** - Web scraping for LinkedIn job search

## Features

- 📋 **Kanban Board** - 6 columns: Wishlist, Applied, Phone Screen, Interview, Offer, Rejected
- 🖱️ **Drag & Drop** - Easily move jobs between stages
- 🔍 **LinkedIn Job Search** - Search and import jobs directly from LinkedIn
- 🌙 **Dark/Light Theme** - Beautiful glassmorphism design
- 🌐 **i18n Support** - English and Hebrew languages
- 📱 **Responsive** - Works on all screen sizes

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- npm or yarn

### Quick Start

```bash
# 1. Start PostgreSQL with Docker
docker compose up -d

# 2. Create backend .env file
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobflow" > backend/.env
echo "PORT=3001" >> backend/.env

# 3. Install dependencies
npm install --prefix backend
npm install --prefix frontend --legacy-peer-deps

# 4. Push database schema
cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5434/jobflow" npm run db:push && cd ..

# 5. Start both servers
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobflow
PORT=3002
```

### Docker Services

The `docker-compose.yml` starts:

- **PostgreSQL 16** on port `5434` (mapped from container port 5432)

## Project Structure

```
jobflow/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   └── index.ts       # DB connection
│   │   ├── routes/
│   │   │   ├── jobs.ts        # Job routes
│   │   │   └── linkedin.ts    # LinkedIn search routes
│   │   ├── controllers/
│   │   │   ├── jobs.ts        # Job controllers
│   │   │   └── linkedin.ts    # LinkedIn search controller
│   │   ├── services/
│   │   │   └── linkedinScraper.ts  # LinkedIn scraper service
│   │   └── index.ts           # Express app
│   ├── drizzle/               # Migrations
│   ├── drizzle.config.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks
│   │   ├── api/               # API client
│   │   ├── i18n/              # Translations
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## API Endpoints

### Jobs

| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| GET    | `/api/jobs`           | Get all job applications   |
| GET    | `/api/jobs/:id`       | Get a specific job         |
| POST   | `/api/jobs`           | Create new job application |
| PUT    | `/api/jobs/:id`       | Update job application     |
| DELETE | `/api/jobs/:id`       | Delete job application     |
| PATCH  | `/api/jobs/:id/stage` | Update job stage           |
| PATCH  | `/api/jobs/reorder`   | Reorder jobs (drag-drop)   |

### LinkedIn Search

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/api/linkedin/search`      | Search LinkedIn jobs (q, location) |
| POST   | `/api/linkedin/cache/clear` | Clear the search results cache     |

## Development

### Running Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

### Linting

```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && npm run lint
```

## Production Deployment

JobFlow is designed to be self-hosted on a Raspberry Pi (or any Linux server) using Docker.

### Architecture

```
Internet → Router (80/443) → Raspberry Pi (Caddy) → Docker containers
                                      │
                     ┌────────────────┼────────────────┐
                     │                │                │
                 Frontend         Backend         PostgreSQL
                (static)         (Express)          (DB)
```

### Stack

| Component     | Technology                                |
| ------------- | ----------------------------------------- |
| Reverse Proxy | Caddy (automatic HTTPS via Let's Encrypt) |
| Backend       | Node.js 22 on Alpine Linux                |
| Database      | PostgreSQL 16                             |
| Frontend      | Static files served by Caddy              |
| CI/CD         | GitHub Actions                            |

### Deployment Files

| File                           | Purpose                                             |
| ------------------------------ | --------------------------------------------------- |
| `docker-compose.prod.yml`      | Production container orchestration                  |
| `Caddyfile`                    | HTTPS reverse proxy configuration                   |
| `backend/Dockerfile`           | Backend image with Playwright for LinkedIn scraping |
| `frontend/Dockerfile`          | Frontend static build                               |
| `.github/workflows/deploy.yml` | CI/CD pipeline                                      |
| `.env.example`                 | Environment variables template                      |

### Initial Server Setup

1. **Install Docker** on your server:

   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone the repository**:

   ```bash
   git clone git@github.com:YOUR_USER/jobflow.git /opt/jobflow
   cd /opt/jobflow
   ```

3. **Create production `.env`**:

   ```bash
   cp .env.example .env
   nano .env
   ```

   Generate secrets with:

   ```bash
   openssl rand -base64 64  # For JWT_SECRET
   openssl rand -base64 64  # For REFRESH_TOKEN_SECRET
   ```

4. **Configure DNS**: Add an A record pointing your domain to your server's IP.

5. **Configure router**: Forward ports 80 and 443 to your server.

6. **Start the application**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### CI/CD with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys on push to `main`:

1. Runs linting and tests
2. SSHs into the server
3. Pulls latest code
4. Builds Docker containers
5. Runs database migrations
6. Restarts services

**Required GitHub Secrets:**

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

### Manual Operations

**Run database migrations:**

```bash
docker compose -f docker-compose.prod.yml run --rm db-migrate
```

**View logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f
```

**Restart services:**

```bash
docker compose -f docker-compose.prod.yml restart
```

## License

MIT
