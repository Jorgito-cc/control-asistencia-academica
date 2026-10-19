# Infraestructura en Azure

| Parte | Herramienta | Carpeta | State |
|---|---|---|---|
| Red (VNet + subredes) y **MaquiBack** (NestJS + PostgreSQL) | Terraform | `environments/dev` | Azure Blob Storage `sttfasistencia5849a0/tfstate/dev/backend.tfstate` |
| **MaquiFront** (Nginx + React) | Pulumi (TypeScript) | `pulumi-frontend` | Pulumi Cloud, stack `dev` |

Orden: primero Terraform (crea la red y MaquiBack), después Pulumi (busca esa red y la IP de MaquiBack).

## Requisitos

- `az login` con acceso a la suscripción (rol *Contributor*).
- Terraform >= 1.6 y Pulumi CLI (`pulumi login`).
- Llave SSH en `~/.ssh/id_rsa.pub`.
- Archivo de secretos `~/.azure-asistencia.env` (se comparte por privado, **nunca** por Git):

```bash
export ARM_SUBSCRIPTION_ID=$(az account show --query id -o tsv)
export TF_VAR_ssh_public_key="$(cat ~/.ssh/id_rsa.pub)"
export TF_VAR_db_password="..."
export TF_VAR_jwt_secret="..."
export TF_VAR_admin_password="..."
```

Los secretos deben ser **los mismos** para todo el equipo: si cambian, Terraform recrea MaquiBack y se pierde la base de datos.

## Terraform (backend)

```bash
git pull                              # SIEMPRE antes de aplicar
source ~/.azure-asistencia.env
cd infra/environments/dev
terraform init
terraform plan -out=dev.tfplan
terraform apply dev.tfplan
git add . && git commit && git push   # SIEMPRE después de aplicar
```

Si otra persona está aplicando, Terraform responde `state locked`: esperar y volver a intentar.

## Pulumi (frontend)

```bash
git pull
cd infra/pulumi-frontend
npm install
pulumi stack select dev
pulumi preview
pulumi up
```

Para dar acceso SSH a otra IP: `pulumi config set --path 'ipsSsh[1]' "$(curl -s -4 ifconfig.me)/32"` y `pulumi up`.
