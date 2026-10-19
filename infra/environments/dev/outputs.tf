# ─────────────────────────────────────────────
# Lo que Terraform muestra al terminar el "apply"
# (también se ven con: terraform output)
# Pulumi (MaquiFront) usa estos nombres para encontrar la red y MaquiBack
# ─────────────────────────────────────────────

output "resource_group" {
  description = "Resource Group de la red y de MaquiBack"
  value       = azurerm_resource_group.rg.name
}

output "vnet" {
  description = "Nombre de la VNet"
  value       = "vnet-${local.nombre}"
}

output "subnet_frontend" {
  description = "Subred donde Pulumi conecta MaquiFront"
  value       = "snet-frontend"
}

output "nic_backend" {
  description = "Tarjeta de red de MaquiBack (Pulumi lee de aquí su IP privada)"
  value       = "nic-${local.nombre_back}"
}

output "ip_backend_privada" {
  description = "IP privada de MaquiBack (solo visible dentro de la VNet)"
  value       = module.backend.private_ip
}
