# Todo REST API

A simple Todo REST API built with Node.js, Express, PostgreSQL, and JWT authentication.

## Features

- User signup and login with bcrypt-hashed passwords
- JWT-protected todo CRUD endpoints
- Swagger UI at `/api-docs`
- Dockerized with PostgreSQL

## API Endpoints

| Method | Endpoint        | Auth | Description        |
|--------|-----------------|------|--------------------|
| POST   | /auth/signup    | No   | Register user      |
| POST   | /auth/login     | No   | Login, get JWT     |
| GET    | /health         | No   | Health check       |
| POST   | /todos          | Yes  | Create todo        |
| GET    | /todos          | Yes  | List user todos    |
| PUT    | /todos/:id      | Yes  | Update todo        |
| DELETE | /todos/:id      | Yes  | Delete todo        |

## Run with Docker (recommended)

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

## Run locally (without Docker)

1. Start PostgreSQL and create a database named `todoapp`.
2. Copy `.env.example` to `.env` and adjust values.
3. Install and start:

```bash
npm install
npm start
```

## Quick test

```bash
# Sign up
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

# Create todo (replace TOKEN)
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Buy milk","completed":false}'
```
