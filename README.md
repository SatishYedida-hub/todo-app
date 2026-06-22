# Todo REST API

A simple Todo REST API built with Node.js, Express, PostgreSQL, and JWT authentication.

## Features

- User signup and login with bcrypt-hashed passwords
- JWT-protected todo CRUD endpoints
- Swagger UI at `/api-docs`
- Dockerized with PostgreSQL
- AWS ECS Fargate deployment (Terraform)
- GitHub Actions CI/CD pipeline

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

## Run with Docker (local)

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs

## AWS Deployment (ECS Fargate)

Deploy to AWS using Terraform (ECR + ECS Fargate + ALB + RDS):

```powershell
# Windows
.\scripts\deploy-aws.ps1
```

```bash
# Linux / macOS
./scripts/deploy-aws.sh
```

See [terraform/README.md](terraform/README.md) for full details.

After deploy:
- **Health:** `http://<alb-dns>/health`
- **Swagger:** `http://<alb-dns>/api-docs`

Get URLs: `cd terraform && terraform output`

## CI/CD (GitHub Actions)

Automated pipeline deploys to ECS on every push to `main`:

1. Checkout code
2. Build Docker image
3. Push image to Amazon ECR
4. Deploy updated image to ECS

**Setup:** Add GitHub Secrets `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`, then push to `main`.

See [.github/README.md](.github/README.md) for IAM policy and full setup.

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

