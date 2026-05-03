import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchLiveTrip, formatTime, formatDate, calcDelayMin, getLiveProgress } from '../api.js'

const COLORS = ['#e8a020','#4a9eff','#3ecf7a','#e8483a','#c47aff','#ff8c42','#00d4aa','#ff6b9d']

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' },
  mapContainer: { flex: 1, position: 'relative', minHeight: 0 },
  mapEl: { width: '100%', height: '100%' },

  panel: { height: 320, background: 'var(--surface)', borderTop: '0.5px solid var(--border2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  tabs: { display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  tabBtn: { flex: 1, padding: '11px 0', background: 'transparent', border: 'none', fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: 0.4, cursor: 'pointer', transition: 'color 0.15s' },
  tabBtnActive: { color: 'var(--amber)', borderBottom: '1.5px solid var(--amber)' },

  list: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  tripRow: { display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' },
  tripRowActive: { background: 'var(--amber-dim)' },
  colorDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  tripInfo: { flex: 1, minWidth: 0 },
  tripRoute: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tripMeta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 },
  tripKm: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--amber)' },

  empty: { padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 },

  livePanel: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  liveCard: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.15s' },
  liveCardActive: { border: '0.5px solid var(--amber)' },
  liveCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  liveTrainBadge: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 7px', borderRadius: 10 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite' },
  liveRoute: { fontSize: 14, fontWeight: 500 },
  liveTimes: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 3 },
  liveDelay: { fontSize: 11, fontFamily: 'var(--mono)', padding: '2px 7px', borderRadius: 10 },
  liveDelayOk: { background: 'var(--green-dim)', color: 'var(--green)' },
  liveDelayBad: { background: 'var(--red-dim)', color: 'var(--red)' },

  progressBar: { height: 3, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', background: 'var(--amber)', borderRadius: 2, transition: 'width 0.5s ease' },

  noTrip: { padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 },
  hint: { fontSize: 11, color: 'var(--muted)', marginTop: 6 },

  spinner: { margin: '20px auto', width: 20, height: 20, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
}

function TripMap({ trips, selectedId, liveData, liveProgress }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)
  const linesRef = useRef([])
  const liveLayerRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map)
      instanceRef.current = { map, L }
      drawTrips(trips, selectedId, L, map)
    })
    return () => {
      if (instanceRef.current?.map) { instanceRef.current.map.remove(); instanceRef.current = null }
    }
  }, [])

  function drawTrips(trips, selectedId, L, map) {
    linesRef.current.forEach(l => l.remove())
    linesRef.current = []
    const allCoords = []

    trips.forEach((trip, i) => {
      if (!trip.stops?.length) return
      const coords = trip.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng])
      if (coords.length < 2) return
      const color = COLORS[i % COLORS.length]
      const isSelected = trip.id === selectedId
      const line = L.polyline(coords, {
        color: isSelected ? color : '#3a3a3a',
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.5,
      }).addTo(map)
      linesRef.current.push(line)
      if (isSelected) {
        coords.forEach((c, ci) => {
          const dot = L.circleMarker(c, {
            radius: ci === 0 || ci === coords.length - 1 ? 5 : 3,
            color, fillColor: color, fillOpacity: 1, weight: 1,
          }).addTo(map)
          linesRef.current.push(dot)
        })
        map.fitBounds(coords, { padding: [40, 40] })
      }
      allCoords.push(...coords)
    })

    if (!selectedId && allCoords.length > 0) {
      try { map.fitBounds(allCoords, { padding: [40, 40] }) } catch {}
    }
  }

  useEffect(() => {
    if (!instanceRef.current) return
    const { map, L } = instanceRef.current
    drawTrips(trips, selectedId, L, map)
  }, [trips, selectedId])

  useEffect(() => {
    if (!instanceRef.current || !liveData) return
    const { map, L } = instanceRef.current
    if (liveLayerRef.current) { liveLayerRef.current.forEach(l => l.remove()); liveLayerRef.current = [] }
    const stopovers = liveData.stopovers || []
    if (!stopovers.length) return
    const coords = stopovers.filter(s => s.stop?.location).map(s => [s.stop.location.latitude, s.stop.location.longitude])
    if (coords.length < 2) return
    const currentIdx = liveProgress?.currentIdx ?? -1
    const passed = coords.slice(0, currentIdx + 1)
    const future = coords.slice(currentIdx)
    const layers = []
    layers.push(L.polyline(coords, { color: '#333', weight: 3 }).addTo(map))
    if (passed.length > 1) layers.push(L.polyline(passed, { color: '#e8a020', weight: 4 }).addTo(map))
    stopovers.forEach((sv, i) => {
      if (!sv.stop?.location) return
      const c = [sv.stop.location.latitude, sv.stop.location.longitude]
      const isCurrent = i === currentIdx
      const isPassed = i < currentIdx
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${isCurrent?14:7}px;height:${isCurrent?14:7}px;border-radius:50%;background:${isCurrent?'#e8a020':isPassed?'#3ecf7a':'#444'};border:2px solid ${isCurrent?'#f0b84a':isPassed?'#3ecf7a':'#666'};${isCurrent?'box-shadow:0 0 0 4px rgba(232,160,32,0.3)':''}"></div>`,
        iconSize: [isCurrent?14:7, isCurrent?14:7],
        iconAnchor: [isCurrent?7:3.5, isCurrent?7:3.5],
      })
      layers.push(L.marker(c, { icon }).addTo(map))
    })
    liveLayerRef.current = layers
    if (currentIdx >= 0 && coords[currentIdx]) map.setView(coords[currentIdx], 9)
    else if (coords.length) map.fitBounds(coords, { padding: [40, 40] })
  }, [liveData, liveProgress])

  return <div ref={mapRef} style={{ ...s.mapEl, background: '#141414' }} />
}

export default function MapView({ trips, currentSearchTrips }) {
  const [panelTab, setPanelTab] = useState('vergangen')
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [selectedLiveTrip, setSelectedLiveTrip] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveProgress, setLiveProgress] = useState(null)

  const tripsWithStops = trips.filter(t => t.stops?.length >= 2)

  const loadLive = useCallback(async (trip) => {
    if (!trip?.tripId) return
    setLiveLoading(true)
    setLiveData(null)
    try {
      const data = await fetchLiveTrip(trip.tripId)
      setLiveData(data)
      setLiveProgress(getLiveProgress(data.stopovers || []))
    } catch {}
    finally { setLiveLoading(false) }
  }, [])

  function selectLive(trip) {
    setSelectedLiveTrip(trip)
    setSelectedTripId(null)
    loadLive(trip)
  }

  function selectPast(trip) {
    setSelectedTripId(trip.id === selectedTripId ? null : trip.id)
    setSelectedLiveTrip(null)
    setLiveData(null)
  }

  const todayTrips = (currentSearchTrips || []).filter(t => t.tripId)

  return (
    <div style={s.wrap}>
      <div style={s.mapContainer}>
        <TripMap
          trips={tripsWithStops}
          selectedId={selectedTripId}
          liveData={liveData}
          liveProgress={liveProgress}
        />
      </div>

      <div style={s.panel}>
        <div style={s.tabs}>
          <button
            style={{ ...s.tabBtn, ...(panelTab === 'vergangen' ? s.tabBtnActive : {}) }}
            onClick={() => setPanelTab('vergangen')}
          >
            VERGANGENE REISEN
          </button>
          <button
            style={{ ...s.tabBtn, ...(panelTab === 'aktuell' ? s.tabBtnActive : {}) }}
            onClick={() => setPanelTab('aktuell')}
          >
            AKTUELLE FAHRT
          </button>
        </div>

        {panelTab === 'vergangen' && (
          <div style={s.list}>
            {tripsWithStops.length === 0 ? (
              <div style={s.empty}>
                Noch keine Reisen mit Kartendaten vorhanden.<br />
                <span style={s.hint}>Logge eine Verbindung über die Suche.</span>
              </div>
            ) : tripsWithStops.map((trip, i) => {
              const isActive = trip.id === selectedTripId
              const color = COLORS[i % COLORS.length]
              return (
                <div
                  key={trip.id}
                  style={{ ...s.tripRow, ...(isActive ? s.tripRowActive : {}) }}
                  onClick={() => selectPast(trip)}
                >
                  <div style={{ ...s.colorDot, background: color }} />
                  <div style={s.tripInfo}>
                    <div style={s.tripRoute}>
                      {trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}
                    </div>
                    <div style={s.tripMeta}>
                      {trip.depPlanned ? formatDate(trip.depPlanned) : '–'} · {trip.trainName}
                    </div>
                  </div>
                  {trip.distanceKm > 0 && (
                    <span style={s.tripKm}>{trip.distanceKm} km</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {panelTab === 'aktuell' && (
          <div style={s.livePanel}>
            {todayTrips.length === 0 ? (
              <div style={s.noTrip}>
                Suche zuerst eine Verbindung und wähle sie hier aus.
                <div style={s.hint}>Die Ergebnisse erscheinen hier automatisch.</div>
              </div>
            ) : todayTrips.map((trip, i) => {
              const isActive = selectedLiveTrip?.tripId === trip.tripId
              const delay = calcDelayMin(trip.arrPlanned, trip.arrActual)
              const stopovers = liveData?.stopovers || []
              const progress = isActive && liveProgress
                ? Math.round(Math.max(0, liveProgress.currentIdx) / Math.max(1, liveProgress.total - 1) * 100)
                : 0

              return (
                <div
                  key={i}
                  style={{ ...s.liveCard, ...(isActive ? s.liveCardActive : {}) }}
                  onClick={() => selectLive(trip)}
                >
                  <div style={s.liveCardTop}>
                    <span style={s.liveTrainBadge}>{trip.trainName}</span>
                    {isActive && <span style={s.liveDot} />}
                  </div>
                  <div style={s.liveRoute}>
                    {trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={s.liveTimes}>
                      {formatTime(trip.depPlanned)} → {formatTime(trip.arrPlanned)}
                    </span>
                    <span style={delay <= 5 ? { ...s.liveDelay, ...s.liveDelayOk } : { ...s.liveDelay, ...s.liveDelayBad }}>
                      {delay <= 0 ? 'Pünktlich' : `+${delay} Min`}
                    </span>
                  </div>
                  {isActive && (
                    <div style={s.progressBar}>
                      <div style={{ ...s.progressFill, width: `${progress}%` }} />
                    </div>
                  )}
                  {isActive && liveLoading && <div style={s.spinner} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
