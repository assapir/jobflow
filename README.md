# Jobo - Job Search Manager

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
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobo" > backend/.env
echo "PORT=3001" >> backend/.env

# 3. Install dependencies
npm install --prefix backend
npm install --prefix frontend --legacy-peer-deps

# 4. Push database schema
cd backend && DATABASE_URL="postgresql://postgres:postgres@localhost:5434/jobo" npm run db:push && cd ..

# 5. Start both servers
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobo
PORT=3002
```

### Docker Services

The `docker-compose.yml` starts:

- **PostgreSQL 16** on port `5434` (mapped from container port 5432)

## Project Structure

```
jobo/
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

| Method | Endpoint                    | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/api/linkedin/search`      | Search LinkedIn jobs (q, location)   |
| POST   | `/api/linkedin/cache/clear` | Clear the search results cache       |

## Development

### Running Tests

```bash
cd frontend
npm run test
```

### Linting

```bash
cd frontend
npm run lint
```

## License

MIT
