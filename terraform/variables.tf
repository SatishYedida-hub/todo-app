variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "todo-app"
}

variable "image_tag" {
  description = "Docker image tag in ECR"
  type        = string
  default     = "latest"
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 3000
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "todoapp"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}

variable "jwt_secret" {
  description = "JWT signing secret (override in production)"
  type        = string
  sensitive   = true
  default     = ""
}
