// ─────────────────────────────────────────────
// MaquiFront con Pulumi (TypeScript)
//
// Reparto de responsabilidades:
//   - Terraform (infra/environments/dev): red (VNet + subredes) y MaquiBack
//   - Pulumi (este proyecto):              MaquiFront + su IP pública + su firewall
//
// Pulumi NO crea la red: la BUSCA en Azure por nombre (como un bloque "data" de Terraform)
// ─────────────────────────────────────────────
import * as fs from "fs";
import * as pulumi from "@pulumi/pulumi";
import * as compute from "@pulumi/azure-native/compute";
import * as network from "@pulumi/azure-native/network";
import * as resources from "@pulumi/azure-native/resources";

// ─── Configuración (Pulumi.dev.yaml) ─── equivale a variables.tf + terraform.tfvars
const config = new pulumi.Config();
const location = new pulumi.Config("azure-native").require("location");
const vmName = config.get("vmName") ?? "MaquiFront";
const vmSize = config.get("vmSize") ?? "Standard_B2ats_v2"; // 2 vCPU, 1 GB RAM
const adminUser = config.get("adminUser") ?? "azureuser";
const sshPublicKey = config.require("sshPublicKey");
const ipsSsh = config.requireObject<string[]>("ipsSsh"); // IPs (CIDR) que pueden entrar por SSH

// Nombres de lo que creó Terraform (ver: terraform output)
const terraformRg = config.require("terraformResourceGroup");
const vnetName = config.require("vnetName");
const subnetName = config.require("subnetName");
const backendNicName = config.require("backendNicName");

// Etiquetas comunes (como local.tags en Terraform)
const tags = {
    Proyecto: "control-asistencia",
    Ambiente: pulumi.getStack(), // "dev"
    Gestion: "pulumi",
};

// ─────────────────────────────────────────────
// 1. Leer lo que creó Terraform (solo lectura, no lo modifica)
// ─────────────────────────────────────────────

// Subred "snet-frontend" donde se conecta MaquiFront
const subnet = network.getSubnetOutput({
    resourceGroupName: terraformRg,
    virtualNetworkName: vnetName,
    subnetName: subnetName,
});

// IP privada de MaquiBack: Nginx le reenvía las peticiones /api
const backendIp = network
    .getNetworkInterfaceOutput({ resourceGroupName: terraformRg, networkInterfaceName: backendNicName })
    .apply(nic => nic.ipConfigurations![0].privateIPAddress!);

// ─────────────────────────────────────────────
// 2. Resource Group propio de Pulumi
//    Separado del de Terraform: así ninguna herramienta borra lo de la otra
// ─────────────────────────────────────────────
const rg = new resources.ResourceGroup("rg", {
    resourceGroupName: "rg-asistencia-front",
    location,
    tags,
});

// ─────────────────────────────────────────────
// 3. IP pública estática: la dirección que abren los usuarios en el navegador
// ─────────────────────────────────────────────
const publicIp = new network.PublicIPAddress("pip", {
    publicIpAddressName: `pip-${vmName}`,
    resourceGroupName: rg.name,
    location,
    sku: { name: "Standard" },
    publicIPAllocationMethod: "Static",
    tags,
});

// ─────────────────────────────────────────────
// 4. Firewall (NSG): HTTP para todos, SSH solo para las IPs de ipsSsh
//    En TypeScript la lista se arma con map(), sin necesidad de "dynamic"
// ─────────────────────────────────────────────
const nsg = new network.NetworkSecurityGroup("nsg", {
    networkSecurityGroupName: `nsg-${vmName}`,
    resourceGroupName: rg.name,
    location,
    securityRules: [
        {
            name: "http",
            priority: 100,
            direction: "Inbound",
            access: "Allow",
            protocol: "Tcp",
            sourcePortRange: "*",
            destinationPortRange: "80",
            sourceAddressPrefix: "Internet", // cualquiera puede ver la web
            destinationAddressPrefix: "*",
        },
        ...ipsSsh.map((ip, i) => ({
            name: `ssh-${i}`,
            priority: 110 + i * 10,
            direction: "Inbound",
            access: "Allow",
            protocol: "Tcp",
            sourcePortRange: "*",
            destinationPortRange: "22",
            sourceAddressPrefix: ip, // solo estas IPs entran por SSH
            destinationAddressPrefix: "*",
        })),
    ],
    tags,
});

// ─────────────────────────────────────────────
// 5. Tarjeta de red: conecta MaquiFront a la subred de Terraform
// ─────────────────────────────────────────────
const nic = new network.NetworkInterface("nic", {
    networkInterfaceName: `nic-${vmName}`,
    resourceGroupName: rg.name,
    location,
    networkSecurityGroup: { id: nsg.id },
    ipConfigurations: [
        {
            name: "ipconfig",
            subnet: { id: subnet.apply(s => s.id!) },
            privateIPAllocationMethod: "Dynamic",
            publicIPAddress: { id: publicIp.id },
        },
    ],
    tags,
});

// ─────────────────────────────────────────────
// 6. cloud-init: se lee el YAML y se reemplaza __BACKEND_IP__
//    Azure lo exige en base64 (en Terraform era base64encode)
// ─────────────────────────────────────────────
const cloudInit = fs.readFileSync("cloud-init/frontend.yaml", "utf8");
const customData = backendIp.apply(ip =>
    Buffer.from(cloudInit.replace(/__BACKEND_IP__/g, ip)).toString("base64"),
);

// ─────────────────────────────────────────────
// 7. La máquina virtual MaquiFront (Ubuntu 24.04)
// ─────────────────────────────────────────────
const vm = new compute.VirtualMachine("vm", {
    vmName,
    resourceGroupName: rg.name,
    location,
    hardwareProfile: { vmSize },
    networkProfile: {
        networkInterfaces: [{ id: nic.id, primary: true }],
    },
    osProfile: {
        computerName: vmName,
        adminUsername: adminUser,
        customData,
        // Solo llave SSH, sin contraseña
        linuxConfiguration: {
            disablePasswordAuthentication: true,
            ssh: {
                publicKeys: [{ path: `/home/${adminUser}/.ssh/authorized_keys`, keyData: sshPublicKey }],
            },
        },
    },
    storageProfile: {
        imageReference: {
            publisher: "Canonical",
            offer: "ubuntu-24_04-lts",
            sku: "server",
            version: "latest",
        },
        osDisk: {
            name: `disk-${vmName}`,
            createOption: "FromImage",
            caching: "ReadWrite",
            managedDisk: { storageAccountType: "Standard_LRS" }, // HDD estándar: el más barato
            deleteOption: "Delete", // al borrar la VM también se borra el disco
        },
    },
    tags,
});

// ─────────────────────────────────────────────
// 8. Salidas (como outputs.tf). Se ven con: pulumi stack output
// ─────────────────────────────────────────────
export const vmNombre = vm.name;
export const ipFrontend = publicIp.ipAddress;
export const ipBackendPrivada = backendIp;
export const urlApp = pulumi.interpolate`http://${publicIp.ipAddress}`;
export const sshFrontend = pulumi.interpolate`ssh ${adminUser}@${publicIp.ipAddress}`;
export const sshBackend = pulumi.interpolate`ssh -J ${adminUser}@${publicIp.ipAddress} ${adminUser}@${backendIp}`;
