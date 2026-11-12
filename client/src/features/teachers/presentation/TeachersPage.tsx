import { Presentation, UserRoundPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../../core/http/api-error'
import { Button } from '../../../shared/ui/Button'
import { Card } from '../../../shared/ui/Card'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { Field, Input } from '../../../shared/ui/Field'
import { Modal } from '../../../shared/ui/Modal'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { PageLoader } from '../../../shared/ui/Spinner'
import { useToast } from '../../../shared/ui/toast'
import { TeacherAvatar } from '../../profile/presentation/TeacherAvatar'
import { useCreateTeacher, useTeachers } from '../application/teachers.queries'

export function TeachersPage() {
  const teachers = useTeachers()
  const create = useCreateTeacher()
  const toast = useToast()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (create.isPending) return
    const form = new FormData(event.currentTarget)
    const fullName = String(form.get('fullName') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')
    if (fullName.length < 2) {
      setError('Escribe el nombre completo del docente.')
      return
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError('La contraseña no puede superar 72 bytes.')
      return
    }
    setError('')
    create.mutate({ fullName, email, password }, {
      onSuccess: (teacher) => {
        setCreating(false)
        toast.success(`Se creó la cuenta de ${teacher.fullName}.`)
      },
      onError: (cause) => {
        setError(getErrorMessage(cause, 'No se pudo crear la cuenta del docente.'))
      },
    })
  }

  return <>
    <PageHeader
      title="Docentes"
      description="Crea las cuentas de los docentes de tu institución."
      actions={<Button disabled={create.isPending} icon={<UserRoundPlus className="size-4" />} onClick={() => {
        setError('')
        setCreating(true)
      }}>Crear docente</Button>}
    />
    {teachers.isLoading ? <PageLoader /> : (
      <Card>
        {teachers.error ? <EmptyState
          icon={<Presentation className="size-6" />}
          title="No pudimos cargar los docentes"
          description={getErrorMessage(teachers.error)}
          action={<Button variant="secondary" onClick={() => void teachers.refetch()}>Reintentar</Button>}
        /> : !teachers.data?.length ? <EmptyState
          icon={<Presentation className="size-6" />}
          title="Todavía no hay docentes"
          description="Crea una cuenta para que un docente pueda gestionar sus módulos."
        /> : <ul className="divide-y divide-line" aria-label="Docentes de la institución">
          {teachers.data.map(teacher => <li className="flex min-w-0 items-center gap-3 px-4 py-3.5 sm:px-5" key={teacher.id}>
            <TeacherAvatar name={teacher.fullName} className="size-10 shrink-0 text-sm" />
            <div className="min-w-0">
              <p className="font-bold wrap-anywhere">{teacher.fullName}</p>
              <p className="text-sm text-muted wrap-anywhere">{teacher.email}</p>
            </div>
          </li>)}
        </ul>}
      </Card>
    )}
    <Modal
      open={creating}
      onClose={() => setCreating(false)}
      title="Crear docente"
      footer={<>
        <Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button>
        <Button type="submit" form="create-teacher" loading={create.isPending}>Guardar docente</Button>
      </>}
    >
      <form id="create-teacher" className="space-y-4" onSubmit={submit}>
        <Field label="Nombre completo" htmlFor="teacher-name">
          <Input id="teacher-name" name="fullName" autoFocus minLength={2} maxLength={150} required />
        </Field>
        <Field label="Correo electrónico" htmlFor="teacher-email">
          <Input id="teacher-email" name="email" type="email" autoComplete="off" maxLength={150} required />
        </Field>
        <Field label="Contraseña inicial" htmlFor="teacher-password" hint="Usa al menos 8 caracteres, con letras y números.">
          <Input id="teacher-password" name="password" type="password" autoComplete="new-password" minLength={8}
            maxLength={72} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}" required />
        </Field>
        {error && <p role="alert" className="rounded-xl bg-alert-soft px-3 py-2 text-sm text-alert-ink">{error}</p>}
      </form>
    </Modal>
  </>
}
