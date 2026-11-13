import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './base.css'
import PlatformAdmin from './platform/PlatformAdmin'
import { PlatformLayout, PlatformNotFound } from './platform/PlatformLayout'
import { Landing, Tracking } from './platform/PublicSite'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<PlatformLayout />}>
          <Route index element={<Landing />} />
          <Route path="seguimiento/:token" element={<Tracking />} />
          <Route path="plataforma/*" element={<PlatformAdmin />} />
          <Route path="*" element={<PlatformNotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
