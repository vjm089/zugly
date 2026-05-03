import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchLiveTrip, formatTime, formatDate, calcDelayMin, getLiveProgress } from '../api.js'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const COLORS = ['#e8a020','#4a9eff','#3ecf7a','#e8483a','#c47aff','#ff8c42','#00d4aa','#ff6b9d']
const PANEL_H = 290

const s = {
  wrap: { position: 'relative', height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' },
  mapEl: { width: '100%', flex: 1, minHeight: 0 },
  panel: {
    height: PANEL_H, background: 'var(--surface)',
    borderTop: '0.5px solid var(--border2)',
    display: 'flex', flexDirection: 'column', flexShrink: 0,
  },
  tabs: { display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  tabBtn: { flex: 1, padding: '11px 0', background: 'transparent', border: 'none', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: 0.4, cursor: 'pointer' },
  tabBtnActive: { color: 'var(--amber)', borderBottom: '1.5px solid var(--amber)' },
  list: { flex: 1, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid var(--border)' },
  rowActive: { background: 'var(--amber-dim)' },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  route: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 1 },
  km: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--amber)', flexShrink: 0 },
  empty: { padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 },
  liveList: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  liveCard: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '11px 14px', cursor: 'pointer' },
  liveCardActive: { border: '0.5px solid var(--amber)' },
  liveTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 8px', borderRadius: 10 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite' },
  liveRoute: { fontSize: 13, fontWeight: 500 },
  liveMeta: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 2 },
  pb: { height: 3, background: 'var(--border2)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  pbFill: { height: '100%', background: 'var(--amber)', borderRadius: 2, transition: 'width 0.5s ease' },
  spinner: { width: 16, height: 16, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '6px auto 0' },
}

function dot(color, size = 8, glow = false) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color};${glow ? `box-shadow:0 0 0 4px ${color}44` : ''}"></div>`
}

export default function MapView({ trips, currentSearchTrips }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef([])
  const [panelTab, setPanelTab] = useState('vergangen')
  const [selectedId, setSelectedId] = useState(null)
  const [liveTrip, setLiveTrip] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveProgress, setLiveProgress] = useState(null)

  const tripsWithStops = trips.filter(t => t.stops?.length >= 2)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map)
    mapInstance.current = map
    setTimeout(() => { map.invalidateSize(); fitAll(map) }, 100)
    return () => { map.remove(); mapInstance.current = null }
  }, [])

  function clearLayers() {
    layersRef.current.forEach(l => { try { l.remove() } catch {} })
    layersRef.current = []
  }

  function fitAll(map) {
    const allCoords = tripsWithStops.flatMap(t =>
      t.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng])
    )
    if (allCoords.length) try { map.fitBounds(allCoords, { padding: [30, 30] }) } catch {}
    else map.setView([51.1657, 10.4515], 6)
  }

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return
    clearLayers()
    if (liveData) {
      drawLive(map, liveData, liveProgress)
      return
    }
    tripsWithStops.forEach((trip, i) => {
      const coords = trip.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng])
      if (coords.length < 2) return
      const color = COLORS[i % COLORS.length]
      const isSelected = trip.id === selectedId
      const line = L.polyline(coords, {
        color: isSelected ? color : '#333',
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.6,
      }).addTo(map)
      layersRef.current.push(line)
      if (isSelected) {
        coords.forEach((c, ci) => {
          const isEnd = ci === 0 || ci === coords.length - 1
          const m = L.marker(c, {
            icon: L.divIcon({ className: '', html: dot(color, isEnd ? 10 : 6), iconSize: [isEnd ? 10 : 6, isEnd ? 10 : 6], iconAnchor: [isEnd ? 5 : 3, isEnd ? 5 : 3] })
          }).addTo(map)
          layersRef.current.push(m)
        })
        try { map.fitBounds(coords, { padding: [50, 50] }) } catch {}
      }
    })
    if (!selectedId) fitAll(map)
  }, [tripsWithStops.length, selectedId, liveData, liveProgress])

  function drawLive(map, data, progress) {
    const stopovers = data.stopovers || []
    if (!stopovers.length) return
    const coords = stopovers.filter(s => s.stop?.location).map(s => [s.stop.location.latitude, s.stop.location.longitude])
    if (coords.length < 2) return
    const idx = progress?.currentIdx ?? -1
    const passed = coords.slice(0, idx + 1)
    layersRef.current.push(L.polyline(coords, { color: '#333', weight: 3 }).addTo(map))
    if (passed.length > 1) layersRef.current.push(L.polyline(passed, { color: '#e8a020', weight: 4 }).addTo(map))
    stopovers.forEach((sv, i) => {
      if (!sv.stop?.location) return
      const c = [sv.stop.location.latitude, sv.stop.location.longitude]
      const isCur = i === idx
      const isPast = i < idx
      const col = isCur ? '#e8a020' : isPast ? '#3ecf7a' : '#444'
      const size = isCur ? 14 : 7
      const icon = L.divIcon({ className: '', html: dot(col, size, isCur), iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
      layersRef.current.push(L.marker(c, { icon }).addTo(map))
    })
    if (idx >= 0 && coords[idx]) map.setView(coords[idx], 9)
    else try { map.fitBounds(coords, { padding: [40, 40] }) } catch {}
  }

  const loadLive = useCallback(async (trip) => {
    if (!trip?.tripId) return
    setLiveLoading(true)
    setLiveData(null)
    setLiveProgress(null)
    try {
      const data = await fetchLiveTrip(trip.tripId)
      setLiveData(data)
      setLiveProgress(getLiveProgress(data.stopovers || []))
    } catch (e) { console.error(e) }
    finally { setLiveLoading(false) }
  }, [])

  function selectPast(trip) {
    setSelectedId(trip.id === selectedId ? null : trip.id)
    setLiveTrip(null); setLiveData(null); setLiveProgress(null)
  }

  function selectLive(trip) {
    setLiveTrip(trip); setSelectedId(null)
    loadLive(trip)
  }

  const todayTrips = (currentSearchTrips || []).filter(t => t?.tripId)
  const progressPct = liveProgress
    ? Math.round(Math.max(0, liveProgress.currentIdx) / Math.max(1, liveProgress.total - 1) * 100)
    : 0

  return (
    <div style={s.wrap}>
      <div ref={mapRef} style={s.mapEl} />

      <div style={s.panel}>
        <div style={s.tabs}>
          <button style={{ ...s.tabBtn, ...(panelTab === 'vergangen' ? s.tabBtnActive : {}) }} onClick={() => { setPanelTab('vergangen'); setLiveTrip(null); setLiveData(null) }}>
            VERGANGENE REISEN
          </button>
          <button style={{ ...s.tabBtn, ...(panelTab === 'aktuell' ? s.tabBtnActive : {}) }} onClick={() => { setPanelTab('aktuell'); setSelectedId(null) }}>
            AKTUELLE FAHRT
          </button>
        </div>

        {panelTab === 'vergangen' && (
          <div style={s.list}>
            {tripsWithStops.length === 0
              ? <div style={s.empty}>Noch keine Reisen mit Kartendaten.<br />Logge eine Verbindung über die Suche.</div>
              : tripsWithStops.map((trip, i) => (
                <div key={trip.id} style={{ ...s.row, ...(trip.id === selectedId ? s.rowActive : {}) }} onClick={() => selectPast(trip)}>
                  <div style={{ ...s.dot, background: COLORS[i % COLORS.length] }} />
                  <div style={s.info}>
                    <div style={s.route}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                    <div style={s.meta}>{trip.depPlanned ? formatDate(trip.depPlanned) : '–'} · {trip.trainName}</div>
                  </div>
                  {trip.distanceKm > 0 && <span style={s.km}>{trip.distanceKm} km</span>}
                </div>
              ))
            }
          </div>
        )}

        {panelTab === 'aktuell' && (
          <div style={s.liveList}>
            {todayTrips.length === 0
              ? <div style={s.empty}>Suche zuerst eine Verbindung.<br />Die Züge erscheinen hier zur Auswahl.</div>
              : todayTrips.map((trip, i) => {
                const isActive = liveTrip?.tripId === trip.tripId
                const delay = calcDelayMin(trip.arrPlanned, trip.arrActual)
                return (
                  <div key={i} style={{ ...s.liveCard, ...(isActive ? s.liveCardActive : {}) }} onClick={() => selectLive(trip)}>
                    <div style={s.liveTop}>
                      <span style={s.badge}>{trip.trainName}</span>
                      {isActive && <span style={s.liveDot} />}
                    </div>
                    <div style={s.liveRoute}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                    <div style={s.liveMeta}>{formatTime(trip.depPlanned)} → {formatTime(trip.arrPlanned)} · {delay <= 0 ? 'Pünktlich' : `+${delay} Min`}</div>
                    {isActive && !liveLoading && <div style={s.pb}><div style={{ ...s.pbFill, width: `${progressPct}%` }} /></div>}
                    {isActive && liveLoading && <div style={s.spinner} />}
                  </div>
                )
              })
            }
          </div>
        )}
      </div>
    </div>
  )
}
