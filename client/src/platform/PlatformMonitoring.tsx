import { useState } from 'react'
import { Activity, CircleAlert, CircleCheck, Clock3, Cpu, Database, FlaskConical, HardDrive, MemoryStick, Monitor, Server } from 'lucide-react'
import './platform-monitoring.css'

const institutions = { aurora: 'Instituto Aurora', boreal: 'Colegio Boreal' }
const environments = { production: 'Producción', staging: 'Pruebas' }
type Institution = keyof typeof institutions
type Environment = keyof typeof environments

type Sample = {
  cpu: number[]
  ram: number[]
  disk: number[]
  latency: number[]
  connections: number
  incident?: 'ram' | 'disk'
}

const samples: Record<Institution, Record<Environment, Sample>> = {
  aurora: {
    production: {
      cpu: [28, 32, 28, 42, 38, 48, 36, 39, 48, 51, 46, 54],
      ram: [58, 61, 64, 64, 68, 71, 74, 75, 79, 82, 87, 85],
      disk: [57, 57, 57, 59, 59, 60, 60, 61, 61, 62, 63, 64],
      latency: [78, 82, 105, 81, 90, 120, 112, 154, 139, 205, 242, 218],
      connections: 24,
      incident: 'ram',
    },
    staging: {
      cpu: [11, 10, 12, 16, 13, 19, 11, 14, 13, 16, 21, 17],
      ram: [28, 29, 29, 29, 34, 34, 33, 32, 36, 35, 37, 35],
      disk: [22, 22, 22, 22, 23, 23, 23, 24, 24, 24, 24, 25],
      latency: [37, 44, 45, 42, 51, 48, 41, 40, 56, 49, 53, 46],
      connections: 5,
    },
  },
  boreal: {
    production: {
      cpu: [21, 29, 34, 29, 35, 41, 39, 35, 41, 47, 48, 43],
      ram: [44, 45, 45, 48, 49, 53, 53, 56, 57, 59, 62, 59],
      disk: [73, 73, 74, 74, 76, 77, 77, 78, 80, 81, 83, 84],
      latency: [63, 71, 88, 82, 85, 86, 103, 91, 107, 104, 123, 108],
      connections: 17,
      incident: 'disk',
    },
    staging: {
      cpu: [9, 11, 8, 13, 11, 16, 9, 12, 16, 14, 17, 12],
      ram: [21, 22, 21, 23, 24, 24, 27, 25, 25, 26, 28, 27],
      disk: [16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 19, 19],
      latency: [27, 29, 36, 27, 32, 42, 35, 33, 36, 41, 38, 34],
      connections: 3,
    },
  },
}

const metrics = [
  { id: 'cpu', label: 'CPU', unit: '%', scale: 100, Icon: Cpu },
  { id: 'ram', label: 'Memoria RAM', unit: '%', scale: 100, Icon: MemoryStick },
  { id: 'disk', label: 'Disco de datos', unit: '%', scale: 100, Icon: HardDrive },
  { id: 'latency', label: 'Latencia de la API (p95)', unit: ' ms', scale: 300, Icon: Activity },
] as const

const services = [
  { id: 'frontend', label: 'Frontend', Icon: Monitor },
  { id: 'backend', label: 'API de asistencia', Icon: Server },
  { id: 'database', label: 'PostgreSQL', Icon: Database },
] as const

function latest(series: number[]) {
  return series[series.length - 1]
}

function MetricCard({ metric, series, warning }: { metric: (typeof metrics)[number]; series: number[]; warning: boolean }) {
  const { label, unit, scale, Icon } = metric
  return <article className={`pm-metric${warning ? ' pm-metric-warning' : ''}`}>
    <div className="pm-metric-label"><span><Icon size={16} aria-hidden="true" /></span><h3>{label}</h3></div>
    <div className="pm-metric-values"><strong>{latest(series)}<small>{unit}</small></strong><span>Máx. {Math.max(...series)}{unit}</span></div>
    <div className="pm-bars" aria-hidden="true">
      {series.map((value, index) => <span key={index} style={{ height: `${(value / scale) * 100}%` }} />)}
    </div>
  </article>
}

function ServiceStatus({ sample }: { sample: Sample }) {
  return <section className="pm-panel" aria-labelledby="pm-services-title">
    <div className="pm-panel-heading"><span className="pm-section-icon"><Server size={19} aria-hidden="true" /></span><h2 id="pm-services-title">Estado de los servicios</h2></div>
    <ul className="pm-service-list">
      {services.map(({ id, label, Icon }) => {
        const degraded = (id === 'backend' && sample.incident === 'ram') || (id === 'database' && sample.incident === 'disk')
        return <li key={id}>
          <span className="pm-service-icon"><Icon size={18} aria-hidden="true" /></span>
          <div><strong>{label}</strong><p>{id === 'database' ? `${sample.connections} de 50 conexiones` : id === 'backend' ? `HTTP 200 · p95 ${latest(sample.latency)} ms` : 'HTTP 200'}</p></div>
          <span className={`pm-status${degraded ? ' pm-status-warning' : ''}`}>{degraded ? <CircleAlert size={13} aria-hidden="true" /> : <CircleCheck size={13} aria-hidden="true" />}{degraded ? 'Degradado' : 'Operativo'}</span>
        </li>
      })}
    </ul>
  </section>
}

function RecentActivity({ sample }: { sample: Sample }) {
  const incident = sample.incident
  const warningTitle = incident === 'ram' ? 'Uso elevado de memoria' : 'Disco de PostgreSQL próximo al límite'
  return <section className="pm-panel" aria-labelledby="pm-events-title">
    <div className="pm-panel-heading"><span className="pm-section-icon"><Activity size={19} aria-hidden="true" /></span><h2 id="pm-events-title">Alertas y eventos</h2></div>
    <ul className="pm-event-list">
      {incident && <li className="pm-event-warning"><CircleAlert size={17} aria-hidden="true" /><div>
        <div className="pm-event-title"><strong>{warningTitle}</strong><time>10:50</time></div>
        <p>El valor máximo fue {Math.max(...sample[incident])}%. La alerta se activa a partir del 80%.</p>
      </div></li>}
      {!incident && <li><CircleCheck size={17} aria-hidden="true" /><div>
        <div className="pm-event-title"><strong>Sin alertas activas</strong><time>11:00</time></div>
        <p>Las métricas se mantuvieron dentro del umbral del ejemplo.</p>
      </div></li>}
      <li><CircleCheck size={17} aria-hidden="true" /><div>
        <div className="pm-event-title"><strong>Chequeo de PostgreSQL completado</strong><time>10:35</time></div>
        <p>La base de datos aceptó la conexión de prueba.</p>
      </div></li>
    </ul>
  </section>
}

export default function PlatformMonitoring() {
  const [institution, setInstitution] = useState<Institution>('aurora')
  const [environment, setEnvironment] = useState<Environment>('production')
  const sample = samples[institution][environment]

  return <div className="pm-dashboard">
    <div className="pm-toolbar">
      <div className="pm-demo"><span className="pm-demo-icon"><FlaskConical size={19} aria-hidden="true" /></span><div><strong>Datos de demostración</strong><p>Métricas simuladas para ilustrar el panel.</p></div></div>
      <div className="pm-filters">
        <label><span id="pm-institution-label">Institución de ejemplo</span><select aria-labelledby="pm-institution-label" value={institution} onChange={event => setInstitution(event.target.value as Institution)}>
          {Object.entries(institutions).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        <label><span id="pm-environment-label">Entorno</span><select aria-labelledby="pm-environment-label" value={environment} onChange={event => setEnvironment(event.target.value as Environment)}>
          {Object.entries(environments).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
      </div>
    </div>
    <section aria-labelledby="pm-usage-title">
      <header className="pm-usage-heading"><h2 id="pm-usage-title">Uso y rendimiento</h2><span><Clock3 size={15} aria-hidden="true" /> 10:00–11:00 · Hora simulada</span></header>
      <div className="pm-metrics">{metrics.map(metric => <MetricCard key={metric.id} metric={metric} series={sample[metric.id]} warning={sample.incident === metric.id} />)}</div>
    </section>
    <div className="pm-details"><ServiceStatus sample={sample} /><RecentActivity sample={sample} /></div>
  </div>
}
