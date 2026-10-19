# ─────────────────────────────────────────────
# 1. Resource Group: la "carpeta" de Azure que contiene todo.
#    Si borras el RG se borra todo lo de adentro
# ─────────────────────────────────────────────
resource "azurerm_resource_group" "rg" {
  name     = "rg-${local.nombre}"
  location = var.location
  tags     = local.tags
}

# ─────────────────────────────────────────────
# 2. Red: VNet con dos subredes (frontend y backend)
# ─────────────────────────────────────────────
module "network" {
  source = "../../modules/network"

  nombre         = local.nombre
  location       = var.location
  resource_group = azurerm_resource_group.rg.name
  cidr           = local.vnet_cidr
  subnets        = local.subnets
  tags           = local.tags
}

# ─────────────────────────────────────────────
# 3. MaquiBack: NestJS (puerto 3000) + PostgreSQL (puerto 5432)
#    - SIN IP pública: nadie de Internet la ve
#    - Solo acepta conexiones que vienen de la subred del frontend
#    - PostgreSQL escucha solo en localhost, así que no se abre el 5432
# ─────────────────────────────────────────────
module "backend" {
  source = "../../modules/vm"

  nombre         = local.nombre_back
  location       = var.location
  resource_group = azurerm_resource_group.rg.name
  subnet_id      = module.network.subnet_ids["backend"]
  size           = var.size_backend
  ssh_public_key = var.ssh_public_key
  ip_publica     = false
  tags           = local.tags

  # templatefile reemplaza los ${...} del YAML con estos valores
  custom_data = templatefile("${path.module}/cloud-init/backend.yaml", {
    db_password    = var.db_password
    jwt_secret     = var.jwt_secret
    admin_email    = var.admin_email
    admin_password = var.admin_password
  })

  reglas = [
    # La API solo se puede llamar desde la subred del frontend (MaquiFront, creada con Pulumi)
    { nombre = "api-desde-front", puerto = 3000, origen = local.subnets["frontend"] },
    # SSH solo "saltando" desde MaquiFront (ssh -J)
    { nombre = "ssh-desde-front", puerto = 22, origen = local.subnets["frontend"] },
  ]
}

# ─────────────────────────────────────────────
# 4. MaquiFront NO está aquí: la crea Pulumi (infra/pulumi-frontend)
#    Terraform solo le deja lista la subred "snet-frontend" para que se conecte
# ─────────────────────────────────────────────
