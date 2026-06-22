output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "ecr_repository_url" {
  description = "ECR repository URL for docker push"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "alb_dns_name" {
  description = "ALB DNS name (public URL)"
  value       = aws_lb.main.dns_name
}

output "health_url" {
  description = "Public health check URL"
  value       = "http://${aws_lb.main.dns_name}/health"
}

output "swagger_url" {
  description = "Public Swagger UI URL"
  value       = "http://${aws_lb.main.dns_name}/api-docs"
}

output "database_url" {
  description = "PostgreSQL connection URL for the app"
  value       = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}?sslmode=require"
  sensitive   = true
}

output "rds_endpoint" {
  description = "RDS endpoint (private)"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_password" {
  description = "RDS master password"
  value       = random_password.db_password.result
  sensitive   = true
}
