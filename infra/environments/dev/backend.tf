# ─────────────────────────────────────────────
# State REMOTO en Azure Blob Storage
# - Todo el equipo lee y escribe el MISMO state
# - Azure lo bloquea (lease) durante un plan/apply: si un compañero
#   intenta aplicar al mismo tiempo, recibe "state locked" y debe esperar
# - El Storage Account se creó a mano con "az" (no con este Terraform):
#   el state no puede vivir dentro de algo que él mismo administra
# - Aquí NO van variables: el bloque backend se lee antes que todo lo demás
# ─────────────────────────────────────────────
terraform {
  backend "azurerm" {
    resource_group_name  = "rg-tfstate-asistencia"
    storage_account_name = "sttfasistencia5849a0"
    container_name       = "tfstate"
    key                  = "dev/backend.tfstate" # ruta del archivo dentro del contenedor
  }
}
