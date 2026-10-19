# ─────────────────────────────────────────────
# Entradas del módulo de red (como los parámetros de un constructor)
# ─────────────────────────────────────────────

variable "nombre" {
  description = "Prefijo para nombrar los recursos (ej: asistencia-dev)"
  type        = string
}

variable "location" {
  description = "Región de Azure donde se crea la red"
  type        = string
}

variable "resource_group" {
  description = "Nombre del Resource Group donde vive la red"
  type        = string
}

variable "cidr" {
  description = "Rango de IPs de toda la VNet (ej: 10.0.0.0/16)"
  type        = string
}

variable "subnets" {
  description = "Mapa nombre => rango de cada subred"
  type        = map(string)
  # Ejemplo: { frontend = "10.0.1.0/24", backend = "10.0.2.0/24" }
}

variable "tags" {
  description = "Etiquetas comunes (sirven para filtrar costos en Azure)"
  type        = map(string)
}
