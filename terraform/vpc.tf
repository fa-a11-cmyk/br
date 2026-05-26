# ─────────────────────────────────────────
# VPC
# ─────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# ─────────────────────────────────────────
# Internet Gateway (pour les subnets publics)
# ─────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# ─────────────────────────────────────────
# Subnets PUBLICS (x2 — une par AZ)
# ─────────────────────────────────────────
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

# ─────────────────────────────────────────
# Subnets PRIVÉS (x2 — une par AZ)
# ─────────────────────────────────────────
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.app_name}-private-subnet-${count.index + 1}"
    Type = "private"
  }
}

# ─────────────────────────────────────────
# Elastic IP pour NAT Gateway
# (décommenter quand tu ajoutes un backend)
# ─────────────────────────────────────────
# resource "aws_eip" "nat" {
#   domain = "vpc"
#   tags = {
#     Name = "${var.app_name}-nat-eip"
#   }
# }

# ─────────────────────────────────────────
# NAT Gateway (pour que les subnets privés
# puissent accéder à internet en sortie)
# (décommenter quand tu ajoutes un backend)
# ─────────────────────────────────────────
# resource "aws_nat_gateway" "main" {
#   allocation_id = aws_eip.nat.id
#   subnet_id     = aws_subnet.public[0].id
#   depends_on    = [aws_internet_gateway.main]
#   tags = {
#     Name = "${var.app_name}-nat-gw"
#   }
# }

# ─────────────────────────────────────────
# Route Table — PUBLIC
# ─────────────────────────────────────────
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ─────────────────────────────────────────
# Route Table — PRIVÉ
# (décommenter route NAT quand backend prêt)
# ─────────────────────────────────────────
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # route {
  #   cidr_block     = "0.0.0.0/0"
  #   nat_gateway_id = aws_nat_gateway.main.id
  # }

  tags = {
    Name = "${var.app_name}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ─────────────────────────────────────────
# Security Group de base (pour futur backend)
# ─────────────────────────────────────────
resource "aws_security_group" "backend" {
  name        = "${var.app_name}-backend-sg"
  description = "Security group pour le backend RapidoMeet"
  vpc_id      = aws_vpc.main.id

  # Autoriser trafic sortant (internet)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS entrant depuis les subnets publics uniquement
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = var.public_subnet_cidrs
  }

  # HTTP entrant (si besoin load balancer)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = var.public_subnet_cidrs
  }

  tags = {
    Name = "${var.app_name}-backend-sg"
  }
}
