import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CircleAlert, Database, Layers3, LoaderCircle, Monitor, Plus, Server, X } from 'lucide-react'
import { ApiError, api, errorMessage, type Plan, type PlanInstance } from './api'
import './create-plan.css'

type CreatePlanDialogProps = {
  onClose: () => void
  onCreated: (plan: Plan) => void
  onSessionExpired: () => void
}

const maxInteger = 2_147_483_647

const roleFields = [
  { role: 'frontend', label: 'Frontend', Icon: Monitor, vcpu: 2, ramGib: 1, systemDiskGb: 32, awsType: 't3.micro', azureType: 'Standard_B2ts_v2' },
  { role: 'backend', label: 'Backend', Icon: Server, vcpu: 2, ramGib: 4, systemDiskGb: 32, awsType: 't3.medium', azureType: 'Standard_B2ls_v2' },
  { role: 'database', label: 'Base de datos', Icon: Database, vcpu: 2, ramGib: 4, systemDiskGb: 32, awsType: 't3.medium', azureType: 'Standard_B2ls_v2' },
] satisfies (PlanInstance & { label: string; Icon: typeof Monitor })[]

function InstanceFields({ fields }: { fields: (typeof roleFields)[number] }) {
  const { role, Icon } = fields
  return <fieldset className="pcd-instance">
    <legend><span><Icon size={16} aria-hidden="true" /> {fields.label}</span></legend>
    <div className="pcd-instance-fields">
      <label className="pcd-field">
        <span>vCPU</span>
        <input name={`${role}.vcpu`} type="number" inputMode="numeric" min={1} max={maxInteger} step={1} defaultValue={fields.vcpu} required />
      </label>
      <label className="pcd-field">
        <span>RAM (GiB)</span>
        <input name={`${role}.ramGib`} type="number" inputMode="decimal" min={0.01} max={9999.99} step={0.01} defaultValue={fields.ramGib} required />
      </label>
      <label className="pcd-field pcd-full">
        <span>Disco del sistema (GB)</span>
        <input name={`${role}.systemDiskGb`} type="number" inputMode="numeric" min={1} max={maxInteger} step={1} defaultValue={fields.systemDiskGb} required />
      </label>
      <label className="pcd-field pcd-full">
        <span>Modelo de referencia AWS</span>
        <input className="pcd-model" name={`${role}.awsType`} defaultValue={fields.awsType} maxLength={80} spellCheck={false} required />
      </label>
      <label className="pcd-field pcd-full">
        <span>Modelo de referencia Azure</span>
        <input className="pcd-model" name={`${role}.azureType`} defaultValue={fields.azureType} maxLength={80} spellCheck={false} required />
      </label>
    </div>
  </fieldset>
}

export default function CreatePlanDialog({ onClose, onCreated, onSessionExpired }: CreatePlanDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    nameRef.current?.focus({ preventScroll: true })
    return () => { if (dialog.open) dialog.close() }
  }, [])

  function dismiss() {
    dialogRef.current?.close()
    onClose()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const read = (field: string) => String(data.get(field) ?? '').trim()
    const draft = {
      name: read('name'),
      description: read('description'),
      limitStudents: Number(read('limitStudents')),
      databaseGb: Number(read('databaseGb')),
      backup: read('backup'),
      instances: roleFields.map(({ role }): PlanInstance => ({
        role,
        vcpu: Number(read(`${role}.vcpu`)),
        ramGib: Number(read(`${role}.ramGib`)),
        systemDiskGb: Number(read(`${role}.systemDiskGb`)),
        awsType: read(`${role}.awsType`),
        azureType: read(`${role}.azureType`),
      })),
    }
    if (!draft.name || !draft.description || !draft.backup || draft.instances.some(instance => !instance.awsType || !instance.azureType)) {
      setError('Completa el nombre, la descripción, la frecuencia de respaldo y los modelos de cada instancia.')
      return
    }
    setError('')
    setBusy(true)
    try {
      const { plan } = await api<{ plan: Plan }>('/api/platform/plans', {
        method: 'POST', body: JSON.stringify(draft),
      })
      dialogRef.current?.close()
      onCreated(plan)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onSessionExpired()
      else setError(errorMessage(cause, 'No se pudo guardar el plan. Intenta de nuevo.'))
    } finally {
      setBusy(false)
    }
  }

  return <dialog className="pcd-dialog" ref={dialogRef} aria-labelledby="pcd-title" onCancel={event => {
    event.preventDefault()
    if (!busy) dismiss()
  }}>
    <form className="pcd-form" onSubmit={submit} aria-busy={busy}>
      <header className="pcd-header">
        <span className="pcd-header-icon"><Layers3 size={23} aria-hidden="true" /></span>
        <div><h2 id="pcd-title">Crear plan</h2><p>Define la capacidad y los recursos que ofrecerá este plan.</p></div>
        <button type="button" className="pcd-close" onClick={dismiss} disabled={busy} aria-label="Cerrar formulario"><X size={20} /></button>
      </header>
      <div className="pcd-body">
        <fieldset className="pcd-general" disabled={busy}>
          <legend>Datos del plan</legend>
          <div className="pcd-general-fields">
            <label className="pcd-field pcd-full"><span>Nombre</span><input ref={nameRef} name="name" maxLength={80} required /></label>
            <label className="pcd-field pcd-full"><span>Descripción</span><textarea name="description" maxLength={500} rows={2} required /></label>
            <label className="pcd-field"><span>Límite de estudiantes</span><input name="limitStudents" type="number" inputMode="numeric" min={1} max={maxInteger} step={1} defaultValue={100} required /></label>
            <label className="pcd-field"><span>Disco de datos PostgreSQL (GB)</span><input name="databaseGb" type="number" inputMode="numeric" min={1} max={maxInteger} step={1} defaultValue={10} required /></label>
            <label className="pcd-field pcd-backup"><span>Frecuencia de respaldo</span><input name="backup" maxLength={120} defaultValue="Semanal" required /></label>
          </div>
        </fieldset>
        <fieldset className="pcd-resources" disabled={busy}>
          <legend>Instancias de referencia</legend>
          <p>Los discos del sistema se configuran por separado del disco de datos PostgreSQL.</p>
          <div className="pcd-resource-grid">
            {roleFields.map(fields => <InstanceFields key={fields.role} fields={fields} />)}
          </div>
        </fieldset>
      </div>
      <footer className="pcd-footer">
        {error && <div className="pcd-error" role="alert"><CircleAlert size={17} aria-hidden="true" /><span>{error}</span></div>}
        <div className="pcd-footer-row">
          <p>Al guardar, el plan aparece en el catálogo público.</p>
          <div className="pcd-actions">
            <button type="button" className="pcd-secondary" onClick={dismiss} disabled={busy}>Cancelar</button>
            <button type="submit" className="pcd-primary" disabled={busy}>
              {busy ? <LoaderCircle className="pcd-spinner" size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
              {busy ? 'Guardando…' : 'Guardar plan'}
            </button>
          </div>
        </div>
      </footer>
    </form>
  </dialog>
}
