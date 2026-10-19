# ─────────────────────────────────────────────
# Red virtual (VNet): la "LAN privada" donde viven las dos VMs
# ─────────────────────────────────────────────
resource "azurerm_virtual_network" "this" {
  name                = "vnet-${var.nombre}"
  location            = var.location
  resource_group_name = var.resource_group
  address_space       = [var.cidr]
  tags                = var.tags
}

# ─────────────────────────────────────────────
# Subredes: una por cada entrada del mapa var.subnets
# for_each crea un recurso por elemento:
#   azurerm_subnet.this["frontend"] y azurerm_subnet.this["backend"]
# ─────────────────────────────────────────────
resource "azurerm_subnet" "this" {
  for_each = var.subnets

  name                 = "snet-${each.key}" # each.key   = "frontend" / "backend"
  resource_group_name  = var.resource_group
  virtual_network_name = azurerm_virtual_network.this.name
  address_prefixes     = [each.value] # each.value = "10.0.1.0/24" ...
}
