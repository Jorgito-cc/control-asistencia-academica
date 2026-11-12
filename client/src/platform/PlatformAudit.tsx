import { useId, useRef, useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import './platform-audit.css'

const actions = {
  plan: 'Creación de plan',
  activation: 'Activación de cuenta',
  invitation: 'Emisión de invitación',
  verification: 'Verificación de instalación',
  registration: 'Registro de institución',
  request: 'Recepción de solicitud',
} as const

const results = {
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
    id: 'EJ-005', timestamp: '2026-11-11T15:03:00-04:00', action: 'verification',
    description: 'La instalación no respondió a la comprobación HTTP.',
    resource: 'Colegio Valle Verde', reference: 'colegio-valle-verde',
    actor: 'Sistema', actorRole: 'Verificación automática', result: 'failed',
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

const dateFormat = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/La_Paz',
})
const timeFormat = new Intl.DateTimeFormat('es-BO', {
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/La_Paz',
})

function searchable(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export default function PlatformAudit() {
  const titleId = useId()
  const searchInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<Action | 'all'>('all')
  const [result, setResult] = useState<Result | 'all'>('all')
  const terms = searchable(query).trim().split(/\s+/).filter(Boolean)
  const filtering = terms.length > 0 || action !== 'all' || result !== 'all'

  const visible = events.filter((event) => {
    if (action !== 'all' && action !== event.action) return false
    if (result !== 'all' && result !== event.result) return false
    const text = searchable([
      event.id, actions[event.action], event.description, event.resource, event.reference,
      event.actor, event.actorRole, results[event.result],
    ].join(' '))
    return terms.every((term) => text.includes(term))
  })

  function resetFilters() {
    setQuery('')
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
                    <span className={`pau-result pau-result-${event.result}`}>{results[event.result]}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}
