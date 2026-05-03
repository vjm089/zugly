import { formatTime, formatDate, trainModelInfo } from '../api.js'

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', zIndex: 200 },
  sheet: { background: 'var(--surface)', borderRadius: '16px 16px 0 0', width: '100%', padding: '0 0 36px', maxHeight: '92vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  handle: { width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '12px auto 16px' },
  closeBtn: { position: 'absolute', top: 8, right: 12, background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 26, padding: 8, lineHeight: 1, minHeight: 40, minWidth: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  hero: { padding: '0 20px 16px', borderBottom: '0.5px solid var(--border)' },
  trainBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '4px 10px', borderRadius: 20, marginBottom: 10 },
  routeText: { fontSize: 22, fontWeight: 500, letterSpacing: -0.5, lineHeight: 1.2 },
  dateText: { fontSize: 13, color: 'var(--text2)', marginTop: 6, fontFamily: 'var(--mono)' },

  imgBox: { margin: '12px 20px 0', height: 140, background: 'var(--surface2)', borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid var(--border2)' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  imgPlaceholder: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', textAlign: 'center', padding: 16, lineHeight: 1.6 },

  section: { padding: '8px 20px 0' },
  sectionTitle: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  statCard: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '12px 14px' },
  statLabel: { fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: 500, fontFamily: 'var(--mono)', letterSpacing: -0.5 },
  statSub: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  statValueGreen: { color: 'var(--green)' },
  statValueRed: { color: 'var(--red)' },

  rowCard: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowLabel: { fontSize: 13, color: 'var(--text2)' },
  rowValue: { fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text)' },

  noteCard: { margin: '12px 20px 0', background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '12px 14px' },
  noteText: { fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5 },
}

const SITZTYP = { einzelplatz: 'Einzelplatz', gruppentisch: 'Gruppentisch', abteil: 'Abteil' }
const POSITION = { fenster: 'Fenster', gang: 'Gang' }

export default function TripDetailModal({ trip, onClose }) {
  if (!trip) return null

  const model = trainModelInfo({ name: trip.trainName, product: (trip.trainType || '').toLowerCase() })
  const co2Saved = Math.round((trip.distanceKm || 0) * 0.138)
  const carCo2 = Math.round((trip.distanceKm || 0) * 0.170)
  const dur = trip.durationMin
  const durStr = dur ? `${Math.floor(dur / 60)}h ${dur % 60}m` : '–'
  const delay = trip.delayArrMin || 0

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.sheet}>
        <div style={s.handle} />
        <button style={s.closeBtn} onClick={onClose}>×</button>

        <div style={s.hero}>
          <div style={s.trainBadge}>{trip.trainName || '?'}</div>
          <div style={s.routeText}>
            {trip.from?.split('(')[0].trim()}<br />
            <span style={{ color: 'var(--muted)', fontSize: 18 }}>→</span><br />
            {trip.to?.split('(')[0].trim()}
          </div>
          <div style={s.dateText}>
            {trip.depPlanned ? formatDate(trip.depPlanned) : '–'} · {formatTime(trip.depPlanned)} – {formatTime(trip.arrPlanned)}
          </div>
        </div>

        {model.wikiImage ? (
          <div style={s.imgBox}>
            <img
              src={model.wikiImage}
              alt={model.longName}
              style={s.img}
              onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<div style="font-size:11px;color:var(--muted);font-family:var(--mono);text-align:center">Bild nicht verfügbar</div>` }}
            />
          </div>
        ) : (
          <div style={s.imgBox}>
            <div style={s.imgPlaceholder}>{model.longName}</div>
          </div>
        )}

        <div style={s.section}>
          <div style={s.sectionTitle}>Übersicht</div>
          <div style={s.grid}>
            <div style={s.statCard}>
              <div style={s.statLabel}>STRECKE</div>
              <div style={s.statValue}>{trip.distanceKm || '–'}<span style={{ fontSize: 12 }}> km</span></div>
              <div style={s.statSub}>Luftlinie zwischen Halten</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>FAHRZEIT</div>
              <div style={s.statValue}>{durStr}</div>
              <div style={s.statSub}>{trip.changes === 0 ? 'Direktverbindung' : `${trip.changes}× Umstieg`}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>VERSPÄTUNG</div>
              <div style={{ ...s.statValue, ...(delay <= 5 ? s.statValueGreen : s.statValueRed) }}>
                {delay <= 0 ? '0' : `+${delay}`}<span style={{ fontSize: 12 }}> min</span>
              </div>
              <div style={s.statSub}>{delay <= 5 ? 'Pünktlich' : 'Verspätet'}</div>
            </div>
            <div style={s.statCard}>
              <div style={s.statLabel}>CO₂ GESPART</div>
              <div style={{ ...s.statValue, ...s.statValueGreen }}>{co2Saved}<span style={{ fontSize: 12 }}> kg</span></div>
              <div style={s.statSub}>vs. {carCo2} kg im Auto</div>
            </div>
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionTitle}>Zugmodell</div>
          <div style={s.rowCard}>
            <span style={s.rowLabel}>Typ</span>
            <span style={s.rowValue}>{model.longName}</span>
          </div>
          <div style={s.rowCard}>
            <span style={s.rowLabel}>Modellnummer</span>
            <span style={s.rowValue}>{model.displayName}</span>
          </div>
          {trip.tripId && (
            <div style={s.rowCard}>
              <span style={s.rowLabel}>Trip-ID</span>
              <span style={{ ...s.rowValue, fontSize: 10, opacity: 0.6 }}>{String(trip.tripId).slice(0, 24)}…</span>
            </div>
          )}
        </div>

        {(trip.klasse || trip.sitztyp || trip.position) && (
          <div style={s.section}>
            <div style={s.sectionTitle}>Sitzplatz</div>
            {trip.klasse && (
              <div style={s.rowCard}>
                <span style={s.rowLabel}>Klasse</span>
                <span style={s.rowValue}>{trip.klasse === '1' ? '1. Klasse' : '2. Klasse'}</span>
              </div>
            )}
            {trip.sitztyp && (
              <div style={s.rowCard}>
                <span style={s.rowLabel}>Sitztyp</span>
                <span style={s.rowValue}>{SITZTYP[trip.sitztyp] || trip.sitztyp}</span>
              </div>
            )}
            {trip.position && (
              <div style={s.rowCard}>
                <span style={s.rowLabel}>Platz</span>
                <span style={s.rowValue}>{POSITION[trip.position] || trip.position}</span>
              </div>
            )}
          </div>
        )}

        {trip.note && (
          <>
            <div style={s.section}><div style={s.sectionTitle}>Notiz</div></div>
            <div style={s.noteCard}>
              <div style={s.noteText}>„{trip.note}"</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
