import { CalendarCheck2, LogOut, Presentation } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/application/auth-context'
import { Avatar } from '../../features/profile/presentation/Avatar'
import { AppBackground } from '../../shared/ui/AppBackground'
import { Button } from '../../shared/ui/Button'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'

export function AdminLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <AppBackground />
      <aside className="relative flex flex-col gap-4 border-b border-line bg-surface/90 px-4 py-4 sm:px-6 lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0 lg:py-7">
        <Link to="/admin/docentes" className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <CalendarCheck2 className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-extrabold">Asistencia</span>
            <span className="block text-xs text-muted">Administración institucional</span>
          </span>
        </Link>
        <nav aria-label="Administración institucional" className="lg:mt-5">
          <NavLink to="/admin/docentes" end className="flex items-center gap-3 rounded-xl bg-brand-soft px-4 py-3 font-semibold text-brand-ink">
            <Presentation className="size-5 shrink-0" aria-hidden="true" /> Docentes
          </NavLink>
        </nav>
        <div className="mt-auto flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
          <Avatar name={user?.name ?? ''} photoUrl={null} className="size-9 shrink-0 text-xs" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <Button variant="ghost" size="sm" icon={<LogOut className="size-4" />} onClick={() => void logout()} aria-label="Cerrar sesión" title="Cerrar sesión" />
        </div>
      </aside>
      <div className="relative min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-line/70 bg-canvas/80 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-10">
          <p className="text-sm font-semibold text-muted">Panel de la institución</p>
          <ThemeToggle />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8"><Outlet /></main>
      </div>
    </div>
  )
}
