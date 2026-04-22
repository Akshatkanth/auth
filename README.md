# Full-Stack Auth Starter (Express + React + MongoDB)

This project gives you a simple but production-minded auth setup:

- Backend: Express + TypeScript + MongoDB + JWT (access/refresh)
- Frontend: React + TypeScript + Vite
- Security: Helmet, CORS with credentials, rate limiting, password hashing, validation, HTTP-only refresh cookie
- Scalability: Modular backend structure, logging, compression, input sanitization, API versioning, health endpoint, CI checks

## Features Included

- Email/password register and login
- Strong password policy validation
- JWT access token for API authorization
- Refresh token rotation with HTTP-only cookie
- Role-based authorization (`user`, `admin`)
- Protected profile route
- Admin-only route
- Notes module with role-aware CRUD APIs
- Versioned REST API (`/api/v1`)
- Postman collection and environment export

## Project Structure

- `backend` - Auth API and database layer
- `frontend` - Auth UI and API client
- `.github/workflows/ci.yml` - GitHub Actions for lint + build
- `backend/docs/database-schema.md` - MongoDB schema documentation
- `backend/docs/postman` - Postman collection + environment

## 1) Setup

### Prerequisites

- Node.js 22+
- MongoDB (local or cloud)

### Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2) Environment Variables

### Backend

Copy `backend/.env.example` to `backend/.env` and update values:

```env
NODE_ENV=development
PORT=4000
MONGO_URI=mongodb://localhost:27017/auth_demo
JWT_ACCESS_SECRET=replace-with-strong-access-secret
JWT_REFRESH_SECRET=replace-with-strong-refresh-secret
JWT_ISSUER=auth-api
JWT_AUDIENCE=auth-client
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000
```

## 3) Run Locally

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:4000`.

## 4) API Routes

Primary base path: `/api/v1`

Auth routes:

- `POST /api/v1/auth/register` - create account
- `POST /api/v1/auth/login` - login and issue tokens
- `POST /api/v1/auth/refresh` - rotate refresh token and issue new access token
- `POST /api/v1/auth/logout` - clear session cookie
- `GET /api/v1/auth/me` - protected user profile route
- `GET /api/v1/auth/admin` - protected admin-only route

Notes routes:

- `POST /api/v1/notes` - create note (authenticated)
- `GET /api/v1/notes` - list notes (user -> own notes, admin -> all notes)
- `GET /api/v1/notes/:noteId` - fetch note by id
- `PATCH /api/v1/notes/:noteId` - update note (owner/admin)
- `DELETE /api/v1/notes/:noteId` - delete note (owner/admin)

Backward-compatible aliases (`/api/auth/*`, `/api/notes/*`) are still mounted.

## 5) Security Notes

- Refresh token is stored in HTTP-only cookie, not in local storage.
- Access token is returned in response body and used in Authorization header.
- JWT includes and verifies issuer/audience claims.
- Passwords are hashed with bcrypt.
- Input validation is enforced using zod.
- Input sanitization strips suspicious keys (e.g., `$` and `.` operators) from body/query/params.
- Basic rate limiting is applied on `/api`.

For production:

- Set `COOKIE_SECURE=true`
- Use strong random JWT secrets
- Use HTTPS only
- Consider adding Redis for distributed session/token revocation
- Add structured monitoring/alerting and centralized logs

## 6) Push to GitHub

From project root:

```bash
git init
git add .
git commit -m "feat: full-stack auth starter"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## 7) API Documentation (Postman)

Import these files into Postman:

- `backend/docs/postman/auth-notes-api.postman_collection.json`
- `backend/docs/postman/auth-notes-local.postman_environment.json`

## 8) Database Schema

Schema details are documented in:

- `backend/docs/database-schema.md`

## 9) CI

GitHub Actions is included in `.github/workflows/ci.yml`.
It runs backend and frontend lint/build checks on push and pull requests.
