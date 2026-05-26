# RapidoMeet — Infrastructure Terraform

## Stack
- **Frontend** : React + Vite → AWS Amplify
- **BDD/Auth** : Supabase
- **Infra** : VPC + 2 subnets publics + 2 subnets privés
- **Region** : us-east-1 (North Virginia)
- **IaC** : Terraform >= 1.5

## Prérequis

1. [Terraform installé](https://developer.hashicorp.com/terraform/install)
2. [AWS CLI configuré](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
3. Un GitHub Personal Access Token (classique) avec droits `repo`

## Setup

```bash
# 1. Configurer AWS CLI
aws configure
# → AWS Access Key ID
# → AWS Secret Access Key
# → Region : us-east-1

# 2. Remplir terraform.tfvars avec tes vraies valeurs
cp terraform.tfvars terraform.tfvars   # déjà créé

# 3. Initialiser Terraform
terraform init

# 4. Vérifier le plan (sans rien déployer)
terraform plan

# 5. Déployer
terraform apply
```

## Après le déploiement

Tu verras en output :
```
amplify_app_url = "https://main.XXXXXXXXXX.amplifyapp.com"
vpc_id          = "vpc-XXXXXXXXXX"
public_subnet_ids  = ["subnet-XXX", "subnet-XXX"]
private_subnet_ids = ["subnet-XXX", "subnet-XXX"]
```

## Changer de région plus tard

Dans `terraform.tfvars` :
```hcl
aws_region         = "eu-west-1"       # Irlande par exemple
availability_zones = ["eu-west-1a", "eu-west-1b"]
```

Puis :
```bash
terraform plan   # voir les changements
terraform apply  # appliquer
```

## Ajouter un backend plus tard

Dans `vpc.tf`, décommenter :
- `aws_eip.nat`
- `aws_nat_gateway.main`
- La route NAT dans `aws_route_table.private`

## Supprimer toute l'infra

```bash
terraform destroy
```

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `main.tf` | Provider AWS + backend state |
| `variables.tf` | Déclaration des variables |
| `terraform.tfvars` | Valeurs des variables (⚠️ secret) |
| `vpc.tf` | VPC, subnets, IGW, NAT, routes |
| `amplify.tf` | App Amplify + branche + webhook |
| `outputs.tf` | URLs et IDs après deploy |
