import { useState } from 'react'
import { formatTime, formatDate } from '../api.js'

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 200 },
  sheet: { background: 'var(--surface)', borderRadius: '16px 16px 0 0', width: '100%', padding: '0 0 32px', maxHeight: '90vh', overflowY: 'auto' },
  handle: { width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '12px auto 0' },
  title: { padding: '20px 20px 4px', fontSize: 18, fontWeight: 500 },
  sub: { padding: '0 20px 20px', fontSize: 13, color: 'var(--muted)' },
  section: { padding: '0 20px 16px' },
  fieldLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  field: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text)', width: '100%' },
  textarea: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: 'var(--text)', width: '100%', fontFamily: 'var(--sans)', resize: 'vertical', minHeight: 72 },
  divider: { height: '0.5px', background: 'var(--border)', margin: '4px 0 16px' },
  row: { display: 'flex', gap: 8, padding: '0 20px 16px' },
  cancelBtn: { flex: 1, background: 'transparent', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 13, color: 'var(--text)', fontSize: 14 },
  saveBtn: { flex: 2, background: 'var(--amber)', border: 'none', borderRadius: 10, padding: 13, color: '#0c0c0c', fontSize: 14, fontWeight: 500 },
  summaryCard: { margin: '0 20px 20px', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '14px 16px' },
  sumRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  sumLabel: { fontSize: 12, color: 'var(--muted)' },
  sumVal: { fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' },
  ratingRow: { display: 'flex', gap: 8 },
  ratingBtn: { flex: 1, background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '8px 0', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', textAlign: 'center' },
  ratingBtnActive: { border: '0.5px solid var(--amber)', color: 'var(--amber)', background: 'var(--amber-dim)' },
}

const RATINGS = ['😴', '😕', '😐', '🙂', '😄']

export default function LogModal({ trip, onSave, onCancel }) {
  const [note, setNote] = useState('')
  const [km, setKm] = useState(trip?.distanceKm > 0 ? String(trip.distanceKm) : '')
  const [rating, setRating] = useState(null)
  const [seatNo, setSeatNo] = useState('')

  if (!trip) return null

  function handleSave() {
    onSave({
      ...trip,
      note,
      distanceKm: km ? parseFloat(km) : 0,
      rating,
      seatNo,
    })
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
          <div style={s.sumRow}><span style={s.sumLabel}>Strecke</span><span style={s.sumVal}>{trip.from?.split('(')[0]} → {trip.to?.split('(')[0]}</span></div>
          <div style={s.sumRow}><span style={s.sumLabel}>Zug</span><span style={s.sumVal}>{trip.trainName}</span></div>
          <div style={s.sumRow}><span style={s.sumLabel}>Datum</span><span style={s.sumVal}>{depDate}</span></div>
          <div style={{ ...s.sumRow, marginBottom: 0 }}><span style={s.sumLabel}>Zeit</span><span style={s.sumVal}>{depTime} → {arrTime}</span></div>
        </div>

        <div style={s.section}>
          <div style={s.fieldLabel}>BEWERTUNG</div>
          <div style={s.ratingRow}>
            {RATINGS.map((r, i) => (
              <button
                key={i}
                style={{ ...s.ratingBtn, ...(rating === i ? s.ratingBtnActive : {}) }}
                onClick={() => setRating(i)}
              >{r}</button>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={{ ...s.fieldLabel, display: 'flex', alignItems: 'center', gap: 8 }}>
            STRECKE (KM)
            {trip?.distanceKm > 0 && (
              <span style={{ fontSize: 10, background: 'var(--green-dim)', color: 'var(--green)', padding: '2px 7px', borderRadius: 10, fontFamily: 'var(--mono)' }}>
                auto ✓
              </span>
            )}
          </div>
          <input style={s.field} type="number" placeholder="z.B. 492" value={km} onChange={e => setKm(e.target.value)} />
        </div>

        <div style={s.section}>
          <div style={s.fieldLabel}>SITZPLATZ</div>
          <input style={s.field} placeholder="z.B. Wagen 5, Platz 42" value={seatNo} onChange={e => setSeatNo(e.target.value)} />
        </div>

        <div style={s.section}>
          <div style={s.fieldLabel}>NOTIZ</div>
          <textarea style={s.textarea} placeholder="Wie war die Fahrt? Besondere Momente?" value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div style={s.row}>
          <button style={s.cancelBtn} onClick={onCancel}>Abbrechen</button>
          <button style={s.saveBtn} onClick={handleSave}>Im Tagebuch speichern</button>
        </div>
      </div>
    </div>
  )
}
