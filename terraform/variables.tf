variable "aws_region" {
  description = "Région AWS"
  type        = string
  default     = "eu-west-3"
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Nom de l'application"
  type        = string
  default     = "rapidomeet"
}

variable "github_repository" {
  description = "URL du repo GitHub"
  type        = string
  default     = "https://github.com/fa-a11-cmyk/br.git"
}

variable "github_token" {
  description = "GitHub Personal Access Token (classique, avec droits repo)"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Branche à déployer"
  type        = string
  default     = "main"
}

# Variables VPC
variable "vpc_cidr" {
  description = "CIDR block de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs des subnets publics"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDRs des subnets privés"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "availability_zones" {
  description = "Zones de disponibilité"
  type        = list(string)
  default     = ["eu-west-3a", "eu-west-3b"]
}

# Variables Supabase (injectées comme env vars dans Amplify)
variable "supabase_url" {
  description = "URL Supabase"
  type        = string
  sensitive   = true
}

variable "supabase_publishable_key" {
  description = "Clé publique Supabase (VITE_SUPABASE_PUBLISHABLE_KEY)"
  type        = string
  sensitive   = true
}