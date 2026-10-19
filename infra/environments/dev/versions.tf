# ─────────────────────────────────────────────
# Versiones fijadas de Terraform y del provider
# (así todo el equipo usa las mismas)
# ─────────────────────────────────────────────
terraform {
  required_version = ">= 1.6"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0" # cualquier 4.x, pero nunca 5.0
    }
  }
}
