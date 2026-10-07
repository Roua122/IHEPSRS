# Local Development

## Prerequisites
- Git
- Node.js 24 LTS
- pnpm 12
- Docker Desktop or compatible Docker Engine

## First setup

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:up
pnpm dev
```

## Expected local services

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| Central API | http://localhost:3000/api |
| API Health | http://localhost:3000/api/health |
| Swagger | http://localhost:3000/api/docs |
| Mock University | http://localhost:3100 |
| Mock Health | http://localhost:3100/health |
| Mock Students | http://localhost:3100/students |
| PostgreSQL | localhost:5432 |

## Before work each day

```powershell
git checkout main
git pull origin main
pnpm install
pnpm db:up
```

Then create a Task branch.

## Notes
- Commit `pnpm-lock.yaml` after the first successful installation.
- Do not commit `.env`.
- Do not put real passwords/secrets into `.env.example`.
