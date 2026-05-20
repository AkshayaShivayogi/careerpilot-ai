# CareerPilot AI

Production-ready MERN career guidance platform.

## Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT, bcrypt

## Quick start

```bash
# 1. Start MongoDB
docker compose up -d

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Configure API (optional — defaults work locally)
cp server/.env.example server/.env

# 4. Run app
npm run dev
```

Open **http://localhost:5173**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + client (checks Mongo first) |
| `npm run dev:nocheck` | API + client without Mongo check |
| `npm run check:mongo` | Verify MongoDB is reachable |
| `npm run build` | Production frontend build |

## API

| Method | Path |
|--------|------|
| POST | `/api/auth/signup` |
| POST | `/api/auth/login` |
| GET | `/api/auth/me` |
| GET | `/api/dashboard` |
| PATCH | `/api/profile` |
| CRUD | `/api/roadmap`, `/api/interview`, `/api/resume`, `/api/dsa`, `/api/planner` |
| GET | `/api/trending` |

## Project structure

```
server/          Express API
src/             React client
scripts/         Dev utilities
```
