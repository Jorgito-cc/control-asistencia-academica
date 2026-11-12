import { CalendarCheck2, Library, LogOut, SquarePlus } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../../features/auth/application/auth-context'
import { cn } from '../../shared/lib/cn'
import { AppBackground } from '../../shared/ui/AppBackground'
import { Button } from '../../shared/ui/Button'
import { ThemeToggle } from '../../shared/ui/ThemeToggle'

export function TeacherLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="relative min-h-dvh">
      <AppBackground />
      <header className="relative border-b border-line bg-surface/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/docente" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white"><CalendarCheck2 className="size-5" /></span>
            <span className="min-w-0">
              <span className="block font-extrabold">Asistencia</span>
              <span className="block text-xs text-muted">Panel docente</span>
            </span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm font-semibold sm:block">{user?.name}</span>
            <ThemeToggle />
            <Button variant="ghost" onClick={() => void logout()} aria-label="Cerrar sesión" title="Cerrar sesión" icon={<LogOut className="size-5" />}>
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
          <nav aria-label="Panel docente" className="order-last flex w-full flex-wrap gap-1.5 sm:order-0 sm:ml-3 sm:w-auto">
            <TeacherNavLink to="/docente" end><Library className="size-4" /> Mis módulos</TeacherNavLink>
            <TeacherNavLink to="/docente/nuevo-modulo"><SquarePlus className="size-4" /> Nuevo módulo</TeacherNavLink>
          </nav>
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8"><Outlet /></main>
    </div>
  )
}

function TeacherNavLink({ to, end, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  return <NavLink to={to} end={end} className={({ isActive }) => cn(
    'inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold',
    isActive ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-canvas hover:text-ink',
  )}>{children}</NavLink>
}
