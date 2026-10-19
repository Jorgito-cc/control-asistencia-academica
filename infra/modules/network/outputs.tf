# ─────────────────────────────────────────────
# Salidas del módulo (lo que "retorna" para que otros lo usen)
# ─────────────────────────────────────────────

# IDs de las subredes: { frontend = "/subscriptions/...", backend = "..." }
output "subnet_ids" {
  value = { for nombre, subnet in azurerm_subnet.this : nombre => subnet.id }
}

# Rangos de las subredes: los usamos en las reglas de firewall
output "subnet_cidrs" {
  value = var.subnets
}
