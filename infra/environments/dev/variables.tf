# ─────────────────────────────────────────────
# Variables del ambiente
# Las que NO son secretas van en terraform.tfvars.
# Las secretas van como variables de entorno TF_VAR_xxx
# ─────────────────────────────────────────────

variable "location" {
  description = "Región de Azure (debe estar permitida en Azure for Students)"
  type        = string
}

variable "ambiente" {
  description = "Nombre del ambiente: dev, prod..."
  type        = string
}

variable "size_backend" {
  description = "Tamaño de la VM del backend (NestJS + PostgreSQL)"
  type        = string
  default     = "Standard_B2als_v2" # 2 vCPU, 4 GB RAM
}

variable "ssh_public_key" {
  description = "Contenido de ~/.ssh/id_rsa.pub"
  type        = string
}

# ─── Secretos (sensitive = no se muestran en plan/apply) ───

variable "db_password" {
  description = "Contraseña del usuario de PostgreSQL (sin comillas simples)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secreto para firmar los tokens JWT"
  type        = string
  sensitive   = true
}

variable "admin_email" {
  description = "Email del administrador inicial de la app"
  type        = string
}

variable "admin_password" {
  description = "Contraseña del administrador inicial de la app"
  type        = string
  sensitive   = true
}
