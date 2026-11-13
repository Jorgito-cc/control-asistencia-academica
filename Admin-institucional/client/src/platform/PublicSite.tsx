import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Building2, CalendarCheck2, CalendarDays,
  Check, CheckCircle2, ClipboardList, Clock3, Cloud, Copy, Database, ExternalLink, Globe2, GraduationCap, LockKeyhole,
  Mail, Monitor, RefreshCw, Server, ShieldCheck,
} from 'lucide-react'
import { api, ApiError, attendanceLoginLink, errorMessage, formatDate, formatNumber } from './api'
import type { InvitationStatus, Plan, PlanInstance, TrackedRequest } from './api'

function Brand() {
  return <Link className="public-brand" to="/" aria-label="Asistencia, inicio">
    <span className="brand-icon"><CalendarCheck2 size={22} /></span>
    <span>Asistencia</span>
  </Link>
}

export function PublicHeader() {
  return <header className="public-header">
    <div className="public-container header-inner">
      <Brand />
      <nav className="public-navigation" aria-label="Navegación principal">
        <a href="/#planes">Planes</a>
        <a href="/#como-funciona">Cómo funciona</a>
      </nav>
      <Link className="team-link" to="/plataforma/login">
        <LockKeyhole size={15} /> <span>Acceso de plataforma</span><ArrowRight size={15} />
      </Link>
    </div>
  </header>
}

const attendanceDays = [
  { day: 'Lun', amount: 83 },
  { day: 'Mar', amount: 87 },
  { day: 'Mié', amount: 90 },
  { day: 'Jue', amount: 86 },
  { day: 'Vie', amount: 93 },
]

function AttendancePreview() {
  return <figure className="attendance-preview" aria-label="Ejemplo del panel de asistencia de Instituto San Marcos">
    <div className="preview-decoration" aria-hidden="true" />
    <div className="preview-window">
      <div className="preview-toolbar">
        <span className="preview-school-icon"><Building2 size={17} /></span>
        <span><strong>Instituto San Marcos</strong><small>Panel de asistencia</small></span>
        <span className="preview-avatar" aria-label="Instituto San Marcos">SM</span>
      </div>
      <div className="preview-content">
        <div className="preview-heading">
          <div><span>Resumen del módulo</span><strong>Asistencia de hoy</strong></div>
          <span className="preview-date"><CalendarDays size={13} /> Hoy</span>
        </div>
        <div className="preview-stats">
          <div><span className="stat-dot stat-present" /> Presentes<strong>27</strong></div>
          <div><span className="stat-dot stat-late" /> Tardanzas<strong>2</strong></div>
          <div><span className="stat-dot stat-absent" /> Faltas<strong>1</strong></div>
        </div>
        <div className="preview-chart">
          <div className="chart-title"><strong>Asistencia semanal</strong><span>5 clases</span></div>
          <div className="chart-bars" aria-label="Asistencia semanal entre 83 y 93 por ciento">
            {attendanceDays.map(({ day, amount }) => <div className="chart-column" key={day}>
              <span className={day === 'Mié' ? 'chart-bar chart-bar-selected' : 'chart-bar'} style={{ height: `${amount}%` }} title={`${day} ${amount}%`} />
              <span className="chart-day">{day}</span>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="preview-floating"><span><Check size={18} strokeWidth={2.7} /></span><div><strong>Asistencia registrada</strong><small>La clase de hoy</small></div></div>
    <figcaption>Vista de ejemplo</figcaption>
  </figure>
}

function Hero() {
  return <section className="public-hero public-container" aria-labelledby="landing-title">
    <div className="hero-copy">
      <div className="hero-category"><GraduationCap size={18} /> Para instituciones educativas</div>
      <h1 id="landing-title">La asistencia de tu institución, <span>en un solo lugar.</span></h1>
      <p>Registra asistencias, organiza a tus estudiantes y consulta reportes en un espacio propio para tu institución.</p>
      <div className="hero-actions">
        <a className="button button-primary" href="#planes">Comparar planes <ArrowDownRight size={18} /></a>
        <a className="button button-quiet" href="#como-funciona">Cómo funciona <ArrowRight size={17} /></a>
      </div>
      <div className="hero-trust"><ShieldCheck size={18} /> Tu institución tiene su propio acceso y datos separados.</div>
    </div>
    <AttendancePreview />
  </section>
}

const steps = [
  { title: 'Elige tu plan', description: 'Compara la capacidad de los planes y selecciona el que mejor se adapte a tu institución.', icon: ClipboardList },
  { title: 'Envía tus datos', description: 'Indica quién administrará la cuenta. Puedes consultar el estado de tu solicitud desde su enlace privado.', icon: Building2 },
  { title: 'Activa tu acceso', description: 'Cuando tu instalación esté lista, recibirás una invitación para activar la cuenta de administración.', icon: CheckCircle2 },
]

function HowItWorks() {
  return <section className="public-container flow-section" id="como-funciona" aria-labelledby="flow-title">
    <div className="section-heading section-heading-left">
      <h2 id="flow-title">De la solicitud a tu espacio de asistencia</h2>
    </div>
    <div className="flow-grid">
      {steps.map(({ title, description, icon: Icon }) => <article className="flow-step" key={title}>
        <span className="flow-icon"><Icon size={23} /></span>
        <h3>{title}</h3>
        <p>{description}</p>
      </article>)}
    </div>
  </section>
}

function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api<{ plans: Plan[] }>('/api/plans', { signal: controller.signal })
      .then(({ plans }) => setPlans(plans))
      .catch(() => {
        if (!controller.signal.aborted) setError('Por el momento no podemos cargar los planes.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setLoading(true)
    setError('')
    setAttempt((current) => current + 1)
  }

  return { plans, loading, error, retry }
}

type CloudProvider = 'aws' | 'azure'

const instanceRoles = [
  { id: 'frontend', label: 'Frontend', technology: 'NGINX + React', icon: Monitor },
  { id: 'backend', label: 'Backend', technology: 'API NestJS', icon: Server },
  { id: 'database', label: 'Base de datos', technology: 'PostgreSQL', icon: Database },
] as const

function instanceModel(instance: PlanInstance, provider: CloudProvider) {
  return provider === 'aws' ? instance.awsType : instance.azureType
}

function PlanCards({ plans, provider, onSelect }: { plans: Plan[]; provider: CloudProvider; onSelect: (id: string) => void }) {
  return <div className="plan-grid">
    {plans.map((plan) => <article className={`plan-card${plan.id === 'estandar' ? ' plan-card-emphasis' : ''}`} key={plan.id}>
      <span className="plan-icon"><Database size={21} /></span>
      <h3>{plan.name}</h3>
      <p>{plan.description}</p>
      <div className="plan-capacity"><strong>{formatNumber(plan.limitStudents)}</strong> <span>estudiantes como máximo</span></div>
      {(plan.instances?.length ?? 0) > 0 && <ul className="plan-instances" aria-label={`Instancias del plan ${plan.name}`}>
        {instanceRoles.map(({ id, label, icon: Icon }) => {
          const instance = plan.instances.find(({ role }) => role === id)
          if (!instance) return null
          return <li key={id}>
            <span className="plan-role-icon"><Icon size={16} aria-hidden="true" /></span>
            <span className="plan-role-name"><strong>{label}</strong><code>{instanceModel(instance, provider)}</code></span>
            <span className="plan-role-spec">{instance.vcpu} vCPU <span aria-hidden="true">·</span> {instance.ramGib} GiB RAM</span>
          </li>
        })}
      </ul>}
      <dl className="plan-storage">
        <div><dt><Database size={15} aria-hidden="true" /> Datos PostgreSQL</dt><dd>{formatNumber(plan.databaseGb)} GB</dd></div>
        <div><dt><ShieldCheck size={15} aria-hidden="true" /> Respaldo previsto</dt><dd>{plan.backup}</dd></div>
      </dl>
      <a className={`button ${plan.id === 'estandar' ? 'button-primary' : 'button-outline'}`} href="#solicitud" onClick={() => onSelect(plan.id)}>
        Solicitar {plan.name} <ArrowRight size={17} />
      </a>
    </article>)}
  </div>
}

function PlanComparison({ plans, provider }: { plans: Plan[]; provider: CloudProvider }) {
  return <section className="plan-comparison" id="comparacion-planes" aria-labelledby="comparison-title">
    <div className="plan-comparison-header">
      <div><h3 id="comparison-title">Comparación técnica</h3><p>Capacidad por instancia y almacenamiento de cada plan.</p></div>
      <span className="comparison-provider"><Cloud size={17} aria-hidden="true" /> {provider === 'aws' ? 'AWS EC2' : 'Azure Virtual Machines'}</span>
    </div>
    <div className="plan-table-scroll" role="region" aria-label="Tabla de comparación de planes" tabIndex={0}>
      <table className="plan-table" aria-labelledby="comparison-title" style={{ minWidth: Math.max(555, 156 + plans.length * 136) }}>
        <thead><tr><th scope="col">Recurso</th>{plans.map((plan) => <th scope="col" key={plan.id}>{plan.name}</th>)}</tr></thead>
        <tbody>
          {instanceRoles.map(({ id, label, technology, icon: Icon }) => <tr key={id}>
            <th scope="row"><span className="plan-table-role"><Icon size={18} aria-hidden="true" /><span>{label}<small>{technology}</small></span></span></th>
            {plans.map((plan) => {
              const instance = plan.instances?.find(({ role }) => role === id)
              return <td key={plan.id}>{instance ? <>
                <code>{instanceModel(instance, provider)}</code>
                <small>{instance.vcpu} vCPU · {instance.ramGib} GiB de RAM</small>
                <small>{instance.systemDiskGb} GB para el sistema</small>
              </> : '—'}</td>
            })}
          </tr>)}
          <tr><th scope="row">Disco de datos PostgreSQL</th>{plans.map((plan) => <td key={plan.id}>{formatNumber(plan.databaseGb)} GB</td>)}</tr>
          <tr><th scope="row">Límite de estudiantes</th>{plans.map((plan) => <td key={plan.id}>{formatNumber(plan.limitStudents)}</td>)}</tr>
          <tr><th scope="row">Respaldo previsto</th>{plans.map((plan) => <td key={plan.id}>{plan.backup}</td>)}</tr>
        </tbody>
      </table>
    </div>
    <p className="plan-comparison-note">El disco de datos de PostgreSQL se suma al disco de sistema de su instancia.</p>
  </section>
}

const instanceFlow = [
  { icon: Globe2, label: 'Navegador', detail: 'Conexión HTTPS' },
  { icon: Monitor, label: 'Frontend público', detail: 'NGINX sirve React' },
  { icon: Server, label: 'Backend privado', detail: 'NestJS procesa solicitudes' },
  { icon: Database, label: 'PostgreSQL privado', detail: 'Guarda los datos de la institución' },
]

function PlanCatalog({ plans, onSelect }: { plans: Plan[]; onSelect: (id: string) => void }) {
  const [provider, setProvider] = useState<CloudProvider>('aws')

  return <>
    <div className="plan-catalog-tools">
      <p><Server size={19} aria-hidden="true" /> <strong>Tres instancias por institución</strong><span>·</span><span>Configuración de referencia</span></p>
      <div className="plan-provider-toggle" role="group" aria-label="Proveedor de referencia">
        <button type="button" aria-pressed={provider === 'aws'} onClick={() => setProvider('aws')}>AWS</button>
        <button type="button" aria-pressed={provider === 'azure'} onClick={() => setProvider('azure')}>Azure</button>
      </div>
    </div>
    <PlanCards plans={plans} provider={provider} onSelect={onSelect} />
    <PlanComparison plans={plans} provider={provider} />
    <section className="plan-architecture" aria-labelledby="architecture-title">
      <h3 id="architecture-title">Diseño de red por institución</h3>
      <ol className="instance-flow">
        {instanceFlow.map(({ icon: Icon, label, detail }) => <li key={label}>
          <span className="instance-flow-icon"><Icon size={20} aria-hidden="true" /></span>
          <span><strong>{label}</strong><small>{detail}</small></span>
        </li>)}
      </ol>
    </section>
  </>
}

function RequestForm({ plans, planId, setPlanId }: { plans: Plan[]; planId: string; setPlanId: (id: string) => void }) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const selectedPlan = plans.find((plan) => plan.id === planId)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const institutionName = String(data.get('institutionName') ?? '').trim()
    const adminName = String(data.get('adminName') ?? '').trim()
    const adminEmail = String(data.get('adminEmail') ?? '').trim()
    setFormError('')
    setSubmitting(true)
    try {
      const { trackingToken } = await api<{ trackingToken: string }>('/api/requests', {
        method: 'POST', body: JSON.stringify({ institutionName, adminName, adminEmail, planId }),
      })
      navigate(`/seguimiento/${encodeURIComponent(trackingToken)}`)
      window.scrollTo(0, 0)
    } catch (error) {
      setFormError(errorMessage(error, 'No se pudo enviar la solicitud. Inténtalo otra vez.'))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="request-section" id="solicitud" aria-labelledby="request-title">
    <div className="public-container request-inner">
      <div className="request-intro">
        <span className="request-icon"><Building2 size={25} /></span>
        <h2 id="request-title">Solicita un espacio para tu institución</h2>
        <p>Indica tus datos de contacto y el plan elegido. Nuestro equipo revisará la solicitud y podrás consultar su progreso.</p>
        <div className="request-note"><LockKeyhole size={17} /> El correo se usará para contactar al administrador de tu institución.</div>
      </div>
      <form className="request-form" onSubmit={submit}>
        <label htmlFor="institutionName">Nombre de la institución</label>
        <input id="institutionName" name="institutionName" autoComplete="organization" placeholder="Instituto San Marcos" minLength={2} maxLength={120} required />
        <label htmlFor="adminName">Nombre del administrador</label>
        <input id="adminName" name="adminName" autoComplete="name" placeholder="Ana Pérez" minLength={2} maxLength={120} required />
        <label htmlFor="adminEmail">Correo del administrador</label>
        <input id="adminEmail" type="email" name="adminEmail" autoComplete="email" placeholder="ana@institucion.edu" maxLength={254} required />
        <label htmlFor="planId">Plan</label>
        <select id="planId" name="planId" value={planId} onChange={(event) => setPlanId(event.target.value)} disabled={plans.length === 0} required>
          <option value="">Selecciona un plan</option>
          {plans.map((plan) => <option value={plan.id} key={plan.id}>{plan.name} · {formatNumber(plan.limitStudents)} estudiantes</option>)}
        </select>
        {selectedPlan && <div className="request-plan-summary">
          <Database size={16} aria-hidden="true" /> <span>{formatNumber(selectedPlan.databaseGb)} GB para datos PostgreSQL</span>
          <a href="#comparacion-planes">Ver especificaciones</a>
        </div>}
        {formError && <p className="public-error" role="alert">{formError}</p>}
        <button className="button button-primary" type="submit" disabled={submitting || plans.length === 0}>
          {submitting ? 'Enviando solicitud…' : 'Enviar solicitud'} <ArrowRight size={18} />
        </button>
      </form>
    </div>
  </section>
}

function PublicFooter() {
  return <footer className="public-footer">
    <div className="public-container footer-inner"><Brand /><p>Registro y control de asistencia académica</p><Link to="/plataforma/login">Acceso de plataforma <ArrowRight size={15} /></Link></div>
  </footer>
}

export function Landing() {
  const [planId, setPlanId] = useState('')
  const { plans, loading, error, retry } = usePlans()

  return <>
    <PublicHeader />
    <main>
      <Hero />
      <section className="plan-section" id="planes" aria-labelledby="plans-title">
        <div className="public-container">
          <div className="section-heading">
            <h2 id="plans-title">Un plan para cada institución</h2>
            <p>Revisa el cómputo, la memoria y el almacenamiento antes de elegir un plan.</p>
          </div>
          {loading && <div className="public-notice" role="status">Cargando planes…</div>}
          {error && <div className="public-notice" role="alert"><p>{error}</p><button className="button button-outline" type="button" onClick={retry}><RefreshCw size={16} /> Reintentar</button></div>}
          {!loading && !error && (plans.length > 0
            ? <PlanCatalog plans={plans} onSelect={setPlanId} />
            : <div className="public-notice">No hay planes disponibles.</div>)}
        </div>
      </section>
      <HowItWorks />
      <RequestForm plans={plans} planId={planId} setPlanId={setPlanId} />
    </main>
    <PublicFooter />
  </>
}

const trackingInvitation = {
  pending: { title: 'Invitación en preparación', text: 'El equipo está preparando el acceso del administrador de tu institución.', Icon: Clock3 },
  sent: { title: 'Invitación enviada', text: 'Revisa el correo que registraste para activar tu cuenta de administrador.', Icon: Mail },
  failed: { title: 'Invitación pendiente de reenvío', text: 'El equipo debe volver a enviar la invitación al administrador de tu institución.', Icon: Clock3 },
  activated: { title: 'Acceso activado', text: 'Ya puedes iniciar sesión en la aplicación de asistencia con la cuenta que activaste.', Icon: CheckCircle2 },
  preview: { title: 'Activación pendiente', text: 'El equipo aún debe entregar el acceso al administrador de tu institución.', Icon: Clock3 },
} satisfies Record<InvitationStatus, { title: string; text: string; Icon: typeof Mail }>

export function Tracking() {
  const { token = '' } = useParams()
  const [request, setRequest] = useState<TrackedRequest>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    api<{ request: TrackedRequest }>(`/api/requests/track/${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(({ request }) => setRequest(request))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 404) setRequest(undefined)
        setError(errorMessage(error, 'No se pudo consultar la solicitud.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [token, attempt])

  function refresh() {
    setError('')
    setLoading(true)
    setAttempt((current) => current + 1)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyMessage('Enlace copiado.')
    } catch {
      setCopyMessage('Copia el enlace desde la barra de direcciones.')
    }
  }

  const registered = request?.status === 'registered'
  const installationUrl = registered ? attendanceLoginLink(request.tenant?.appUrl) : undefined
  const invitationStatus = request?.tenant?.invitationStatus
  const invitationUpdatedAt = request?.tenant?.invitationUpdatedAt
  const invitation = installationUrl && invitationStatus ? trackingInvitation[invitationStatus] : undefined

  return <>
    <PublicHeader />
    <main className="tracking-page">
      <div className="tracking-container">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Volver al inicio</Link>
        <section className="tracking-card" aria-labelledby="tracking-title">
          <div className="tracking-header">
            <span className="tracking-icon"><ClipboardList size={24} /></span>
            <div><h1 id="tracking-title">Seguimiento de solicitud</h1>{request && <p>{request.institutionName}</p>}</div>
          </div>
          {loading && <p className="tracking-feedback" role="status">Consultando solicitud…</p>}
          {error && <p className="public-error" role="alert">{error}</p>}
          {request && <>
            <div className="tracking-messages" aria-label="Novedades de tu solicitud">
              <article className="tracking-message">
                <span className="message-icon"><CheckCircle2 size={19} /></span>
                <div><h2>Recibimos tu solicitud</h2><p>Tu institución ya está en la lista de solicitudes del equipo.</p><time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time></div>
              </article>
              <article className="tracking-message">
                <span className={`message-icon${registered ? '' : ' message-pending'}`}>{registered ? <CheckCircle2 size={19} /> : <Clock3 size={19} />}</span>
                <div>
                  <h2>{registered ? 'Institución registrada' : 'En revisión'}</h2>
                  <p>{registered ? installationUrl ? 'La aplicación de asistencia de tu institución está vinculada.' : 'El equipo guardó la configuración de tu espacio. Falta vincular la aplicación de asistencia.' : 'El equipo revisará tus datos y el plan que elegiste.'}</p>
                  {registered && <time dateTime={request.updatedAt}>{formatDate(request.updatedAt)}</time>}
                </div>
              </article>
              {invitation && <article className="tracking-message">
                <span className={`message-icon${invitationStatus === 'activated' || invitationStatus === 'sent' ? '' : ' message-pending'}`}><invitation.Icon size={19} /></span>
                <div><h2>{invitation.title}</h2><p>{invitation.text}</p>
                  {invitationUpdatedAt && <time dateTime={invitationUpdatedAt}>{formatDate(invitationUpdatedAt)}</time>}
                </div>
              </article>}
            </div>
            <p className="tracking-private"><LockKeyhole size={16} /> Guarda este enlace privado para volver a consultar el estado.</p>
          </>}
          <div className="tracking-actions">
            {installationUrl && <a className="button button-primary" href={installationUrl} target="_blank" rel="noreferrer">Abrir aplicación de asistencia <ExternalLink size={16} /></a>}
            {request && <button className={`button ${installationUrl ? 'button-outline' : 'button-primary'}`} type="button" onClick={copyLink}><Copy size={16} /> Copiar enlace</button>}
            <button className="button button-outline" type="button" disabled={loading} onClick={refresh}><RefreshCw size={16} /> Actualizar estado</button>
          </div>
          {copyMessage && <p className="tracking-feedback" role="status">{copyMessage}</p>}
        </section>
      </div>
    </main>
    <PublicFooter />
  </>
}
