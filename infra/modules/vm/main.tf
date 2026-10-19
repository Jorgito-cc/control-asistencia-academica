# ─────────────────────────────────────────────
# IP pública (OPCIONAL)
# count = 1 la crea, count = 0 no la crea. Es el "if" de Terraform
# ─────────────────────────────────────────────
resource "azurerm_public_ip" "this" {
  count = var.ip_publica ? 1 : 0

  name                = "pip-${var.nombre}"
  location            = var.location
  resource_group_name = var.resource_group
  allocation_method   = "Static" # la IP no cambia aunque reinicies la VM
  sku                 = "Standard"
  tags                = var.tags
}

# ─────────────────────────────────────────────
# Tarjeta de red (NIC): conecta la VM a la subred
# ─────────────────────────────────────────────
resource "azurerm_network_interface" "this" {
  name                = "nic-${var.nombre}"
  location            = var.location
  resource_group_name = var.resource_group
  tags                = var.tags

  ip_configuration {
    name                          = "ipconfig"
    subnet_id                     = var.subnet_id
    private_ip_address_allocation = "Dynamic" # Azure asigna la IP privada (10.0.x.x)
    # Si hay IP pública se asocia; si no, null (sin IP pública)
    public_ip_address_id = var.ip_publica ? azurerm_public_ip.this[0].id : null
  }
}

# ─────────────────────────────────────────────
# Firewall (Network Security Group)
# Por defecto Azure BLOQUEA todo lo que entra desde Internet.
# Aquí solo abrimos los puertos de var.reglas
# ─────────────────────────────────────────────
resource "azurerm_network_security_group" "this" {
  name                = "nsg-${var.nombre}"
  location            = var.location
  resource_group_name = var.resource_group
  tags                = var.tags

  # "dynamic" genera un bloque security_rule por cada regla de la lista
  dynamic "security_rule" {
    # Convertimos la lista en mapa y calculamos la prioridad: 100, 110, 120...
    for_each = {
      for i, regla in var.reglas : regla.nombre => merge(regla, { prioridad = 100 + i * 10 })
    }

    content {
      name                       = security_rule.value.nombre
      priority                   = security_rule.value.prioridad # menor número = se evalúa primero
      direction                  = "Inbound"                     # tráfico que ENTRA
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = tostring(security_rule.value.puerto)
      source_address_prefix      = security_rule.value.origen
      destination_address_prefix = "*"
    }
  }
}

# Asocia el firewall a la tarjeta de red
resource "azurerm_network_interface_security_group_association" "this" {
  network_interface_id      = azurerm_network_interface.this.id
  network_security_group_id = azurerm_network_security_group.this.id
}

# ─────────────────────────────────────────────
# La máquina virtual Linux (Ubuntu 24.04)
# ─────────────────────────────────────────────
resource "azurerm_linux_virtual_machine" "this" {
  name                  = var.nombre # MaquiFront / MaquiBack
  location              = var.location
  resource_group_name   = var.resource_group
  size                  = var.size
  admin_username        = var.admin_user
  network_interface_ids = [azurerm_network_interface.this.id]

  # Azure exige el cloud-init en base64
  custom_data = var.custom_data != null ? base64encode(var.custom_data) : null

  # Entramos con llave SSH y no con contraseña:
  # así no queda ninguna contraseña de la VM guardada en el state
  admin_ssh_key {
    username   = var.admin_user
    public_key = var.ssh_public_key
  }

  # Disco del sistema operativo
  os_disk {
    name                 = "disk-${var.nombre}"
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS" # disco HDD estándar: el más barato
  }

  # Imagen del sistema operativo
  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  tags = var.tags

  # La asociación del NSG debe existir antes de que arranque la VM
  depends_on = [azurerm_network_interface_security_group_association.this]
}
