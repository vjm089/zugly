import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchLiveTrip, formatTime, formatDate, calcDelayMin, getLiveProgress } from '../api.js'

const COLORS = ['#4a9eff','#60aaff','#2d7fe8','#78bcff','#1a6fd4','#5ab4ff','#3d8ff0','#87c9ff']

function classify(trip) {
  const now = Date.now()
  const dep = new Date(trip.depPlanned || trip.depActual || 0).getTime()
  const arr = new Date(trip.arrPlanned || trip.arrActual || 0).getTime()
  if (!dep) return 'vergangen'
  if (dep > now) return 'zukunft'
  if (arr && arr < now) return 'vergangen'
  return 'aktuell'
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 72px)' },
  mapEl: { flex: 1, minHeight: 0, background: '#141414' },
  panel: { height: 280, flexShrink: 0, background: 'var(--surface)', borderTop: '0.5px solid var(--border2)', display: 'flex', flexDirection: 'column' },
  tabs: { display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  tabBtn: { flex: 1, padding: '10px 0', background: 'transparent', border: 'none', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: 0.3, cursor: 'pointer', minHeight: 44 },
  tabActive: { color: 'var(--amber)', borderBottom: '1.5px solid var(--amber)' },
  list: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  row: { display: 'flex', alignItems: 'center', padding: '11px 16px', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid var(--border)', minHeight: 56 },
  rowActive: { background: 'var(--amber-dim)' },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  dotLive: { width: 9, height: 9, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  route: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 },
  km: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--amber)', flexShrink: 0 },
  empty: { padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 },
  liveIndicator: { fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 7px', borderRadius: 10, flexShrink: 0 },
  spinner: { width: 14, height: 14, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 },
}

function makeDot(color, size, glow = false) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color};${glow ? `box-shadow:0 0 0 4px ${color}44` : ''}"></div>`
}

export default function MapView({ trips }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef([])
  const [panelTab, setPanelTab] = useState('aktuell')
  const [selectedId, setSelectedId] = useState(null)
  const [loadingId, setLoadingId] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [liveProgress, setLiveProgress] = useState(null)

  const pastTrips    = trips.filter(t => classify(t) === 'vergangen' && t.stops?.length >= 2)
  const currentTrips = trips.filter(t => classify(t) === 'aktuell')
  const futureTrips  = trips.filter(t => classify(t) === 'zukunft' && t.stops?.length >= 2)

  const displayedTrips = panelTab === 'vergangen' ? pastTrips
    : panelTab === 'zukunft' ? futureTrips
    : currentTrips

  useEffect(() => {
    const L = window.L
    if (!L || !containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?lang=de', { maxZoom: 18, attribution: '© OpenStreetMap-Mitwirkende © CARTO' }).addTo(map)
    map.setView([51.16, 10.45], 6)
    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 200)
    return () => { map.remove(); mapRef.current = null }
  }, [])

  const clearLayers = () => {
    layersRef.current.forEach(l => { try { l.remove() } catch {} })
    layersRef.current = []
  }

  useEffect(() => {
    const L = window.L; const map = mapRef.current
    if (!L || !map) return
    clearLayers()

    if (liveData && selectedId) {
      const stopovers = liveData.stopovers || []
      const coords = stopovers.filter(s => s.stop?.location).map(s => [s.stop.location.latitude, s.stop.location.longitude])
      if (coords.length >= 2) {
        const idx = liveProgress?.currentIdx ?? -1
        layersRef.current.push(L.polyline(coords, { color: '#2a5a9a', weight: 3 }).addTo(map))
        if (idx > 0) layersRef.current.push(L.polyline(coords.slice(0, idx + 1), { color: '#4a9eff', weight: 4 }).addTo(map))
        stopovers.forEach((sv, i) => {
          if (!sv.stop?.location) return
          const isCur = i === idx; const isPast = i < idx
          const col = isCur ? '#e8a020' : isPast ? '#3ecf7a' : '#333'
          const size = isCur ? 14 : 7
          const icon = L.divIcon({ className: '', html: makeDot(col, size, isCur), iconSize: [size, size], iconAnchor: [size/2, size/2] })
          layersRef.current.push(L.marker([sv.stop.location.latitude, sv.stop.location.longitude], { icon }).addTo(map))
        })
        if (idx >= 0 && coords[idx]) map.setView(coords[idx], 9)
        else try { map.fitBounds(coords, { padding: [40, 40] }) } catch {}
      }
      return
    }

    const toShow = panelTab === 'vergangen' ? pastTrips : panelTab === 'zukunft' ? futureTrips : []
    const allCoords = []
    toShow.forEach((trip, i) => {
      const coords = trip.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng])
      if (coords.length < 2) return
      const color = COLORS[i % COLORS.length]
      const isSelected = trip.id === selectedId
      const isFuture = panelTab === 'zukunft'
      layersRef.current.push(L.polyline(coords, {
        color: isSelected ? color : '#2a5a9a',
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.55,
        dashArray: isFuture ? '8 6' : null,
      }).addTo(map))
      if (isSelected) {
        coords.forEach((c, ci) => {
          const isEnd = ci === 0 || ci === coords.length - 1
          const size = isEnd ? 10 : 6
          const icon = L.divIcon({ className: '', html: makeDot(color, size, isEnd), iconSize: [size, size], iconAnchor: [size/2, size/2] })
          layersRef.current.push(L.marker(c, { icon }).addTo(map))
        })
        try { map.fitBounds(coords, { padding: [50, 50] }) } catch {}
      }
      allCoords.push(...coords)
    })
    if (!selectedId && allCoords.length > 0) try { map.fitBounds(allCoords, { padding: [40, 40] }) } catch {}
  }, [panelTab, selectedId, trips.length, liveData, liveProgress])

  const loadLive = useCallback(async (trip) => {
    if (!trip?.tripId) return
    setLoadingId(trip.id)
    setLiveData(null); setLiveProgress(null)
    try {
      const data = await fetchLiveTrip(trip.tripId)
      setLiveData(data)
      setLiveProgress(getLiveProgress(data.stopovers || []))
    } catch {}
    finally { setLoadingId(null) }
  }, [])

  function selectTrip(trip) {
    if (selectedId === trip.id) {
      setSelectedId(null); setLiveData(null); setLiveProgress(null)
    } else {
      setSelectedId(trip.id)
      if (panelTab === 'aktuell' && trip.tripId) loadLive(trip)
    }
  }

  function switchTab(tab) {
    setPanelTab(tab)
    setSelectedId(null)
    setLiveData(null)
    setLiveProgress(null)
  }

  return (
    <div style={s.wrap}>
      <div ref={containerRef} style={s.mapEl} />
      <div style={s.panel}>
        <div style={s.tabs}>
          <button style={{ ...s.tabBtn, ...(panelTab === 'aktuell' ? s.tabActive : {}) }} onClick={() => switchTab('aktuell')}>
            AKTUELL ({currentTrips.length})
          </button>
          <button style={{ ...s.tabBtn, ...(panelTab === 'vergangen' ? s.tabActive : {}) }} onClick={() => switchTab('vergangen')}>
            VERGANGEN ({pastTrips.length})
          </button>
          <button style={{ ...s.tabBtn, ...(panelTab === 'zukunft' ? s.tabActive : {}) }} onClick={() => switchTab('zukunft')}>
            ZUKÜNFTIG ({futureTrips.length})
          </button>
        </div>

        <div style={s.list}>
          {displayedTrips.length === 0 ? (
            <div style={s.empty}>
              {panelTab === 'aktuell' && 'Keine Züge fahren gerade.\nLogge eine Fahrt bevor sie losgeht.'}
              {panelTab === 'vergangen' && 'Noch keine vergangenen Fahrten.'}
              {panelTab === 'zukunft' && 'Keine zukünftigen Fahrten.\nLogge eine Verbindung deren Abfahrt\nnoch in der Zukunft liegt.'}
            </div>
          ) : displayedTrips.map((trip, i) => {
            const isSelected = trip.id === selectedId
            const isLoading = trip.id === loadingId
            const color = COLORS[i % COLORS.length]
            const dep = trip.depPlanned ? formatTime(trip.depPlanned) : '–'
            const arr = trip.arrPlanned ? formatTime(trip.arrPlanned) : '–'
            const date = trip.depPlanned ? formatDate(trip.depPlanned) : '–'

            return (
              <div key={trip.id} style={{ ...s.row, ...(isSelected ? s.rowActive : {}) }} onClick={() => selectTrip(trip)}>
                {panelTab === 'aktuell'
                  ? <div style={s.dotLive} />
                  : <div style={{ ...s.dot, background: color }} />
                }
                <div style={s.info}>
                  <div style={s.route}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                  <div style={s.meta}>{date} · {dep}–{arr} · {trip.trainName}</div>
                </div>
                {isLoading && <div style={s.spinner} />}
                {panelTab === 'aktuell' && !isLoading && trip.tripId && (
                  <span style={s.liveIndicator}>live</span>
                )}
                {trip.distanceKm > 0 && !isLoading && <span style={s.km}>{trip.distanceKm} km</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
