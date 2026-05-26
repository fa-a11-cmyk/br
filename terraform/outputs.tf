# ─────────────────────────────────────────
# Outputs Amplify
# ─────────────────────────────────────────
output "amplify_app_url" {
  description = "URL publique de l'app RapidoMeet"
  value       = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.rapidomeet.default_domain}"
}

output "amplify_app_id" {
  description = "ID de l'app Amplify"
  value       = aws_amplify_app.rapidomeet.id
}

output "amplify_webhook_url" {
  description = "URL du webhook GitHub pour les deploys"
  value       = aws_amplify_webhook.main.url
  sensitive   = true
}

# ─────────────────────────────────────────
# Outputs VPC
# ─────────────────────────────────────────
output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs des subnets publics"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs des subnets privés"
  value       = aws_subnet.private[*].id
}

output "backend_security_group_id" {
  description = "ID du security group backend (pour futur Lambda/ECS)"
  value       = aws_security_group.backend.id
}

# ─────────────────────────────────────────
# Résumé infra
# ─────────────────────────────────────────
output "infra_summary" {
  description = "Résumé de l'infrastructure déployée"
  value = {
    app_name    = var.app_name
    region      = var.aws_region
    environment = var.environment
    vpc_cidr    = var.vpc_cidr
    app_url     = "https://${aws_amplify_branch.main.branch_name}.${aws_amplify_app.rapidomeet.default_domain}"
  }
}
