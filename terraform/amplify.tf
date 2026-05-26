# ─────────────────────────────────────────
# AWS Amplify App — RapidoMeet Frontend
# ─────────────────────────────────────────
resource "aws_amplify_app" "rapidomeet" {
  name       = var.app_name
  repository = var.github_repository

  # Token GitHub pour accès au repo
  access_token = var.github_token

  # Vite/React build config
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # Fix React Router — toutes les routes -> index.html
  custom_rule {
    source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>"
    status = "200"
    target = "/index.html"
  }

  # Variables d'environnement Supabase (injectées au build)
  environment_variables = {
    VITE_SUPABASE_URL      = var.supabase_url
    VITE_SUPABASE_ANON_KEY = var.supabase_anon_key
    VITE_APP_NAME          = "RapidoMeet"
    NODE_ENV               = "production"
  }

  # Désactiver le build auto sur toutes les branches
  # (on contrôle uniquement via aws_amplify_branch)
  enable_branch_auto_build     = false
  enable_branch_auto_deletion  = true

  tags = {
    Name = "${var.app_name}-amplify"
  }
}

# ─────────────────────────────────────────
# Branche main — déploiement production
# ─────────────────────────────────────────
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.rapidomeet.id
  branch_name = var.branch_name

  # Auto deploy à chaque push sur main
  enable_auto_build = true

  # Activer les notifications d'état
  enable_notification = true

  # Variables spécifiques à la branche (override si besoin)
  environment_variables = {
    NODE_ENV = "production"
  }

  tags = {
    Name = "${var.app_name}-branch-${var.branch_name}"
  }
}

# ─────────────────────────────────────────
# Webhook GitHub -> Amplify (auto deploy)
# ─────────────────────────────────────────
resource "aws_amplify_webhook" "main" {
  app_id      = aws_amplify_app.rapidomeet.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Webhook deploy automatique depuis GitHub"
}

# ─────────────────────────────────────────
# Domaine custom (décommenter quand tu as
# un domaine — ex: rapidomeet.com)
# ─────────────────────────────────────────
# resource "aws_amplify_domain_association" "main" {
#   app_id      = aws_amplify_app.rapidomeet.id
#   domain_name = "rapidomeet.com"
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = ""
#   }
#
#   sub_domain {
#     branch_name = aws_amplify_branch.main.branch_name
#     prefix      = "www"
#   }
# }
