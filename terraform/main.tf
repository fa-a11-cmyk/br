terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Décommenter quand tu auras un bucket S3 pour le state (recommandé en prod)
  # backend "s3" {
  #   bucket = "rapidomeet-terraform-state"
  #   key    = "frontend/terraform.tfstate"
  #   region = var.aws_region
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "RapidoMeet"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
