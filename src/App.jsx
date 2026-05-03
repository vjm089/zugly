import { useState, useEffect } from 'react'
import SearchView from './components/SearchView.jsx'
import LogbookView from './components/LogbookView.jsx'
import StatsView from './components/StatsView.jsx'
import LiveView from './components/LiveView.jsx'
import LogModal from './components/LogModal.jsx'
import { loadTrips, saveTrip, deleteTrip } from './store.js'

const s = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' },
  main: { flex: 1, overflowY: 'auto', paddingBottom: 72 },
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480, background: 'var(--surface)',
    borderTop: '0.5px solid var(--border2)', display: 'flex', zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  navBtn: {
    flex: 1, background: 'transparent', border: 'none',
    padding: '10px 0 9px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 3, cursor: 'pointer', color: 'var(--muted)',
    fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: 0.4, transition: 'color 0.15s',
  },
  navBtnActive: { color: 'var(--amber)' },
  navIcon: { fontSize: 18, lineHeight: 1 },
  navIndicator: {
    position: 'absolute', top: 0, height: '1.5px', background: 'var(--amber)',
    borderRadius: '0 0 2px 2px', transition: 'left 0.2s ease, width 0.2s ease',
  },
  toast: {
    position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--green)', color: '#080808', padding: '10px 22px',
    borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 300,
    whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeUp 0.2s ease',
  },
}

const TABS = [
  { id: 'search',  label: 'SUCHE', icon: '⊙' },
  { id: 'live',    label: 'LIVE',  icon: '◉' },
  { id: 'logbook', label: 'BUCH',  icon: '≡' },
  { id: 'stats',   label: 'STATS', icon: '∿' },
]

export default function App() {
  const [tab, setTab] = useState('search')
  const [trips, setTrips] = useState([])
  const [pendingTrip, setPendingTrip] = useState(null)
  const [liveTrip, setLiveTrip] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => { setTrips(loadTrips()) }, [])

  function handleLog(tripData) { setPendingTrip(tripData) }

  function handleSaveTrip(tripWithMeta) {
    saveTrip(tripWithMeta)
    setTrips(loadTrips())
    setPendingTrip(null)
    setToast('Fahrt gespeichert ✓')
    setTimeout(() => setToast(null), 2800)
    setTab('logbook')
  }

  function handleDelete(id) { deleteTrip(id); setTrips(loadTrips()) }

  function handleTrackLive(trip) { setLiveTrip(trip); setTab('live') }

  const tabIdx = TABS.findIndex(t => t.id === tab)

  return (
    <div style={s.app}>
      <main style={s.main}>
        {tab === 'search'  && <SearchView onLog={handleLog} onTrackLive={handleTrackLive} />}
        {tab === 'live'    && <LiveView trip={liveTrip} onBack={() => setTab('search')} />}
        {tab === 'logbook' && <LogbookView trips={trips} onDelete={handleDelete} onTrackLive={handleTrackLive} />}
        {tab === 'stats'   && <StatsView trips={trips} />}
      </main>

      <nav style={s.nav}>
        <div style={{ ...s.navIndicator, left: `${(tabIdx / TABS.length) * 100}%`, width: `${100 / TABS.length}%` }} />
        {TABS.map(t => (
          <button key={t.id} style={{ ...s.navBtn, ...(tab === t.id ? s.navBtnActive : {}) }} onClick={() => setTab(t.id)}>
            <span style={s.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {pendingTrip && <LogModal trip={pendingTrip} onSave={handleSaveTrip} onCancel={() => setPendingTrip(null)} />}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
