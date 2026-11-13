import { Link, Outlet } from 'react-router'
import { PublicHeader } from './PublicSite'
import './styles.css'

export function PlatformLayout() {
  return <div className="platform-shell"><Outlet /></div>
}

export function PlatformNotFound() {
  return <>
    <PublicHeader />
    <main className="tracking-page">
      <div className="tracking-card">
        <h1>Página no encontrada</h1>
        <Link className="button button-primary" to="/">Volver al inicio</Link>
      </div>
    </main>
  </>
}
