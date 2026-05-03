import { useState, useEffect } from 'react'
import SearchView from './components/SearchView.jsx'
import LogbookView from './components/LogbookView.jsx'
import StatsView from './components/StatsView.jsx'
import MapView from './components/MapView.jsx'
import LogModal from './components/LogModal.jsx'
import LiveView from './components/LiveView.jsx'
import { loadTrips, saveTrip, deleteTrip } from './store.js'

const NAV_H = 56

const s = {
  app: { minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' },
  main: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))` },
  mainNoScroll: { flex: 1, overflow: 'hidden', paddingBottom: `calc(${NAV_H}px + env(safe-area-inset-bottom, 0px))` },
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'var(--surface)',
    borderTop: '0.5px solid var(--border2)',
    display: 'flex',
    zIndex: 100,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  navBtn: {
    flex: 1, background: 'transparent', border: 'none',
    height: NAV_H,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 3, cursor: 'pointer', color: 'var(--muted)',
    fontSize: 9, fontFamily: 'var(--mono)', letterSpacing: 0.4,
    transition: 'color 0.15s',
    WebkitTapHighlightColor: 'transparent',
  },
  navBtnActive: { color: 'var(--amber)' },
  navIcon: { fontSize: 20, lineHeight: 1 },
  navIndicator: {
    position: 'absolute', top: 0, height: '2px',
    background: 'var(--amber)',
    transition: 'left 0.2s ease, width 0.2s ease',
  },
  toast: {
    position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--green)', color: '#080808', padding: '12px 24px',
    borderRadius: 24, fontSize: 14, fontWeight: 500, zIndex: 300,
    whiteSpace: 'nowrap', pointerEvents: 'none', animation: 'fadeUp 0.2s ease',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
}

const TABS = [
  { id: 'search',  label: 'SUCHE', icon: '⊙' },
  { id: 'map',     label: 'KARTE', icon: '◎' },
  { id: 'logbook', label: 'BUCH',  icon: '≡' },
  { id: 'stats',   label: 'STATS', icon: '∿' },
]

export default function App() {
  const [tab, setTab] = useState('search')
  const [trips, setTrips] = useState([])
  const [pendingTrip, setPendingTrip] = useState(null)
  const [liveTrip, setLiveTrip] = useState(null)
  const [showLive, setShowLive] = useState(false)
  const [toast, setToast] = useState(null)
  const [currentSearchTrips, setCurrentSearchTrips] = useState([])

  useEffect(() => { setTrips(loadTrips()) }, [])

  function refreshTrips() { setTrips(loadTrips()) }

  function handleLog(tripData) { setPendingTrip(tripData) }

  function handleSaveTrip(tripWithMeta) {
    saveTrip(tripWithMeta)
    refreshTrips()
    setPendingTrip(null)
    setToast('Fahrt gespeichert ✓')
    setTimeout(() => setToast(null), 2800)
    setTab('logbook')
  }

  function handleDelete(id) { deleteTrip(id); refreshTrips() }
  function handleTrackLive(trip) { setLiveTrip(trip); setShowLive(true) }
  function handleSearchResults(results) { setCurrentSearchTrips(results) }

  const tabIdx = TABS.findIndex(t => t.id === tab)
  const isMap = tab === 'map'

  return (
    <div style={s.app}>
      <main style={isMap ? s.mainNoScroll : s.main}>
        {tab === 'search'  && <SearchView onLog={handleLog} onTrackLive={handleTrackLive} onResults={handleSearchResults} />}
        {tab === 'map'     && <MapView trips={trips} />}
        {tab === 'logbook' && <LogbookView trips={trips} onDelete={handleDelete} onTrackLive={handleTrackLive} />}
        {tab === 'stats'   && <StatsView trips={trips} onTripsChange={refreshTrips} />}
      </main>

      <nav style={s.nav}>
        <div style={{ ...s.navIndicator, left: `${(tabIdx / TABS.length) * 100}%`, width: `${100 / TABS.length}%` }} />
        {TABS.map(t => (
          <button
            key={t.id}
            style={{ ...s.navBtn, ...(tab === t.id ? s.navBtnActive : {}) }}
            onClick={() => setTab(t.id)}
          >
            <span style={s.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {pendingTrip && <LogModal trip={pendingTrip} onSave={handleSaveTrip} onCancel={() => setPendingTrip(null)} />}
      {showLive && liveTrip && <LiveView trip={liveTrip} onBack={() => setShowLive(false)} />}
      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
