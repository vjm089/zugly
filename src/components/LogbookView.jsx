import { formatTime, formatDate } from '../api.js'
import { deleteTrip } from '../store.js'

const s = {
  wrap: { padding: '0 0 40px' },
  header: { padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14 },
  sectionTitle: { padding: '24px 20px 10px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  cardTop: { padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  trainBadge: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--amber-dim)', color: 'var(--amber)', padding: '3px 8px', borderRadius: 5 },
  dateText: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  cardBody: { padding: '12px 16px' },
  route: { fontSize: 16, fontWeight: 500, marginBottom: 4 },
  times: { fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  cardFooter: { padding: '10px 16px', borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaChip: { fontSize: 11, color: 'var(--muted2)', background: 'var(--surface2)', padding: '3px 8px', borderRadius: 5, fontFamily: 'var(--mono)' },
  note: { fontSize: 12, color: 'var(--muted2)', fontStyle: 'italic', flex: 1 },
  delBtn: { background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 16, padding: '2px 6px', borderRadius: 5, marginLeft: 'auto', cursor: 'pointer' },
  delayBadge: { fontSize: 11, fontFamily: 'var(--mono)', padding: '3px 8px', borderRadius: 5 },
  delayOk: { background: 'var(--green-dim)', color: 'var(--green)' },
  delayBad: { background: 'var(--red-dim)', color: 'var(--red)' },
  rating: { fontSize: 16 },
}

export default function LogbookView({ trips, onDelete }) {
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

  const grouped = {}
  trips.forEach(t => {
    const date = t.depPlanned ? new Date(t.depPlanned).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) : 'Unbekannt'
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(t)
  })

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Tagebuch</span></div>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{trips.length} Fahrten</span>
      </div>

      {Object.entries(grouped).map(([month, monthTrips]) => (
        <div key={month}>
          <div style={s.sectionTitle}>{month}</div>
          {monthTrips.map(trip => (
            <div key={trip.id} style={s.card}>
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
              <div style={s.cardFooter}>
                {trip.distanceKm > 0 && <span style={s.metaChip}>{trip.distanceKm} km</span>}
                {trip.changes !== undefined && <span style={s.metaChip}>{trip.changes === 0 ? 'Direkt' : `${trip.changes}× Umstieg`}</span>}
                {trip.delayArrMin !== undefined && (
                  <span style={trip.delayArrMin <= 5 ? { ...s.delayBadge, ...s.delayOk } : { ...s.delayBadge, ...s.delayBad }}>
                    {trip.delayArrMin <= 5 ? 'Pünktlich' : `+${trip.delayArrMin} Min`}
                  </span>
                )}
                {trip.klasse && <span style={s.metaChip}>{trip.klasse === '1' ? '1. Kl.' : '2. Kl.'}</span>}
                {trip.sitztyp && <span style={s.metaChip}>{{ einzelplatz: 'Einzelplatz', gruppentisch: 'Gruppentisch', abteil: 'Abteil' }[trip.sitztyp]}</span>}
                {trip.position && <span style={s.metaChip}>{{ fenster: 'Fenster', gang: 'Gang' }[trip.position]}</span>}
                {trip.note && <span style={s.note}>„{trip.note}"</span>}
                <button style={s.delBtn} onClick={() => onDelete(trip.id)} title="Löschen">×</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
