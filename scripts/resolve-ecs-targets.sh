#!/usr/bin/env bash
# Resolves ECS cluster and service names for deploy.
# Exports ECS_CLUSTER and ECS_SERVICE when found.
set -euo pipefail

REGION="${AWS_REGION:?AWS_REGION is required}"
CLUSTER="${ECS_CLUSTER:-todo-app-cluster}"
SERVICE="${ECS_SERVICE:-todo-app-service}"

service_exists() {
  local cluster="$1"
  local service="$2"
  local status
  status=$(aws ecs describe-services \
    --cluster "$cluster" \
    --services "$service" \
    --region "$REGION" \
    --query 'services[?status==`ACTIVE`].serviceName | [0]' \
    --output text 2>/dev/null || true)
  [[ -n "$status" && "$status" != "None" ]]
}

cluster_exists() {
  local cluster="$1"
  local status
  status=$(aws ecs describe-clusters \
    --clusters "$cluster" \
    --region "$REGION" \
    --query 'clusters[?status==`ACTIVE`].clusterName | [0]' \
    --output text 2>/dev/null || true)
  [[ -n "$status" && "$status" != "None" ]]
}

if ! cluster_exists "$CLUSTER"; then
  echo "::error::ECS cluster '$CLUSTER' not found in region $REGION."
  echo "Active clusters:"
  aws ecs list-clusters --region "$REGION" --output table || true
  echo ""
  echo "Create infrastructure with: cd terraform && terraform init && terraform apply"
  exit 1
fi

if ! service_exists "$CLUSTER" "$SERVICE"; then
  echo "Service '$SERVICE' not found in cluster '$CLUSTER'. Searching for alternatives..."

  ARNS=$(aws ecs list-services --cluster "$CLUSTER" --region "$REGION" --query 'serviceArns[]' --output text || true)
  if [[ -z "$ARNS" ]]; then
    echo "::error::No ECS services in cluster '$CLUSTER'."
    echo "Run: cd terraform && terraform init && terraform apply"
    echo "Ensure terraform aws_region matches workflow AWS_REGION ($REGION)."
    exit 1
  fi

  NAMES=$(aws ecs describe-services \
    --cluster "$CLUSTER" \
    --services $ARNS \
    --region "$REGION" \
    --query 'services[?status==`ACTIVE`].serviceName' \
    --output text)

  echo "Active services in cluster: $NAMES"

  for name in $NAMES; do
    if [[ "$name" == "$SERVICE" || "$name" == *"todo"* ]]; then
      SERVICE="$name"
      break
    fi
  done

  if ! service_exists "$CLUSTER" "$SERVICE"; then
    SERVICE=$(echo "$NAMES" | awk '{print $1}')
  fi

  if [[ -z "$SERVICE" ]] || ! service_exists "$CLUSTER" "$SERVICE"; then
    echo "::error::Could not resolve an ECS service to deploy."
    echo "Expected: todo-app-service (from Terraform)."
    echo "Run: cd terraform && terraform init && terraform apply"
    exit 1
  fi

  echo "Using discovered service: $SERVICE"
fi

echo "ECS_CLUSTER=$CLUSTER" >> "$GITHUB_ENV"
echo "ECS_SERVICE=$SERVICE" >> "$GITHUB_ENV"
echo "Resolved ECS targets: cluster=$CLUSTER service=$SERVICE region=$REGION"
