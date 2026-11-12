import { useState, type FormEvent } from 'react'
import { Building2, Info, RotateCcw, Save, SlidersHorizontal } from 'lucide-react'
import './platform-settings.css'

type Preferences = {
  name: string
  contact: string
  timeZone: string
  region: string
}

const storageKey = 'asistencia.platform.demo-preferences'
const defaults: Preferences = {
  name: 'Asistencia',
  contact: '',
  timeZone: 'America/La_Paz',
  region: 'us-east-1',
}

const timeZones = [
  { value: 'America/La_Paz', label: 'Bolivia' },
  { value: 'America/Lima', label: 'Perú' },
  { value: 'America/Mexico_City', label: 'Ciudad de México' },
  { value: 'UTC', label: 'UTC' },
]

const regions = [
  { value: 'us-east-1', label: 'Virginia del Norte · AWS' },
  { value: 'us-west-2', label: 'Oregón · AWS' },
  { value: 'eastus', label: 'Este de EE. UU. · Azure' },
]

function readPreferences(): Preferences {
  try {
    const stored: Partial<Preferences> | null = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    return {
      name: typeof stored?.name === 'string' ? stored.name.trim().slice(0, 80) || defaults.name : defaults.name,
      contact: typeof stored?.contact === 'string' ? stored.contact.trim().slice(0, 120) : defaults.contact,
      timeZone: timeZones.find(zone => zone.value === stored?.timeZone)?.value ?? defaults.timeZone,
      region: regions.find(region => region.value === stored?.region)?.value ?? defaults.region,
    }
  } catch {
    return defaults
  }
}

export default function PlatformSettings() {
  const [preferences, setPreferences] = useState(readPreferences)
  const [notice, setNotice] = useState('')

  function edit(field: keyof Preferences, value: string) {
    setPreferences(previous => ({ ...previous, [field]: value }))
    setNotice('')
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = {
      ...preferences,
      name: preferences.name.trim() || defaults.name,
      contact: preferences.contact.trim(),
    }
    setPreferences(normalized)
    try {
      localStorage.setItem(storageKey, JSON.stringify(normalized))
      setNotice('Preferencias guardadas en este navegador.')
    } catch {
      setNotice('Preferencias aplicadas para esta visita.')
    }
  }

  function reset() {
    setPreferences(defaults)
    try {
      localStorage.removeItem(storageKey)
      setNotice('Preferencias restablecidas.')
    } catch {
      setNotice('Valores iniciales aplicados para esta visita.')
    }
  }

  const timeZoneLabel = timeZones.find(zone => zone.value === preferences.timeZone)?.label
  const regionLabel = regions.find(region => region.value === preferences.region)?.label

  return <div className="psd-settings">
    <div className="psd-note">
      <Info size={17} aria-hidden="true" />
      <p>Estas preferencias se guardan en este navegador y se aplican a la vista de ejemplo de esta sección.</p>
    </div>
    <div className="psd-layout">
      <section className="psd-card" aria-labelledby="psd-preferences-title">
        <div className="psd-card-header">
          <span className="psd-icon"><SlidersHorizontal size={19} aria-hidden="true" /></span>
          <h2 id="psd-preferences-title">Preferencias del panel</h2>
        </div>
        <form onSubmit={save}>
          <div className="psd-fields">
            <div className="psd-field">
              <label htmlFor="psd-name">Nombre visible</label>
              <input id="psd-name" value={preferences.name} maxLength={80} required onChange={event => edit('name', event.target.value)} />
            </div>
            <div className="psd-field">
              <label htmlFor="psd-contact">Correo de contacto <span>(opcional)</span></label>
              <input id="psd-contact" type="email" value={preferences.contact} maxLength={120} placeholder="soporte@ejemplo.com" onChange={event => edit('contact', event.target.value)} />
            </div>
            <div className="psd-field">
              <label htmlFor="psd-time-zone">Zona horaria</label>
              <select id="psd-time-zone" value={preferences.timeZone} onChange={event => edit('timeZone', event.target.value)}>
                {timeZones.map(zone => <option key={zone.value} value={zone.value}>{zone.label}</option>)}
              </select>
            </div>
            <div className="psd-field">
              <label htmlFor="psd-region">Región de referencia</label>
              <select id="psd-region" value={preferences.region} onChange={event => edit('region', event.target.value)}>
                {regions.map(region => <option key={region.value} value={region.value}>{region.label}</option>)}
              </select>
            </div>
          </div>
          <div className="psd-actions">
            <button type="submit" className="psd-save"><Save size={16} aria-hidden="true" />Guardar preferencias</button>
            <button type="button" className="psd-reset" onClick={reset}><RotateCcw size={16} aria-hidden="true" />Restablecer</button>
          </div>
          <p className="psd-status" role="status">{notice}</p>
        </form>
      </section>
      <section className="psd-card psd-preview" aria-labelledby="psd-preview-title">
        <div className="psd-card-header">
          <span className="psd-icon"><Building2 size={19} aria-hidden="true" /></span>
          <h2 id="psd-preview-title">Vista previa</h2>
        </div>
        <strong className="psd-preview-name">{preferences.name.trim() || defaults.name}</strong>
        <dl>
          <div><dt>Contacto</dt><dd>{preferences.contact.trim() || 'Sin correo configurado'}</dd></div>
          <div><dt>Zona horaria</dt><dd>{timeZoneLabel}</dd></div>
          <div><dt>Región</dt><dd>{regionLabel}</dd></div>
        </dl>
      </section>
    </div>
  </div>
}
