# ─────────────────────────────────────────────
# Provider de Azure
# - Se autentica con tu sesión de "az login"
# - Lee la suscripción de la variable de entorno ARM_SUBSCRIPTION_ID
# ─────────────────────────────────────────────
provider "azurerm" {
  features {} # obligatorio aunque esté vacío
}
