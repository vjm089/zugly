import { useState, useRef } from 'react'
import { computeStats, loadTrips, saveTrip, deleteTrip } from '../store.js'

const s = {
  wrap: { padding: '0 0 60px' },
  header: { padding: '20px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 20px' },
  metaCard: { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' },
  metaLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  metaValue: { fontSize: 28, fontWeight: 500, fontFamily: 'var(--mono)', letterSpacing: -1 },
  metaSub: { fontSize: 11, color: 'var(--muted)', marginTop: 4 },
  sectionTitle: { padding: '8px 20px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  barCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', width: 60, flexShrink: 0 },
  barTrack: { flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', background: 'var(--amber)', borderRadius: 2 },
  barCount: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', width: 24, textAlign: 'right' },
  achievementCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 },
  achIcon: { fontSize: 28, flexShrink: 0 },
  achTitle: { fontSize: 14, fontWeight: 500 },
  achSub: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 },

  dataCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  dataRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid var(--border)' },
  dataRowLast: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' },
  dataLabel: { fontSize: 14 },
  dataSub: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  dataBtn: { fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '7px 14px', color: 'var(--text)', cursor: 'pointer' },
  dataBtnDanger: { fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--red-dim)', border: '0.5px solid var(--red)', borderRadius: 8, padding: '7px 14px', color: 'var(--red)', cursor: 'pointer' },

  toast: { position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#080808', padding: '10px 22px', borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 300, whiteSpace: 'nowrap' },
  confirmOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '0 20px' },
  confirmBox: { background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 360 },
  confirmTitle: { fontSize: 17, fontWeight: 500, marginBottom: 8 },
  confirmText: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 },
  confirmBtns: { display: 'flex', gap: 10 },
  confirmCancel: { flex: 1, background: 'transparent', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '11px', color: 'var(--text)', fontSize: 14, cursor: 'pointer' },
  confirmDelete: { flex: 1, background: 'var(--red)', border: 'none', borderRadius: 10, padding: '11px', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
}

function getAchievements(stats) {
  const list = []
  if (stats.count >= 1) list.push({ icon: '🚆', title: 'Erste Fahrt', sub: 'Willkommen an Bord!' })
  if (stats.count >= 10) list.push({ icon: '🏅', title: '10 Fahrten', sub: 'Echter Bahnpendler' })
  if (stats.count >= 50) list.push({ icon: '🥇', title: '50 Fahrten', sub: 'Bahnexperte' })
  if (stats.totalKm >= 1000) list.push({ icon: '📍', title: '1.000 km', sub: 'Quer durch Deutschland' })
  if (stats.totalKm >= 10000) list.push({ icon: '🌍', title: '10.000 km', sub: 'Europareisender' })
  if (stats.delayed === 0 && stats.count > 0) list.push({ icon: '⏱️', title: 'Immer pünktlich', sub: 'Kein einziger Delay' })
  return list
}

export default function StatsView({ trips, onTripsChange }) {
  const stats = computeStats(trips)
  const achievements = getAchievements(stats)
  const maxByType = Math.max(...Object.values(stats.byType), 1)
  const totalHours = Math.floor(stats.totalMin / 60)
  const totalMins = stats.totalMin % 60
  const onTimeRate = stats.count > 0 ? Math.round((stats.onTime / stats.count) * 100) : 0
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleExport() {
    const data = { version: 1, exportedAt: new Date().toISOString(), trips }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zugly-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${trips.length} Fahrten exportiert`)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const importedTrips = data.trips || (Array.isArray(data) ? data : [])
        if (!importedTrips.length) { showToast('Keine Fahrten gefunden'); return }
        const existing = loadTrips()
        const existingIds = new Set(existing.map(t => t.id))
        const newTrips = importedTrips.filter(t => !existingIds.has(t.id))
        newTrips.forEach(t => saveTrip(t))
        onTripsChange?.()
        showToast(`${newTrips.length} neue Fahrten importiert`)
      } catch { showToast('Datei konnte nicht gelesen werden') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleDeleteAll() {
    trips.forEach(t => deleteTrip(t.id))
    onTripsChange?.()
    setConfirmDelete(false)
    showToast('Alle Fahrten gelöscht')
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Statistiken</span></div>
      </div>

      {trips.length > 0 && (
        <>
          <div style={s.grid}>
            <div style={s.metaCard}>
              <div style={s.metaLabel}>FAHRTEN</div>
              <div style={s.metaValue}>{stats.count}</div>
              <div style={s.metaSub}>gesamt</div>
            </div>
            <div style={s.metaCard}>
              <div style={s.metaLabel}>KILOMETER</div>
              <div style={s.metaValue}>{stats.totalKm.toLocaleString('de-DE')}</div>
              <div style={s.metaSub}>gefahren</div>
            </div>
            <div style={s.metaCard}>
              <div style={s.metaLabel}>FAHRZEIT</div>
              <div style={s.metaValue}>{totalHours}<span style={{ fontSize: 14 }}>h</span></div>
              <div style={s.metaSub}>{totalMins} Minuten</div>
            </div>
            <div style={s.metaCard}>
              <div style={s.metaLabel}>PÜNKTLICH</div>
              <div style={{ ...s.metaValue, color: onTimeRate >= 70 ? 'var(--green)' : 'var(--red)' }}>
                {onTimeRate}<span style={{ fontSize: 14 }}>%</span>
              </div>
              <div style={s.metaSub}>{stats.onTime} von {stats.count}</div>
            </div>
          </div>

          {Object.keys(stats.byType).length > 0 && (
            <>
              <div style={s.sectionTitle}>Zugtypen</div>
              <div style={s.barCard}>
                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} style={s.barRow}>
                    <span style={s.barLabel}>{type}</span>
                    <div style={s.barTrack}><div style={{ ...s.barFill, width: `${(count / maxByType) * 100}%` }} /></div>
                    <span style={s.barCount}>{count}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {achievements.length > 0 && (
            <>
              <div style={s.sectionTitle}>Errungenschaften</div>
              {achievements.map((a, i) => (
                <div key={i} style={s.achievementCard}>
                  <span style={s.achIcon}>{a.icon}</span>
                  <div><div style={s.achTitle}>{a.title}</div><div style={s.achSub}>{a.sub}</div></div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {trips.length === 0 && (
        <div style={s.empty}>Noch keine Fahrten für Statistiken vorhanden.</div>
      )}

      <div style={s.sectionTitle}>Meine Daten</div>
      <div style={s.dataCard}>
        <div style={s.dataRow}>
          <div>
            <div style={s.dataLabel}>Backup exportieren</div>
            <div style={s.dataSub}>Alle Fahrten als JSON-Datei speichern</div>
          </div>
          <button style={s.dataBtn} onClick={handleExport} disabled={trips.length === 0}>
            Export
          </button>
        </div>
        <div style={s.dataRow}>
          <div>
            <div style={s.dataLabel}>Backup importieren</div>
            <div style={s.dataSub}>Fahrten aus JSON-Datei laden</div>
          </div>
          <button style={s.dataBtn} onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        <div style={s.dataRowLast}>
          <div>
            <div style={s.dataLabel}>Alle Fahrten löschen</div>
            <div style={s.dataSub}>{trips.length} Fahrten werden entfernt</div>
          </div>
          <button style={s.dataBtnDanger} onClick={() => setConfirmDelete(true)} disabled={trips.length === 0}>
            Löschen
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div style={s.confirmOverlay} onClick={() => setConfirmDelete(false)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={s.confirmTitle}>Alle Fahrten löschen?</div>
            <div style={s.confirmText}>
              Diese Aktion löscht alle {trips.length} gespeicherten Fahrten unwiderruflich. Erstelle vorher ein Backup über „Export".
            </div>
            <div style={s.confirmBtns}>
              <button style={s.confirmCancel} onClick={() => setConfirmDelete(false)}>Abbrechen</button>
              <button style={s.confirmDelete} onClick={handleDeleteAll}>Alles löschen</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
