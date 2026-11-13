import { ArrowRight, CalendarCheck2, CircleCheck, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getErrorMessage } from '../../../core/http/api-error'
import { http } from '../../../core/http/http-client'
import { Field, Input } from '../../../shared/ui/Field'
import { Spinner } from '../../../shared/ui/Spinner'

const loginPath = '/login?acceso=administrador'
const buttonClass = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 font-bold text-white transition hover:bg-brand-ink disabled:opacity-60 dark:hover:bg-brand/90'

export function ActivateAccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? ''
  const validLink = /^[A-Za-z0-9_-]{43}$/.test(token)
  const activated = location.state?.activated === true
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !validLink) return
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password') ?? '')
    if (password !== data.get('confirmPassword')) {
      setError('Las contraseñas deben coincidir.')
      return
    }

    setError('')
    setBusy(true)
    try {
      await http.post('/auth/invitations/activate', { token, password })
      navigate('/activar', { replace: true, state: { activated: true } })
    } catch (cause) {
      setError(getErrorMessage(cause, 'No se pudo activar tu cuenta. Vuelve a intentarlo.'))
    } finally {
      setBusy(false)
    }
  }

  return <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas p-5 sm:p-10">
    <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-deco-violet/20 blur-3xl" />
    <section className="relative w-full max-w-lg rounded-[26px] border border-line bg-surface p-6 shadow-[0_24px_70px_-28px_rgba(80,70,229,0.3)] sm:p-10" aria-labelledby="activate-title">
      <div className="mb-7 flex items-center gap-2.5 font-extrabold">
        <span className="grid size-10 place-items-center rounded-xl bg-brand text-white"><CalendarCheck2 size={21} /></span>
        Asistencia
      </div>
      <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink">
        {activated ? <CircleCheck size={23} /> : <KeyRound size={23} />}
      </span>
      <h1 id="activate-title" className="text-3xl font-extrabold tracking-tight">
        {activated ? 'Cuenta activada' : 'Activa tu cuenta'}
      </h1>
      {activated ? <>
        <p className="mt-3 mb-6 text-sm leading-relaxed text-muted">Ya puedes iniciar sesión como administrador con tu correo y la contraseña que acabas de crear.</p>
        <Link className={buttonClass} to={loginPath}>Ir al inicio de sesión <ArrowRight size={18} /></Link>
      </> : validLink ? <>
        <p className="mt-3 text-sm leading-relaxed text-muted">Elige una contraseña de al menos 8 caracteres con letras y números para administrar la asistencia de tu institución.</p>
        <form className="mt-6 space-y-4" onSubmit={activate}>
          <Field label="Nueva contraseña" htmlFor="activation-password">
            <Input id="activation-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </Field>
          <Field label="Confirma la contraseña" htmlFor="activation-confirm">
            <Input id="activation-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
          </Field>
          {error && <p className="rounded-xl bg-alert-soft p-3 text-sm font-semibold text-alert-ink" role="alert">{error}</p>}
          <button type="submit" className={buttonClass} disabled={busy}>
            {busy ? <><Spinner /> Activando…</> : <>Activar cuenta <ArrowRight size={18} /></>}
          </button>
        </form>
      </> : <>
        <p className="mt-3 mb-6 text-sm leading-relaxed text-muted">Abre la invitación que recibiste o pide al equipo de la plataforma que te envíe un enlace nuevo.</p>
        <Link className={buttonClass} to={loginPath}>Ir al inicio de sesión <ArrowRight size={18} /></Link>
      </>}
    </section>
  </main>
}
