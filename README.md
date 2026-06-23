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

## Monitoring

### Docker (Local)
Monitor CPU and memory usage:
```bash
docker stats
```

### AWS CloudWatch (ECS)
View metrics:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=todo-app-service \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average
```

View logs:
```bash
aws logs tail /ecs/todo-app --follow
```

## Debugging

### Health Check
```bash
curl http://localhost:3000/health
```

### View Logs
**Local (Docker):**
```bash
docker logs -f todo-app
```

**AWS (ECS):**
```bash
aws logs tail /ecs/todo-app --follow
```

### Check Database Connection
```bash
# Test connection
psql -U postgres -h localhost -d todoapp -c "SELECT 1;"

# View todos table
psql -U postgres -d todoapp -c "SELECT * FROM todos LIMIT 5;"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection error | Check `DATABASE_URL` is set in `.env` or ECS |
| JWT auth fails | Verify `JWT_SECRET` is same everywhere |
| Slow API | Check database indexes: `CREATE INDEX idx_user_id ON todos(user_id);` |
| Container memory error | Increase container memory in Terraform task definition |
