import { useState } from 'react'
import { formatTime, formatDate } from '../api.js'

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 },
  sheet: { background: 'var(--surface)', borderRadius: '16px 16px 0 0', width: '100%', padding: '0 0 36px', maxHeight: '92vh', overflowY: 'auto' },
  handle: { width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '12px auto 0' },
  title: { padding: '20px 20px 4px', fontSize: 18, fontWeight: 500 },
  sub: { padding: '0 20px 20px', fontSize: 13, color: 'var(--muted)' },
  summaryCard: { margin: '0 20px 20px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '14px 16px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel: { fontSize: 12, color: 'var(--muted)' },
  sumVal: { fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' },
  section: { padding: '0 20px 18px' },
  fieldLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 8, letterSpacing: 0.4 },
  btnRow: { display: 'flex', gap: 8 },
  optBtn: {
    flex: 1, background: 'var(--surface2)', border: '0.5px solid var(--border2)',
    borderRadius: 10, padding: '11px 6px', color: 'var(--muted2)',
    fontSize: 13, cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
    transition: 'all 0.12s',
  },
  optBtnActive: {
    background: 'var(--amber-dim)', border: '0.5px solid var(--amber)',
    color: 'var(--amber)',
  },
  optIcon: { fontSize: 18, display: 'block', marginBottom: 4 },
  textarea: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'var(--sans)', resize: 'none', minHeight: 80, outline: 'none' },
  actionRow: { display: 'flex', gap: 8, padding: '4px 20px 0' },
  cancelBtn: { flex: 1, background: 'transparent', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 13, color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  saveBtn: { flex: 2, background: 'var(--amber)', border: 'none', borderRadius: 10, padding: 13, color: '#080808', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  divider: { height: '0.5px', background: 'var(--border)', margin: '0 20px 18px' },
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div style={s.section}>
      <div style={s.fieldLabel}>{label}</div>
      <div style={s.btnRow}>
        {options.map(opt => (
          <button
            key={opt.value}
            style={{ ...s.optBtn, ...(value === opt.value ? s.optBtnActive : {}) }}
            onClick={() => onChange(value === opt.value ? null : opt.value)}
          >
            <span style={s.optIcon}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function LogModal({ trip, onSave, onCancel }) {
  const [klasse, setKlasse] = useState(null)
  const [sitztyp, setSitztyp] = useState(null)
  const [position, setPosition] = useState(null)
  const [note, setNote] = useState('')

  if (!trip) return null

  function handleSave() {
    onSave({ ...trip, klasse, sitztyp, position, note })
  }

  const depDate = trip.depPlanned ? formatDate(trip.depPlanned) : '–'
  const depTime = trip.depPlanned ? formatTime(trip.depPlanned) : '–'
  const arrTime = trip.arrPlanned ? formatTime(trip.arrPlanned) : '–'

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={s.sheet}>
        <div style={s.handle} />
        <div style={s.title}>Fahrt loggen</div>
        <div style={s.sub}>Diese Verbindung zu deinem Tagebuch hinzufügen</div>

        <div style={s.summaryCard}>
          <div style={s.sumRow}><span style={s.sumLabel}>Strecke</span><span style={s.sumVal}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</span></div>
          <div style={s.sumRow}><span style={s.sumLabel}>Zug</span><span style={s.sumVal}>{trip.trainName}</span></div>
          {trip.distanceKm > 0 && <div style={s.sumRow}><span style={s.sumLabel}>Strecke</span><span style={s.sumVal}>{trip.distanceKm} km</span></div>}
          <div style={s.sumRow}><span style={s.sumLabel}>Datum</span><span style={s.sumVal}>{depDate}</span></div>
          <div style={{ ...s.sumRow, marginBottom: 0 }}><span style={s.sumLabel}>Zeit</span><span style={s.sumVal}>{depTime} → {arrTime}</span></div>
        </div>

        <div style={s.divider} />

        <OptionGroup
          label="KLASSE"
          value={klasse}
          onChange={setKlasse}
          options={[
            { value: '1', icon: '★', label: '1. Klasse' },
            { value: '2', icon: '☆', label: '2. Klasse' },
          ]}
        />

        <OptionGroup
          label="SITZTYP"
          value={sitztyp}
          onChange={setSitztyp}
          options={[
            { value: 'einzelplatz', icon: '🪑', label: 'Einzelplatz' },
            { value: 'gruppentisch', icon: '⊞', label: 'Gruppentisch' },
            { value: 'abteil', icon: '▦', label: 'Abteil' },
          ]}
        />

        <OptionGroup
          label="PLATZ"
          value={position}
          onChange={setPosition}
          options={[
            { value: 'fenster', icon: '🪟', label: 'Fenster' },
            { value: 'gang', icon: '↔', label: 'Gang' },
          ]}
        />

        <div style={s.divider} />

        <div style={s.section}>
          <div style={s.fieldLabel}>NOTIZ</div>
          <textarea
            style={s.textarea}
            placeholder="Wie war die Fahrt?"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <div style={s.actionRow}>
          <button style={s.cancelBtn} onClick={onCancel}>Abbrechen</button>
          <button style={s.saveBtn} onClick={handleSave}>Speichern</button>
        </div>
      </div>
    </div>
  )
}
