export type Provider = 'aws' | 'azure'

export const providers = [
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
] satisfies { value: Provider; label: string }[]

export const regions = [
  { value: 'us-east-1', label: 'Virginia del Norte · AWS', provider: 'aws' },
  { value: 'us-west-2', label: 'Oregón · AWS', provider: 'aws' },
  { value: 'eastus', label: 'Este de EE. UU. · Azure', provider: 'azure' },
] satisfies { value: string; label: string; provider: Provider }[]

export const environments = [
  { value: 'production', label: 'Producción' },
  { value: 'staging', label: 'Pruebas' },
]

export const engines = [
  { value: 'terraform', label: 'Terraform' },
  { value: 'opentofu', label: 'OpenTofu' },
  { value: 'pulumi', label: 'Pulumi' },
  { value: 'cloudformation', label: 'CloudFormation' },
]

export function slugFromName(name: string) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63).replace(/-+$/g, '')
}

export function optionLabel(options: { value: string; label: string }[], value: string) {
  return options.find(option => option.value === value)?.label ?? value
}
