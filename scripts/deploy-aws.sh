#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TERRAFORM_DIR="$ROOT_DIR/terraform"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "==> Initializing Terraform"
terraform -chdir="$TERRAFORM_DIR" init

echo "==> Creating AWS infrastructure (ECR, ECS, ALB, RDS...)"
terraform -chdir="$TERRAFORM_DIR" apply -auto-approve

AWS_REGION="$(terraform -chdir="$TERRAFORM_DIR" output -raw aws_region 2>/dev/null || echo us-east-1)"
ECR_URL="$(terraform -chdir="$TERRAFORM_DIR" output -raw ecr_repository_url)"
CLUSTER="$(terraform -chdir="$TERRAFORM_DIR" output -raw ecs_cluster_name)"
SERVICE="$(terraform -chdir="$TERRAFORM_DIR" output -raw ecs_service_name)"

echo "==> Logging in to ECR"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ECR_URL%%/*}"

echo "==> Building and pushing Docker image"
docker build -t "$ECR_URL:$IMAGE_TAG" "$ROOT_DIR"
docker push "$ECR_URL:$IMAGE_TAG"

echo "==> Forcing ECS service deployment"
aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --force-new-deployment \
  --region "$AWS_REGION" \
  --no-cli-pager

echo ""
echo "Deployment complete!"
echo "Health:  $(terraform -chdir="$TERRAFORM_DIR" output -raw health_url)"
echo "Swagger: $(terraform -chdir="$TERRAFORM_DIR" output -raw swagger_url)"
