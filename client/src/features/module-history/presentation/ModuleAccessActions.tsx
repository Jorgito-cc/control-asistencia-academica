import { Download, Link2 } from 'lucide-react'
import { getErrorMessage } from '../../../core/http/api-error'
import { Button } from '../../../shared/ui/Button'
import { Field, Input } from '../../../shared/ui/Field'
import { useToast } from '../../../shared/ui/toast'
import type { ActiveModule } from '../../academic-modules/domain/academic-module'
import { useExportAttendance } from '../../attendance/application/attendance.queries'

export function ModuleAccessActions({ module }: { module: Pick<ActiveModule, 'id' | 'status'> }) {
  const exportAttendance = useExportAttendance(module.id)
  const toast = useToast()
  const active = module.status === 'ACTIVE'
  const accessUrl = new URL('/login', window.location.origin)
  accessUrl.searchParams.set('modulo', String(module.id))

  async function copyAccess() {
    try {
      await navigator.clipboard.writeText(accessUrl.href)
      toast.success('Enlace copiado.')
    } catch {
      toast.error('Selecciona el enlace para copiarlo.')
    }
  }

  return <div className="space-y-2.5">
    {active && <Field label="Enlace para estudiantes" htmlFor={`student-access-${module.id}`}>
      <Input id={`student-access-${module.id}`} value={accessUrl.href} readOnly onFocus={event => event.target.select()} />
    </Field>}
    <div className="flex flex-wrap gap-2">
      {active && <Button variant="secondary" icon={<Link2 className="size-4" />} onClick={() => void copyAccess()}>Copiar enlace</Button>}
      <Button
        variant="secondary"
        icon={<Download className="size-4" />}
        loading={exportAttendance.isPending}
        onClick={() => exportAttendance.mutate(undefined, { onError: error => toast.error(getErrorMessage(error, 'No se pudo descargar el Excel.')) })}
      >Descargar Excel</Button>
    </div>
  </div>
}
