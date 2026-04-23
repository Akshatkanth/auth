# Full-Stack Authentication and Notes Management System

This repository is a full-stack project built to match a backend-focused assignment. It includes secure user authentication, role-based access control, CRUD APIs for a secondary entity, a basic React frontend, API documentation, and MongoDB schema documentation.

## Project Overview

The application is split into two parts:

- `backend` - Express + TypeScript API with MongoDB, JWT authentication, validation, sanitization, and role-based authorization
- `frontend` - React + TypeScript + Vite UI for authentication, protected access, and notes CRUD operations

The secondary entity used in this project is `notes`.

## Assignment Requirements Covered

### Backend

- User registration and login APIs
- Password hashing with `bcryptjs`
- JWT-based authentication with access token + refresh token flow
- Role-based access for `user` and `admin`
- CRUD APIs for notes
- API versioning through `/api/v1`
- Centralized error handling
- Request validation with `zod`
- API documentation through Postman collection
- MongoDB schema documentation

### Frontend

- Built with React.js
- Register and login forms
- Protected dashboard after authentication
- CRUD actions for notes
- API-driven success and error messages
- Admin-only management tools for user listing, role updates, and deletion

### Security and Scalability

- Password hashing
- Secure refresh token handling with HTTP-only cookie
- Access token sent in `Authorization` header
- Input validation and sanitization
- Helmet, CORS, rate limiting, compression, and logging
- Modular backend structure for future feature expansion

Optional additions like Redis caching and Docker deployment are not included yet, but the current structure is ready for those extensions.

## Tech Stack

- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Zod
- Frontend: React, TypeScript, Vite
- Security: bcryptjs, helmet, express-rate-limit, cookie-parser
- Logging: pino, pino-http
- API Docs: Postman collection

## Features

### Authentication

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/admin`

### Role-Based Access

- Regular users can manage only their own notes
- Admin users can access all notes
- Admin users can list users, change roles, and delete users

Admin endpoints already implemented:

- `GET /api/v1/auth/users`
- `PATCH /api/v1/auth/users/:userId/role`
- `DELETE /api/v1/auth/users/:userId`

### Notes CRUD

- `POST /api/v1/notes`
- `GET /api/v1/notes`
- `GET /api/v1/notes/:noteId`
- `PATCH /api/v1/notes/:noteId`
- `DELETE /api/v1/notes/:noteId`

## Project Structure

```text
auth/
|-- backend/
|   |-- docs/
|   |   |-- database-schema.md
|   |   `-- postman/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- api.ts
|   |   `-- App.tsx
|   `-- package.json
`-- README.md
```

## Local Setup

### Prerequisites

- Node.js 22+
- MongoDB running locally or on a cloud instance

### Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Environment Variables

### Backend

Create `backend/.env` with:

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
ENABLE_DEMO_ADMIN=true
DEMO_ADMIN_EMAIL=demo-admin@notes.app
DEMO_ADMIN_PASSWORD=Admin@12345!
```

### Frontend

Copy `frontend/.env.example` to `frontend/.env` or create it with:

```env
VITE_API_URL=http://localhost:4000
VITE_DEMO_ADMIN_EMAIL=demo-admin@notes.app
VITE_DEMO_ADMIN_PASSWORD=Admin@12345!
```

## Running the Project

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

## API Documentation

This project currently provides API documentation through Postman:

- [backend/docs/postman/auth-notes-api.postman_collection.json](/c:/Users/Akshat/Documents/GitHub/auth/backend/docs/postman/auth-notes-api.postman_collection.json)
- [backend/docs/postman/auth-notes-local.postman_environment.json](/c:/Users/Akshat/Documents/GitHub/auth/backend/docs/postman/auth-notes-local.postman_environment.json)

Swagger is not set up in this repository at the moment. For this submission, Postman is the included API documentation format.

## Database Schema

MongoDB schema documentation is available here:

- [backend/docs/database-schema.md](/c:/Users/Akshat/Documents/GitHub/auth/backend/docs/database-schema.md)

Collections used:

- `users`
- `notes`

## Validation, Error Handling, and Versioning

- API base path is versioned under `/api/v1`
- Request payloads and params are validated using `zod`
- Errors are handled through centralized middleware
- Input sanitization removes suspicious keys from request body, query, and params

## Frontend Flow

The frontend supports the core assignment flow:

- Register a new account
- Log in with an existing account
- Restore a session using refresh token flow
- Access a protected notes dashboard
- Create, update, archive, and delete notes
- Display backend validation and API response messages in the UI

## Deliverables Included

- Backend project hosted in GitHub with setup instructions in `README.md`
- Working authentication APIs
- Working CRUD APIs for notes
- Basic frontend UI connected to backend APIs
- API documentation through Postman collection
- Database schema documentation for MongoDB

## CI

GitHub Actions workflow is included at [ci.yml](/c:/Users/Akshat/Documents/GitHub/auth/.github/workflows/ci.yml) and runs lint/build checks for backend and frontend.
