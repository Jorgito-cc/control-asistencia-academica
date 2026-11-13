import { useEffect, useId, useRef, useState } from 'react'
import { ClipboardList, Search, X } from 'lucide-react'
import './platform-audit.css'

const actions = {
  plan: 'Creación de plan',
  activation: 'Activación de cuenta',
  invitation: 'Emisión de invitación',
  verification: 'Verificación de instalación',
  deployment: 'Despliegue',
  registration: 'Registro de institución',
  request: 'Recepción de solicitud',
} as const

const results = {
  started: 'Iniciado',
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
} as const

type Action = keyof typeof actions
type Result = keyof typeof results

type AuditEvent = {
  id: string
  timestamp: string
  action: Action
  description: string
  resource: string
  reference: string
  actor: string
  actorRole: string
  result: Result
  deployment?: {
    operationId: string
    plan: string
    engine: string
    region: string
    duration?: string
  }
}

const horizonDeployment = {
  operationId: 'DES-EJ-001', plan: 'Estándar', engine: 'Terraform', region: 'Virginia del Norte · AWS',
}

const valleyDeployment = {
  operationId: 'DES-EJ-002', plan: 'Básico', engine: 'OpenTofu', region: 'Oregón · AWS',
}

const events: AuditEvent[] = [
  {
    id: 'EJ-008', timestamp: '2026-11-11T17:42:00-04:00', action: 'plan',
    description: 'Se guardó un plan con tres perfiles de máquina.',
    resource: 'Plan Campus', reference: 'plan-campus',
    actor: 'Lucía Vargas', actorRole: 'Operadora', result: 'completed',
  },
  {
    id: 'EJ-007', timestamp: '2026-11-11T16:26:00-04:00', action: 'activation',
    description: 'El administrador completó su primer acceso.',
    resource: 'Instituto Horizonte', reference: 'instituto-horizonte',
    actor: 'Administrador invitado', actorRole: 'Institución', result: 'completed',
  },
  {
    id: 'EJ-006', timestamp: '2026-11-11T16:10:00-04:00', action: 'invitation',
    description: 'Se generó el enlace de activación.',
    resource: 'Instituto Horizonte', reference: 'instituto-horizonte',
    actor: 'Lucía Vargas', actorRole: 'Operadora', result: 'completed',
  },
  {
    id: 'EJ-012', timestamp: '2026-11-11T16:03:12-04:00', action: 'deployment',
    description: 'Frontend, backend y PostgreSQL listos. La aplicación pasó la comprobación de salud.',
    resource: 'Instituto Horizonte', reference: 'instituto-horizonte',
    actor: 'Sistema', actorRole: 'Aprovisionamiento', result: 'completed',
    deployment: { ...horizonDeployment, duration: '3 min 12 s' },
  },
  {
    id: 'EJ-011', timestamp: '2026-11-11T16:00:00-04:00', action: 'deployment',
    description: 'Se inició el aprovisionamiento de las tres instancias del plan Estándar.',
    resource: 'Instituto Horizonte', reference: 'instituto-horizonte',
    actor: 'Lucía Vargas', actorRole: 'Operadora', result: 'started',
    deployment: horizonDeployment,
  },
  {
    id: 'EJ-005', timestamp: '2026-11-11T15:03:00-04:00', action: 'verification',
    description: 'La instalación no respondió a la comprobación HTTP.',
    resource: 'Colegio Valle Verde', reference: 'colegio-valle-verde',
    actor: 'Sistema', actorRole: 'Verificación automática', result: 'failed',
  },
  {
    id: 'EJ-010', timestamp: '2026-11-11T15:00:00-04:00', action: 'deployment',
    description: 'La API no respondió a la comprobación de salud dentro del tiempo esperado.',
    resource: 'Colegio Valle Verde', reference: 'colegio-valle-verde',
    actor: 'Sistema', actorRole: 'Aprovisionamiento', result: 'failed',
    deployment: { ...valleyDeployment, duration: '4 min' },
  },
  {
    id: 'EJ-009', timestamp: '2026-11-11T14:56:00-04:00', action: 'deployment',
    description: 'Se inició el despliegue del plan Básico en el entorno de pruebas.',
    resource: 'Colegio Valle Verde', reference: 'colegio-valle-verde',
    actor: 'Diego Méndez', actorRole: 'Operador', result: 'started',
    deployment: valleyDeployment,
  },
  {
    id: 'EJ-004', timestamp: '2026-11-11T14:52:00-04:00', action: 'registration',
    description: 'Se registró la configuración del entorno de pruebas.',
    resource: 'Colegio Valle Verde', reference: 'colegio-valle-verde',
    actor: 'Diego Méndez', actorRole: 'Operador', result: 'completed',
  },
  {
    id: 'EJ-003', timestamp: '2026-11-11T13:35:00-04:00', action: 'request',
    description: 'La solicitud para el plan Básico espera revisión.',
    resource: 'Centro Educativo Andino', reference: 'Solicitud SOL-EJ-032',
    actor: 'Contacto de la institución', actorRole: 'Sitio público', result: 'pending',
  },
  {
    id: 'EJ-002', timestamp: '2026-11-10T18:20:00-04:00', action: 'registration',
    description: 'Se registró la configuración del entorno de producción.',
    resource: 'Instituto Horizonte', reference: 'instituto-horizonte',
    actor: 'Lucía Vargas', actorRole: 'Operadora', result: 'completed',
  },
  {
    id: 'EJ-001', timestamp: '2026-11-10T17:05:00-04:00', action: 'request',
    description: 'Se recibió la solicitud para el plan Estándar.',
    resource: 'Instituto Horizonte', reference: 'Solicitud SOL-EJ-031',
    actor: 'Contacto de la institución', actorRole: 'Sitio público', result: 'completed',
  },
]

const institutions = [...new Set(events.filter((event) => event.action !== 'plan').map((event) => event.resource))]
  .sort((left, right) => left.localeCompare(right, 'es-BO'))

const dateFormat = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/La_Paz',
})
const timeFormat = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/La_Paz',
})

function searchable(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function AuditResult({ result }: { result: Result }) {
  return <span className={`pau-result pau-result-${result}`}>{results[result]}</span>
}

function AuditDetail({ event, onClose }: { event: AuditEvent; onClose: () => void }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const date = new Date(event.timestamp)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    return () => { if (dialog.open) dialog.close() }
  }, [])

  function close() {
    dialogRef.current?.close()
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="pau-detail-dialog" aria-labelledby={titleId} onCancel={(event) => {
      event.preventDefault()
      close()
    }}>
      <header className="pau-dialog-header">
        <span className="pau-dialog-icon"><ClipboardList size={21} aria-hidden="true" /></span>
        <div>
          <h2 id={titleId}>Detalle del evento</h2>
          <p>{event.id}</p>
        </div>
        <button type="button" className="pau-dialog-close" onClick={close} aria-label="Cerrar detalle">
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="pau-dialog-body">
        <div className="pau-dialog-summary">
          <h3>{actions[event.action]}</h3>
          <AuditResult result={event.result} />
          <p>{event.description}</p>
        </div>
        <dl className="pau-dialog-meta">
          <div><dt>{event.action === 'plan' ? 'Recurso' : 'Institución'}</dt><dd>{event.resource}</dd></div>
          <div><dt>Referencia</dt><dd>{event.reference}</dd></div>
          <div><dt>Actor</dt><dd>{event.actor} · {event.actorRole}</dd></div>
          <div><dt>Fecha y hora</dt><dd><time dateTime={event.timestamp}>{dateFormat.format(date)} · {timeFormat.format(date)}</time></dd></div>
          {event.deployment && <>
            <div><dt>Operación</dt><dd>{event.deployment.operationId}</dd></div>
            <div><dt>Plan</dt><dd>{event.deployment.plan}</dd></div>
            <div><dt>Motor</dt><dd>{event.deployment.engine}</dd></div>
            <div><dt>Región</dt><dd>{event.deployment.region}</dd></div>
            {event.deployment.duration && <div><dt>Duración</dt><dd>{event.deployment.duration}</dd></div>}
          </>}
        </dl>
      </div>
      <footer className="pau-dialog-footer">
        <span className="pau-example">Datos de ejemplo</span>
        <button type="button" className="pau-detail-button" onClick={close}>Cerrar</button>
      </footer>
    </dialog>
  )
}

export default function PlatformAudit() {
  const titleId = useId()
  const institutionLabelId = useId()
  const searchInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [institution, setInstitution] = useState('')
  const [action, setAction] = useState<Action | 'all'>('all')
  const [result, setResult] = useState<Result | 'all'>('all')
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent>()
  const terms = searchable(query).trim().split(/\s+/).filter(Boolean)
  const filtering = terms.length > 0 || institution !== '' || action !== 'all' || result !== 'all'

  const visible = events.filter((event) => {
    if (institution && (event.action === 'plan' || event.resource !== institution)) return false
    if (action !== 'all' && action !== event.action) return false
    if (result !== 'all' && result !== event.result) return false
    const text = searchable([
      event.id, actions[event.action], event.description, event.resource, event.reference,
      event.actor, event.actorRole, results[event.result],
      event.deployment?.operationId, event.deployment?.engine,
    ].join(' '))
    return terms.every((term) => text.includes(term))
  })

  function resetFilters() {
    setQuery('')
    setInstitution('')
    setAction('all')
    setResult('all')
    searchInput.current?.focus()
  }

  return (
    <section className="pau-panel" aria-labelledby={titleId}>
      <div className="pau-header">
        <div>
          <h2 id={titleId}>Registro de eventos</h2>
          <p>Hora de Bolivia</p>
        </div>
        <span className="pau-example">Datos de ejemplo</span>
      </div>

      <div className="pau-filters">
        <label className="pau-field">
          <span>Buscar evento</span>
          <span className="pau-search">
            <Search size={16} aria-hidden="true" />
            <input
              ref={searchInput}
              type="search"
              placeholder="Actor, acción o institución"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </span>
        </label>
        <label className="pau-field">
          <span id={institutionLabelId}>Institución</span>
          <select aria-labelledby={institutionLabelId} value={institution} onChange={(event) => setInstitution(event.target.value)}>
            <option value="">Todas las instituciones</option>
            {institutions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="pau-field">
          <span id="pau-action-label">Acción</span>
          <select aria-labelledby="pau-action-label" value={action} onChange={(event) => setAction(event.target.value as Action | 'all')}>
            <option value="all">Todas las acciones</option>
            {Object.entries(actions).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="pau-field">
          <span id="pau-result-label">Resultado</span>
          <select aria-labelledby="pau-result-label" value={result} onChange={(event) => setResult(event.target.value as Result | 'all')}>
            <option value="all">Todos los resultados</option>
            {Object.entries(results).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="pau-summary">
        <p role="status" aria-atomic="true">
          {filtering ? `${visible.length} de ${events.length} eventos` : `${events.length} eventos`}
        </p>
        {filtering && <button type="button" className="pau-clear" onClick={resetFilters}>Limpiar filtros</button>}
      </div>

      {visible.length === 0 ? (
        <div className="pau-empty">
          <span className="pau-empty-icon"><ClipboardList size={22} aria-hidden="true" /></span>
          <strong>No hay eventos que coincidan</strong>
          <p>Prueba con otros términos o cambia los filtros.</p>
        </div>
      ) : (
        <table className="pau-table" aria-labelledby={titleId} role="table">
          <thead role="rowgroup">
            <tr role="row">
              <th scope="col" role="columnheader">Acción</th>
              <th scope="col" role="columnheader">Institución o recurso</th>
              <th scope="col" role="columnheader">Actor</th>
              <th scope="col" role="columnheader">Fecha y hora</th>
              <th scope="col" role="columnheader">Resultado</th>
              <th scope="col" role="columnheader">Detalle</th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {visible.map((event) => {
              const date = new Date(event.timestamp)
              return (
                <tr key={event.id} role="row">
                  <th className="pau-action" scope="row" role="rowheader">
                    <strong>{actions[event.action]}</strong>
                    <small>{event.description}</small>
                  </th>
                  <td role="cell">
                    <span className="pau-mobile-label" aria-hidden="true">Institución o recurso</span>
                    <strong>{event.resource}</strong>
                    <small>{event.reference}</small>
                  </td>
                  <td role="cell">
                    <span className="pau-mobile-label" aria-hidden="true">Actor</span>
                    <strong>{event.actor}</strong>
                    <small>{event.actorRole}</small>
                  </td>
                  <td role="cell">
                    <span className="pau-mobile-label" aria-hidden="true">Fecha y hora</span>
                    <time dateTime={event.timestamp}>
                      {dateFormat.format(date)}<small>{timeFormat.format(date)}</small>
                    </time>
                  </td>
                  <td role="cell">
                    <span className="pau-mobile-label" aria-hidden="true">Resultado</span>
                    <AuditResult result={event.result} />
                  </td>
                  <td role="cell">
                    <button type="button" className="pau-detail-button" aria-haspopup="dialog"
                      aria-label={`Ver detalle de ${actions[event.action].toLocaleLowerCase('es')} para ${event.resource}, ${results[event.result]}`}
                      onClick={() => setSelectedEvent(event)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {selectedEvent && <AuditDetail event={selectedEvent} onClose={() => setSelectedEvent(undefined)} />}
    </section>
  )
}
