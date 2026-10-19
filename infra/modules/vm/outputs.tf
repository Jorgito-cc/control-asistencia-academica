# ─────────────────────────────────────────────
# Salidas del módulo de VM
# ─────────────────────────────────────────────

output "private_ip" {
  description = "IP privada dentro de la VNet (10.0.x.x)"
  value       = azurerm_network_interface.this.private_ip_address
}

output "public_ip" {
  description = "IP pública (null si la VM no tiene)"
  value       = var.ip_publica ? azurerm_public_ip.this[0].ip_address : null
}
