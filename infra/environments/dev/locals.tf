# ─────────────────────────────────────────────
# Valores calculados internos (como variables privadas)
# ─────────────────────────────────────────────
locals {
  # Prefijo de los recursos compartidos: asistencia-dev
  nombre = "asistencia-${var.ambiente}"

  # Nombre de la máquina virtual del backend (MaquiFront la crea Pulumi)
  nombre_back = "MaquiBack"

  # Etiquetas que se ponen a TODOS los recursos
  tags = {
    Proyecto = "control-asistencia"
    Ambiente = var.ambiente
    Gestion  = "terraform"
  }

  # Rangos de la red
  vnet_cidr = "10.0.0.0/16"
  subnets = {
    frontend = "10.0.1.0/24"
    backend  = "10.0.2.0/24"
  }
}
