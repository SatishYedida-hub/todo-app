locals {
  name_prefix = var.project_name

  common_tags = {
    Project = var.project_name
    Managed = "terraform"
  }

  jwt_secret = var.jwt_secret != "" ? var.jwt_secret : random_password.jwt_secret.result
}
