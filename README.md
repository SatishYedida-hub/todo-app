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

## Setup & Local Development

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed and running
- [Git](https://git-scm.com/) installed

### Step 1: Clone the Repository

```bash
git clone https://github.com/SatishYedida-hub/todo-app.git
cd todo-app
```

### Step 2: Run with Docker (Easiest)

```bash
docker compose up --build
```

This starts:
- **API Server** - http://localhost:3000
- **PostgreSQL Database** - localhost:5432
- **Swagger UI** - http://localhost:3000/api-docs

Wait for all services to be healthy (about 10-15 seconds).

### Step 3: Test the API

```bash
# Sign up a new user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Copy the token from login response and use it in requests
# Replace TOKEN with actual token
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Buy groceries","completed":false}'
```

### Step 4: Stop the Application

```bash
docker compose down
```

---

## AWS Deployment (Production)

### Prerequisites

- AWS account with appropriate permissions
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- [Terraform](https://www.terraform.io/downloads) installed

### Step 1: Create AWS Infrastructure

Navigate to the terraform directory and create resources:

```bash
cd terraform
terraform init
terraform apply
```

Terraform will create:
- VPC and networking
- ECS Fargate cluster
- RDS PostgreSQL database
- Application Load Balancer (ALB)
- ECR repository for Docker images

This takes about 10-15 minutes.

### Step 2: Get AWS Outputs

After `terraform apply` completes, get your URLs:

```bash
cd terraform
terraform output health_url
terraform output swagger_url
```

Save these URLs for later use.

### Step 3: Set Up GitHub Secrets (for CI/CD)

To enable automatic deployments from GitHub:

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:
   - Name: `AWS_ACCESS_KEY_ID` | Value: Your AWS access key
   - Name: `AWS_SECRET_ACCESS_KEY` | Value: Your AWS secret key

You can get these from AWS IAM console.

### Step 4: Push Code to Deploy

```bash
git add .
git commit -m "Your changes"
git push origin main
```

GitHub Actions will automatically:
1. Build Docker image
2. Push to AWS ECR
3. Deploy to ECS
4. Restart the service

Check the deployment status in GitHub → **Actions**.

### Step 5: Access Your API

Once deployment completes (5-10 minutes):

- **Health Check:** `http://<alb-dns>/health`
- **Swagger UI:** `http://<alb-dns>/api-docs`
- **API Base URL:** `http://<alb-dns>`

Use the same curl commands as local testing, but replace `localhost:3000` with your ALB URL.

---

## Project Structure

```
todo-app/
├── src/
│   ├── index.js           # Application entry point
│   ├── server.js          # Express server setup
│   ├── routes/            # API routes
│   ├── middleware/        # JWT auth, error handling
│   ├── models/            # Database models
│   └── config/            # Configuration
├── Dockerfile             # Container image definition
├── docker-compose.yml     # Local development setup
├── terraform/             # AWS infrastructure code
│   ├── main.tf            # Main infrastructure
│   ├── variables.tf       # Terraform variables
│   └── outputs.tf         # Output values
├── .github/workflows/     # CI/CD pipeline
│   └── deploy.yml         # GitHub Actions workflow
├── package.json           # Node.js dependencies
└── README.md              # This file
```

---

## Monitoring

### Monitor Local Container

```bash
docker stats
```

### Monitor AWS Deployment

View logs in CloudWatch:
```bash
aws logs tail /ecs/todo-app --follow
```

View CPU/Memory metrics:
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

---

## Debugging

### Check Health

```bash
curl http://localhost:3000/health
```

### View Logs

Local Docker:
```bash
docker logs -f todo-app
```

AWS ECS:
```bash
aws logs tail /ecs/todo-app --follow
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Container won't start | Run `docker logs todo-app` to see error |
| Database connection error | Ensure `DATABASE_URL` is correct in `.env` |
| JWT authentication fails | Check `JWT_SECRET` is set in environment |
| Slow API responses | Check CloudWatch logs for database errors |
| Port 3000 already in use | Run `docker kill <container>` or use different port |

---

## Clean Up

### Local
```bash
docker compose down
```

### AWS (Delete all resources)
```bash
cd terraform
terraform destroy
```

**Warning:** This deletes all AWS resources and cannot be undone.

---

## Environment Variables

### Local (.env file)
```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todoapp
JWT_SECRET=dev-secret-key
API_URL=http://localhost:3000
```

### AWS (Set automatically by Terraform)
- `DATABASE_URL` - RDS connection string
- `JWT_SECRET` - Auto-generated
- `PORT` - 3000
- `API_URL` - ALB DNS name

---

## Repository Links

- **GitHub:** https://github.com/SatishYedida-hub/todo-app
- **Live API:** `http://<alb-dns>` (after AWS deployment)
- **Swagger Docs:** `http://<alb-dns>/api-docs` (after AWS deployment)

## Support

For issues or questions:
1. Check the logs with commands above
2. Review [Terraform README](terraform/README.md) for AWS details
3. Review [CI/CD README](.github/README.md) for deployment pipeline
