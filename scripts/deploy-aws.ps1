$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$TerraformDir = Join-Path $RootDir "terraform"
$ImageTag = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }

Write-Host "==> Initializing Terraform"
terraform -chdir=$TerraformDir init

Write-Host "==> Creating AWS infrastructure (ECR, ECS, ALB, RDS...)"
terraform -chdir=$TerraformDir apply -auto-approve

$AwsRegion = (terraform -chdir=$TerraformDir output -raw aws_region 2>$null)
if (-not $AwsRegion) { $AwsRegion = "us-east-1" }

$EcrUrl = terraform -chdir=$TerraformDir output -raw ecr_repository_url
$Cluster = terraform -chdir=$TerraformDir output -raw ecs_cluster_name
$Service = terraform -chdir=$TerraformDir output -raw ecs_service_name

Write-Host "==> Logging in to ECR"
$password = aws ecr get-login-password --region $AwsRegion
$registry = ($EcrUrl -split "/")[0]
$password | docker login --username AWS --password-stdin $registry

Write-Host "==> Building and pushing Docker image"
docker build -t "${EcrUrl}:${ImageTag}" $RootDir
docker push "${EcrUrl}:${ImageTag}"

Write-Host "==> Forcing ECS service deployment"
aws ecs update-service `
  --cluster $Cluster `
  --service $Service `
  --force-new-deployment `
  --region $AwsRegion `
  --no-cli-pager

Write-Host ""
Write-Host "Deployment complete!"
Write-Host "Health:  $(terraform -chdir=$TerraformDir output -raw health_url)"
Write-Host "Swagger: $(terraform -chdir=$TerraformDir output -raw swagger_url)"
