import { Download, Layers, Link2, SquarePlus } from 'lucide-react'
import { Link } from 'react-router'
import { getErrorMessage } from '../../../core/http/api-error'
import { formatDate } from '../../../shared/lib/format'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Field, Input } from '../../../shared/ui/Field'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PageLoader } from '../../../shared/ui/Spinner'
import { useToast } from '../../../shared/ui/toast'
import { useModules } from '../../academic-modules/application/academic-modules.queries'
import type { ModuleListItem } from '../../academic-modules/domain/academic-module'
import { useExportAttendance } from '../../attendance/application/attendance.queries'
import { ModuleStatusChip } from '../../module-history/presentation/ModuleStatusChip'

export function TeacherModulesPage() {
  const modules = useModules()

  return <>
    <PageHeader title="Mis módulos" description="Activa un módulo, comparte el acceso con tus estudiantes y descarga sus asistencias." actions={
      <Link to="/docente/nuevo-modulo" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-ink">
        <SquarePlus className="size-4" /> Nuevo módulo
      </Link>
    } />
    {modules.isLoading ? <PageLoader /> : modules.error ? <Card>
      <EmptyState icon={<Layers className="size-6" />} title="No pudimos cargar tus módulos" description={getErrorMessage(modules.error)}
        action={<Button variant="secondary" onClick={() => void modules.refetch()}>Reintentar</Button>} />
    </Card> : !modules.data?.length ? <Card>
      <EmptyState icon={<Layers className="size-6" />} title="Todavía no tienes módulos" description="Carga los Excel de estudiantes y fechas de clase para activar tu primer módulo." />
    </Card> : <div className="grid gap-4 lg:grid-cols-2">
      {modules.data.map(module => <TeacherModuleCard module={module} key={module.id} />)}
    </div>}
  </>
}

function TeacherModuleCard({ module }: { module: ModuleListItem }) {
  const exportAttendance = useExportAttendance(module.id)
  const toast = useToast()
  const active = module.status === 'ACTIVE'
  const canExport = active || module.status === 'CLOSED'
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

  return <Card className="min-w-0 space-y-4 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-extrabold wrap-anywhere">{module.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {module.firstDate && module.lastDate ? `${formatDate(module.firstDate)} – ${formatDate(module.lastDate)}` : 'Sin fechas de clase'}
        </p>
      </div>
      <ModuleStatusChip status={module.status} />
    </div>
    <dl className="grid grid-cols-2 gap-3 text-sm">
      <div className="rounded-xl bg-canvas px-3 py-2"><dt className="text-muted">Estudiantes</dt><dd className="font-bold">{module.studentCount}</dd></div>
      <div className="rounded-xl bg-canvas px-3 py-2"><dt className="text-muted">Clases</dt><dd className="font-bold">{module.sessionCount}</dd></div>
    </dl>
    {active && <div className="space-y-2.5">
      <Field label="Enlace para estudiantes" htmlFor={`student-access-${module.id}`}>
        <Input id={`student-access-${module.id}`} value={accessUrl.href} readOnly onFocus={event => event.target.select()} />
      </Field>
      <Button size="sm" variant="secondary" icon={<Link2 className="size-4" />} onClick={() => void copyAccess()}>Copiar enlace</Button>
    </div>}
    {canExport && <Button
      variant="secondary"
      icon={<Download className="size-4" />}
      loading={exportAttendance.isPending}
      onClick={() => exportAttendance.mutate(undefined, { onError: error => toast.error(getErrorMessage(error, 'No se pudo descargar el Excel.')) })}
    >Descargar Excel</Button>}
  </Card>
}
