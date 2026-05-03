import { useState, useEffect } from 'react'
import SearchView from './components/SearchView.jsx'
import LogbookView from './components/LogbookView.jsx'
import StatsView from './components/StatsView.jsx'
import LogModal from './components/LogModal.jsx'
import { loadTrips, saveTrip, deleteTrip } from './store.js'

const s = {
  app: { minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', position: 'relative' },
  main: { flex: 1, overflowY: 'auto', paddingBottom: 70 },
  nav: {
    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
    width: '100%', maxWidth: 480,
    background: 'var(--surface)', borderTop: '0.5px solid var(--border2)',
    display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navBtn: {
    flex: 1, background: 'transparent', border: 'none',
    padding: '12px 0 10px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, cursor: 'pointer', color: 'var(--muted)',
    fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: 0.3,
  },
  navBtnActive: { color: 'var(--amber)' },
  navIcon: { fontSize: 20, lineHeight: 1 },
  toast: {
    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--green)', color: '#0c0c0c', padding: '10px 20px',
    borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 300,
    whiteSpace: 'nowrap', pointerEvents: 'none',
  },
}

const TABS = [
  { id: 'search', label: 'SUCHE', icon: '🔍' },
  { id: 'logbook', label: 'TAGEBUCH', icon: '📋' },
  { id: 'stats', label: 'STATISTIK', icon: '📊' },
]

export default function App() {
  const [tab, setTab] = useState('search')
  const [trips, setTrips] = useState([])
  const [pendingTrip, setPendingTrip] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setTrips(loadTrips())
  }, [])

  function handleLog(tripData) {
    setPendingTrip(tripData)
  }

  function handleSaveTrip(tripWithMeta) {
    const saved = saveTrip(tripWithMeta)
    setTrips(loadTrips())
    setPendingTrip(null)
    setToast('Fahrt gespeichert!')
    setTimeout(() => setToast(null), 2500)
    setTab('logbook')
  }

  function handleDelete(id) {
    deleteTrip(id)
    setTrips(loadTrips())
  }

  return (
    <div style={s.app}>
      <main style={s.main}>
        {tab === 'search' && <SearchView onLog={handleLog} />}
        {tab === 'logbook' && <LogbookView trips={trips} onDelete={handleDelete} />}
        {tab === 'stats' && <StatsView trips={trips} />}
      </main>

      <nav style={s.nav}>
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

      {pendingTrip && (
        <LogModal
          trip={pendingTrip}
          onSave={handleSaveTrip}
          onCancel={() => setPendingTrip(null)}
        />
      )}

      {toast && <div style={s.toast}>{toast}</div>}
    </div>
  )
}
