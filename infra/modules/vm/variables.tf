# ─────────────────────────────────────────────
# Entradas del módulo de máquina virtual
# ─────────────────────────────────────────────

variable "nombre" {
  description = "Nombre de la VM tal como se verá en Azure (ej: MaquiFront)"
  type        = string
}

variable "location" {
  description = "Región de Azure"
  type        = string
}

variable "resource_group" {
  description = "Resource Group donde se crea la VM"
  type        = string
}

variable "subnet_id" {
  description = "ID de la subred donde se conecta la VM"
  type        = string
}

variable "size" {
  description = "Tamaño de la VM (CPU/RAM)"
  type        = string
  default     = "Standard_B2ats_v2" # 2 vCPU, 1 GB RAM: la más barata disponible
}

variable "admin_user" {
  description = "Usuario Linux para entrar por SSH"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "Contenido de tu llave pública (~/.ssh/id_rsa.pub)"
  type        = string
}

variable "ip_publica" {
  description = "true = la VM tiene IP pública (accesible desde Internet)"
  type        = bool
  default     = false
}

variable "custom_data" {
  description = "Script cloud-init que se ejecuta la PRIMERA vez que arranca la VM"
  type        = string
  default     = null
  sensitive   = true # puede llevar contraseñas; así no se muestra en el plan
}

variable "reglas" {
  description = "Puertos de entrada permitidos en el firewall (NSG)"
  type = list(object({
    nombre = string # nombre de la regla
    puerto = number # puerto TCP
    origen = string # desde dónde: una IP/CIDR o una etiqueta como "Internet"
  }))
}

variable "tags" {
  description = "Etiquetas comunes"
  type        = map(string)
}
