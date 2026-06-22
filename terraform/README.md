# AWS Deployment (ECS Fargate)

Terraform configuration to deploy the Todo API on **AWS ECS Fargate** with **ECR**, **ALB**, and **RDS PostgreSQL**.

## Architecture

```
Internet
   │
   ▼
Application Load Balancer (public, port 80)
   │
   ▼
ECS Fargate Service (public subnets, port 3000)
   │
   ▼
RDS PostgreSQL (private subnets, port 5432)
```

## Resources created

| Resource | Purpose |
|----------|---------|
| VPC + subnets | Network isolation (2 public, 2 private AZs) |
| ECR repository | Stores Docker images |
| ECS Fargate cluster | Runs containers without managing servers |
| ECS task definition | Container config (image, env, logs) |
| ECS service | Keeps 1 task running behind ALB |
| Application Load Balancer | Public HTTP entry point |
| Target group + listener | Routes traffic to ECS tasks, `/health` check |
| Security groups | ALB ← internet, ECS ← ALB, RDS ← ECS |
| RDS PostgreSQL | Application database |
| CloudWatch Logs | Container logs at `/ecs/todo-app` |

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured (`aws configure`)
- [Terraform](https://www.terraform.io/downloads) >= 1.5
- [Docker](https://www.docker.com/) running
- IAM permissions for ECS, ECR, EC2, RDS, ELB, IAM, CloudWatch

## Deploy

### Option A: One-command deploy (recommended)

**Windows (PowerShell):**
```powershell
.\scripts\deploy-aws.ps1
```

**Linux / macOS:**
```bash
chmod +x scripts/deploy-aws.sh
./scripts/deploy-aws.sh
```

This script:
1. Runs `terraform apply` (creates all AWS resources)
2. Builds and pushes the Docker image to ECR
3. Forces a new ECS deployment

### Option B: Manual steps

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # optional
terraform init
terraform apply
```

Push the image:
```bash
ECR_URL=$(terraform output -raw ecr_repository_url)
AWS_REGION=$(terraform output -raw aws_region)

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${ECR_URL%%/*}
docker build -t $ECR_URL:latest ..
docker push $ECR_URL:latest

aws ecs update-service \
  --cluster $(terraform output -raw ecs_cluster_name) \
  --service $(terraform output -raw ecs_service_name) \
  --force-new-deployment
```

## Verify deployment

After ECS tasks are healthy (~2–5 min after image push, RDS may take ~10 min on first deploy):

```bash
terraform output health_url    # http://<alb-dns>/health
terraform output swagger_url   # http://<alb-dns>/api-docs
```

Open the Swagger URL in your browser. `/health` and `/api-docs` are public (no JWT required).

## Environment variables (ECS)

The app uses a single `DATABASE_URL` connection string. Terraform sets it automatically:

```
postgresql://postgres:<password>@<rds-host>:5432/todoapp
```

To view the full URL after deploy:

```bash
terraform output -raw database_url
```

For manual ECS task definition setup, add one env var:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@RDS_ENDPOINT:5432/todoapp` |
| `JWT_SECRET` | any secret string |
| `PORT` | `3000` |
| `API_URL` | `http://<alb-dns>` |

## Redeploy after code changes

```bash
# Push new image and restart ECS tasks
./scripts/deploy-aws.sh
```

Or push image only if infrastructure is unchanged.

## Tear down

```bash
cd terraform
terraform destroy
```

## Security groups

| SG | Inbound | Outbound |
|----|---------|----------|
| ALB | TCP 80 from `0.0.0.0/0` | All |
| ECS | TCP 3000 from ALB SG only | All |
| RDS | TCP 5432 from ECS SG only | All |

## Notes

- First `terraform apply` takes ~10–15 minutes (RDS is slowest).
- ECS tasks retry DB connection on startup until RDS is ready.
- DB password and JWT secret are auto-generated; retrieve with `terraform output -raw database_url` or `terraform output -raw db_password` (sensitive).
- For production, set `jwt_secret` in `terraform.tfvars` and enable HTTPS on the ALB.
