import { useState } from 'react'
import { formatTime, formatDate } from '../api.js'
import TripDetailModal from './TripDetailModal.jsx'

const s = {
  wrap: { padding: '0 0 40px' },
  header: { padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14 },

  monthHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 10px', cursor: 'pointer', minHeight: 48 },
  monthTitle: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  monthMeta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 8 },
  chevron: { transition: 'transform 0.2s', display: 'inline-block', fontSize: 10 },

  card: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' },
  cardTop: { padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  trainBadge: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--amber-dim)', color: 'var(--amber)', padding: '3px 8px', borderRadius: 5 },
  dateText: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  cardBody: { padding: '12px 16px' },
  route: { fontSize: 16, fontWeight: 500, marginBottom: 4 },
  times: { fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  cardFooter: { padding: '10px 16px', borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaChip: { fontSize: 11, color: 'var(--text2)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 5, fontFamily: 'var(--mono)' },
  note: { fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  delBtn: { background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, padding: '8px 12px', borderRadius: 8, marginLeft: 'auto', minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  delayBadge: { fontSize: 11, fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: 5 },
  delayOk: { background: 'var(--green-dim)', color: 'var(--green)' },
  delayBad: { background: 'var(--red-dim)', color: 'var(--red)' },
}

const MONTHS = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()).padStart(2,'0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m]} ${y}`
}

export default function LogbookView({ trips, onDelete }) {
  const [collapsed, setCollapsed] = useState({})
  const [detailTrip, setDetailTrip] = useState(null)

  if (trips.length === 0) {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Tagebuch</span></div>
        </div>
        <div style={s.empty}>
          <div style={s.emptyIcon}>🚆</div>
          <div style={s.emptyText}>Noch keine Fahrten geloggt.</div>
          <div style={{ ...s.emptyText, marginTop: 6, fontSize: 12 }}>Suche eine Verbindung und klicke „Fahrt loggen".</div>
        </div>
      </div>
    )
  }

  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const grouped = {}
  trips.forEach(t => {
    const d = t.depPlanned ? new Date(t.depPlanned) : new Date(0)
    const key = monthKey(d)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  const keys = Object.keys(grouped).sort().reverse()

  function isOldMonth(key) {
    const [y, m] = key.split('-').map(Number)
    const monthDate = new Date(y, m, 1)
    return monthDate < threeMonthsAgo
  }

  function isOpen(key) {
    if (collapsed[key] !== undefined) return !collapsed[key]
    return !isOldMonth(key)
  }

  function toggle(key) {
    setCollapsed(c => ({ ...c, [key]: !( c[key] !== undefined ? c[key] : isOldMonth(key) ) }))
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Tagebuch</span></div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{trips.length} Fahrten</span>
      </div>

      {keys.map(key => {
        const monthTrips = grouped[key]
        const open = isOpen(key)
        const isOld = isOldMonth(key)
        return (
          <div key={key}>
            <div style={s.monthHeader} onClick={() => toggle(key)}>
              <div style={s.monthTitle}>{monthLabel(key)}</div>
              <div style={s.monthMeta}>
                <span>{monthTrips.length} {monthTrips.length === 1 ? 'Fahrt' : 'Fahrten'}</span>
                {isOld && <span style={{ ...s.chevron, transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>}
              </div>
            </div>
            {open && monthTrips.map(trip => (
              <div key={trip.id} style={s.card} onClick={() => setDetailTrip(trip)}>
                <div style={s.cardTop}>
                  <span style={s.trainBadge}>{trip.trainName || trip.trainType}</span>
                  <span style={s.dateText}>{trip.depPlanned ? formatDate(trip.depPlanned) : '–'}</span>
                </div>
                <div style={s.cardBody}>
                  <div style={s.route}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                  <div style={s.times}>
                    {formatTime(trip.depPlanned)} → {formatTime(trip.arrPlanned)}
                    {trip.durationMin ? ` · ${Math.floor(trip.durationMin / 60)}h ${trip.durationMin % 60}m` : ''}
                  </div>
                </div>
                <div style={s.cardFooter} onClick={e => e.stopPropagation()}>
                  {trip.distanceKm > 0 && <span style={s.metaChip}>{trip.distanceKm} km</span>}
                  {trip.changes !== undefined && <span style={s.metaChip}>{trip.changes === 0 ? 'Direkt' : `${trip.changes}× Umstieg`}</span>}
                  {trip.delayArrMin !== undefined && (
                    <span style={trip.delayArrMin <= 5 ? { ...s.delayBadge, ...s.delayOk } : { ...s.delayBadge, ...s.delayBad }}>
                      {trip.delayArrMin <= 5 ? 'Pünktlich' : `+${trip.delayArrMin} Min`}
                    </span>
                  )}
                  {trip.klasse && <span style={s.metaChip}>{trip.klasse === '1' ? '1. Kl.' : '2. Kl.'}</span>}
                  {trip.note && <span style={s.note}>„{trip.note}"</span>}
                  <button style={s.delBtn} onClick={e => { e.stopPropagation(); onDelete(trip.id) }} title="Löschen">×</button>
                </div>
              </div>
            ))}
          </div>
        )
      })}

      {detailTrip && <TripDetailModal trip={detailTrip} onClose={() => setDetailTrip(null)} />}
    </div>
  )
}
