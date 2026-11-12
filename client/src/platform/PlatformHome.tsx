import { ArrowRight, Building2, ClipboardList, Layers3 } from 'lucide-react'
import { formatDate, formatNumber, type Plan, type TenantRequest } from './api'
import './platform-home.css'

type Props = {
  requests: TenantRequest[]
  plans: Plan[]
  onPending: () => void
  onRequests: () => void
  onTenants: () => void
  onPlans: () => void
  onRequest: (id: string) => void
}

export default function PlatformHome({ requests, plans, onPending, onRequests, onTenants, onPlans, onRequest }: Props) {
  const pending = requests.filter(request => request.status === 'pending').length
  const counters = [
    { label: 'Solicitudes pendientes', value: pending, Icon: ClipboardList, tone: 'amber', onClick: onPending },
    { label: 'Instituciones registradas', value: requests.length - pending, Icon: Building2, tone: 'green', onClick: onTenants },
    { label: 'Planes disponibles', value: plans.length, Icon: Layers3, tone: 'violet', onClick: onPlans },
  ]
  const planNames = new Map(plans.map(plan => [plan.id, plan.name]))

  return <div className="pah-home">
    <div className="pah-counters" aria-label="Resumen de la plataforma">
      {counters.map(({ label, value, Icon, tone, onClick }) => <button className="pa-card pah-counter" type="button" key={label} onClick={onClick}>
        <span className={`pah-tile pah-tile-${tone}`}><Icon size={21} aria-hidden="true" /></span>
        <span className="pah-counter-copy"><span>{label}</span><strong>{formatNumber(value)}</strong></span>
        <ArrowRight size={17} className="pah-arrow" aria-hidden="true" />
      </button>)}
    </div>

    <div className="pah-panels">
      <section className="pa-card pah-panel" aria-labelledby="pah-requests-heading">
        <div className="pah-panel-head">
          <h2 id="pah-requests-heading">Solicitudes recientes</h2>
          <button className="pah-link" type="button" onClick={onRequests}>Ver solicitudes <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
        {requests.length > 0 ? <ul className="pah-list">
          {requests.slice(0, 5).map(request => <li key={request.id}>
            <button className="pah-request" type="button" onClick={() => onRequest(request.id)}>
              <span className="pah-request-info">
                <strong>{request.institutionName}</strong>
                <span>{planNames.get(request.planId) ?? request.planId} · {formatDate(request.createdAt)}</span>
              </span>
              <span className={`pa-status pa-status-${request.status}`}>{request.status === 'registered' ? 'Registrada' : 'Pendiente'}</span>
            </button>
          </li>)}
        </ul> : <p className="pah-empty">Todavía no hay solicitudes.</p>}
      </section>

      <section className="pa-card pah-panel" aria-labelledby="pah-plans-heading">
        <div className="pah-panel-head">
          <h2 id="pah-plans-heading">Catálogo de planes</h2>
          <button className="pah-link" type="button" onClick={onPlans}>Ver planes <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
        {plans.length > 0 ? <ul className="pah-list">
          {plans.slice(0, 5).map(plan => <li className="pah-plan" key={plan.id}>
            <span className="pah-plan-icon"><Layers3 size={17} aria-hidden="true" /></span>
            <span className="pah-request-info"><strong>{plan.name}</strong><span>Hasta {formatNumber(plan.limitStudents)} estudiantes</span></span>
            <span className="pah-plan-storage">{formatNumber(plan.databaseGb)} GB de datos</span>
          </li>)}
        </ul> : <p className="pah-empty">El catálogo está vacío.</p>}
      </section>
    </div>
  </div>
}
