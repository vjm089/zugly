import { useState, useRef } from 'react'
import { computeStats, loadTrips, saveTrip, deleteTrip } from '../store.js'

const s = {
  wrap: { padding: '0 0 60px' },
  header: { padding: '20px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  sectionTitle: { padding: '4px 20px 10px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 16px' },
  grid1: { padding: '0 20px 16px' },
  metaCard: { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px' },
  metaLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 },
  metaValue: { fontSize: 26, fontWeight: 500, fontFamily: 'var(--mono)', letterSpacing: -1 },
  metaSub: { fontSize: 11, color: 'var(--muted)', marginTop: 3 },
  metaValueSm: { fontSize: 16, fontWeight: 500, marginTop: 4 },

  co2Card: { margin: '0 20px 8px', background: 'var(--green-dim)', border: '0.5px solid rgba(52,201,106,0.25)', borderRadius: 12, padding: '16px' },
  co2Top: { display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 },
  co2Num: { fontSize: 32, fontWeight: 500, fontFamily: 'var(--mono)', color: 'var(--green)', letterSpacing: -1 },
  co2Unit: { fontSize: 14, color: 'var(--green)', fontFamily: 'var(--mono)' },
  co2Label: { fontSize: 12, color: 'var(--green)', opacity: 0.8, marginBottom: 12 },
  co2CompsRow: { display: 'flex', gap: 8 },
  co2Comp: { flex: 1, background: 'rgba(52,201,106,0.08)', borderRadius: 8, padding: '10px 12px' },
  co2CompNum: { fontSize: 18, fontWeight: 500, fontFamily: 'var(--mono)', color: 'var(--green)' },
  co2CompLabel: { fontSize: 11, color: 'var(--green)', opacity: 0.7, marginTop: 2, lineHeight: 1.3 },

  highlightCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  hlRow: { display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12, borderBottom: '0.5px solid var(--border)' },
  hlRowLast: { display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 12 },
  hlIcon: { fontSize: 20, flexShrink: 0, width: 32, textAlign: 'center' },
  hlInfo: { flex: 1, minWidth: 0 },
  hlLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 2 },
  hlValue: { fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  hlCount: { fontSize: 12, color: 'var(--amber)', fontFamily: 'var(--mono)', flexShrink: 0 },

  barCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', width: 48, flexShrink: 0, fontSize: 11 },
  barTrack: { flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', background: 'var(--amber)', borderRadius: 2 },
  barCount: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', width: 20, textAlign: 'right' },

  achCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 },
  achIcon: { fontSize: 26, flexShrink: 0 },
  achTitle: { fontSize: 14, fontWeight: 500 },
  achSub: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },

  dataCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  dataRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '0.5px solid var(--border)', gap: 12 },
  dataRowLast: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12 },
  dataLabel: { fontSize: 14, flex: 1 },
  dataSub: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  dataBtn: { fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '0 14px', color: 'var(--text)', height: 36, flexShrink: 0 },
  dataBtnDanger: { fontFamily: 'var(--mono)', fontSize: 12, background: 'var(--red-dim)', border: '0.5px solid var(--red)', borderRadius: 8, padding: '0 14px', color: 'var(--red)', height: 36, flexShrink: 0 },

  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 },
  toast: { position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--green)', color: '#080808', padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 500, zIndex: 300, whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '0 20px' },
  confirmBox: { background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: 16, padding: '24px 20px', width: '100%', maxWidth: 360 },
  confirmTitle: { fontSize: 17, fontWeight: 500, marginBottom: 8 },
  confirmText: { fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 },
  confirmBtns: { display: 'flex', gap: 10 },
  confirmCancel: { flex: 1, background: 'transparent', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 14, color: 'var(--text)', fontSize: 15 },
  confirmDelete: { flex: 1, background: 'var(--red)', border: 'none', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, fontWeight: 500 },
}

function getAchievements(stats) {
  const list = []
  if (stats.count >= 1)   list.push({ icon: '🚆', title: 'Erste Fahrt',    sub: 'Willkommen an Bord!' })
  if (stats.count >= 10)  list.push({ icon: '🏅', title: '10 Fahrten',     sub: 'Echter Bahnpendler' })
  if (stats.count >= 50)  list.push({ icon: '🥇', title: '50 Fahrten',     sub: 'Bahnexperte' })
  if (stats.totalKm >= 1000)  list.push({ icon: '📍', title: '1.000 km',   sub: 'Quer durch Deutschland' })
  if (stats.totalKm >= 10000) list.push({ icon: '🌍', title: '10.000 km',  sub: 'Europareisender' })
  if (stats.co2SavedKg >= 100) list.push({ icon: '🌱', title: `${stats.co2SavedKg} kg CO₂`, sub: 'Klimaschützer auf Schienen' })
  if (stats.delayed === 0 && stats.count >= 3) list.push({ icon: '⏱️', title: 'Immer pünktlich', sub: 'Kein einziger Delay' })
  return list
}

export default function StatsView({ trips, onTripsChange }) {
  const pastTrips = trips.filter(t => !t.planned)
  const stats = computeStats(trips)
  const achievements = getAchievements(stats)
  const maxByType = Math.max(...Object.values(stats.byType), 1)
  const totalHours = Math.floor(stats.totalMin / 60)
  const totalMins = stats.totalMin % 60
  const onTimeRate = stats.count > 0 ? Math.round((stats.onTime / stats.count) * 100) : 0
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef(null)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  function handleExport() {
    const data = { version: 1, exportedAt: new Date().toISOString(), trips }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `zugly-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(url)
    showToast(`${trips.length} Fahrten exportiert`)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result)
        const imported = data.trips || (Array.isArray(data) ? data : [])
        if (!imported.length) { showToast('Keine Fahrten gefunden'); return }
        const existing = new Set(loadTrips().map(t => t.id))
        imported.filter(t => !existing.has(t.id)).forEach(t => saveTrip(t))
        onTripsChange?.()
        showToast(`${imported.filter(t => !existing.has(t.id)).length} Fahrten importiert`)
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

      {pastTrips.length === 0 && <div style={s.empty}>Noch keine Fahrten für Statistiken.</div>}

      {pastTrips.length > 0 && (
        <>
          <div style={s.sectionTitle}>Übersicht</div>
          <div style={s.grid2}>
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

          {stats.co2SavedKg > 0 && (
            <>
              <div style={s.sectionTitle}>CO₂ gespart vs. Auto</div>
              <div style={s.co2Card}>
                <div style={s.co2Top}>
                  <span style={s.co2Num}>{stats.co2SavedKg.toLocaleString('de-DE')}</span>
                  <span style={s.co2Unit}>kg CO₂</span>
                </div>
                <div style={s.co2Label}>eingespart gegenüber {stats.totalKm.toLocaleString('de-DE')} km mit dem Auto</div>
                <div style={s.co2CompsRow}>
                  <div style={s.co2Comp}>
                    <div style={s.co2CompNum}>{stats.treesPerYear}</div>
                    <div style={s.co2CompLabel}>Bäume die ein Jahr CO₂ binden</div>
                  </div>
                  <div style={s.co2Comp}>
                    <div style={s.co2CompNum}>{stats.flightsFfmBer}</div>
                    <div style={s.co2CompLabel}>Flüge Frankfurt↔Berlin vermieden</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {(stats.topStation || stats.topRoute) && (
            <>
              <div style={s.sectionTitle}>Highlights</div>
              <div style={s.highlightCard}>
                {stats.topStation && (
                  <div style={s.hlRow}>
                    <span style={s.hlIcon}>🏟️</span>
                    <div style={s.hlInfo}>
                      <div style={s.hlLabel}>MEISTBESUCHTER BAHNHOF</div>
                      <div style={s.hlValue}>{stats.topStation[0]}</div>
                    </div>
                    <span style={s.hlCount}>{stats.topStation[1]}×</span>
                  </div>
                )}
                {stats.topRoute && (
                  <div style={stats.topStation ? s.hlRowLast : s.hlRow}>
                    <span style={s.hlIcon}>🛤️</span>
                    <div style={s.hlInfo}>
                      <div style={s.hlLabel}>HÄUFIGSTE STRECKE</div>
                      <div style={s.hlValue}>{stats.topRoute[0]}</div>
                    </div>
                    <span style={s.hlCount}>{stats.topRoute[1]}×</span>
                  </div>
                )}
              </div>
            </>
          )}

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
                <div key={i} style={s.achCard}>
                  <span style={s.achIcon}>{a.icon}</span>
                  <div><div style={s.achTitle}>{a.title}</div><div style={s.achSub}>{a.sub}</div></div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      <div style={s.sectionTitle}>Meine Daten</div>
      <div style={s.dataCard}>
        <div style={s.dataRow}>
          <div><div style={s.dataLabel}>Backup exportieren</div><div style={s.dataSub}>Alle Fahrten als JSON speichern</div></div>
          <button style={s.dataBtn} onClick={handleExport} disabled={trips.length === 0}>Export</button>
        </div>
        <div style={s.dataRow}>
          <div><div style={s.dataLabel}>Backup importieren</div><div style={s.dataSub}>Fahrten aus JSON laden</div></div>
          <button style={s.dataBtn} onClick={() => fileRef.current?.click()}>Import</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        <div style={s.dataRowLast}>
          <div><div style={s.dataLabel}>Alle Fahrten löschen</div><div style={s.dataSub}>{trips.length} Fahrten werden entfernt</div></div>
          <button style={s.dataBtnDanger} onClick={() => setConfirmDelete(true)} disabled={trips.length === 0}>Löschen</button>
        </div>
      </div>

      {confirmDelete && (
        <div style={s.overlay} onClick={() => setConfirmDelete(false)}>
          <div style={s.confirmBox} onClick={e => e.stopPropagation()}>
            <div style={s.confirmTitle}>Alle Fahrten löschen?</div>
            <div style={s.confirmText}>Diese Aktion löscht alle {trips.length} gespeicherten Fahrten. Erstelle vorher ein Backup.</div>
            <div style={s.confirmBtns}>
              <button style={s.confirmCancel} onClick={() => setConfirmDelete(false)}>Abbrechen</button>
              <button style={s.confirmDelete} onClick={handleDeleteAll}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
