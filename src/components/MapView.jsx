import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchLiveTrip, formatTime, formatDate, calcDelayMin, getLiveProgress } from '../api.js'

const COLORS = ['#4a9eff','#60aaff','#2d7fe8','#78bcff','#1a6fd4','#5ab4ff','#3d8ff0','#87c9ff']

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' },
  mapEl: { flex: 1, minHeight: 0, background: '#141414' },
  panel: { height: 280, flexShrink: 0, background: 'var(--surface)', borderTop: '0.5px solid var(--border2)', display: 'flex', flexDirection: 'column' },
  tabs: { display: 'flex', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  tabBtn: { flex: 1, padding: '10px 0', background: 'transparent', border: 'none', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)', letterSpacing: 0.4, cursor: 'pointer' },
  tabActive: { color: 'var(--amber)', borderBottom: '1.5px solid var(--amber)' },
  list: { flex: 1, overflowY: 'auto' },
  row: { display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid var(--border)', transition: 'background 0.1s' },
  rowActive: { background: 'var(--amber-dim)' },
  dot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  route: { fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 1 },
  km: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--amber)', flexShrink: 0 },
  empty: { padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 },
  liveList: { flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  liveCard: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '11px 14px', cursor: 'pointer' },
  liveCardActive: { border: '0.5px solid var(--amber)' },
  liveTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 8px', borderRadius: 10 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite' },
  liveRoute: { fontSize: 13, fontWeight: 500 },
  liveMeta: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 2 },
  pb: { height: 3, background: 'var(--border2)', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  pbFill: { height: '100%', background: 'var(--amber)', borderRadius: 2, transition: 'width 0.5s' },
  spinner: { width: 16, height: 16, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '8px auto 0' },
}

function makeDotHtml(color, size, glow = false) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${color};${glow ? `box-shadow:0 0 0 4px ${color}44;` : ''}"></div>`
}

export default function MapView({ trips, currentSearchTrips }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef([])
  const [panelTab, setPanelTab] = useState('vergangen')
  const [selectedId, setSelectedId] = useState(null)
  const [liveTrip, setLiveTrip] = useState(null)
  const [liveData, setLiveData] = useState(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveProgress, setLiveProgress] = useState(null)

  const tripsWithStops = trips.filter(t => !t.planned && t.stops?.length >= 2)

  useEffect(() => {
    const L = window.L
    if (!L || !containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map)
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
    const L = window.L
    const map = mapRef.current
    if (!L || !map) return
    clearLayers()

    if (liveData) {
      const stopovers = liveData.stopovers || []
      const coords = stopovers.filter(s => s.stop?.location).map(s => [s.stop.location.latitude, s.stop.location.longitude])
      if (coords.length < 2) return
      const idx = liveProgress?.currentIdx ?? -1
      layersRef.current.push(L.polyline(coords, { color: '#333', weight: 3 }).addTo(map))
      if (idx > 0) layersRef.current.push(L.polyline(coords.slice(0, idx + 1), { color: '#e8a020', weight: 4 }).addTo(map))
      stopovers.forEach((sv, i) => {
        if (!sv.stop?.location) return
        const isCur = i === idx
        const isPast = i < idx
        const col = isCur ? '#e8a020' : isPast ? '#3ecf7a' : '#444'
        const size = isCur ? 14 : 7
        const icon = L.divIcon({ className: '', html: makeDotHtml(col, size, isCur), iconSize: [size, size], iconAnchor: [size/2, size/2] })
        layersRef.current.push(L.marker([sv.stop.location.latitude, sv.stop.location.longitude], { icon }).addTo(map))
      })
      if (idx >= 0 && coords[idx]) map.setView(coords[idx], 9)
      else try { map.fitBounds(coords, { padding: [40, 40] }) } catch {}
      return
    }

    const allCoords = []
    tripsWithStops.forEach((trip, i) => {
      const coords = trip.stops.filter(s => s.lat && s.lng).map(s => [s.lat, s.lng])
      if (coords.length < 2) return
      const color = COLORS[i % COLORS.length]
      const isSelected = trip.id === selectedId
      layersRef.current.push(
        L.polyline(coords, { color: isSelected ? color : '#2a5a9a', weight: isSelected ? 5 : 2, opacity: isSelected ? 1 : 0.55 }).addTo(map)
      )
      if (isSelected) {
        coords.forEach((c, ci) => {
          const isEnd = ci === 0 || ci === coords.length - 1
          const size = isEnd ? 11 : 6
          const icon = L.divIcon({ className: '', html: makeDotHtml(color, size, isEnd), iconSize: [size, size], iconAnchor: [size/2, size/2] })
          layersRef.current.push(L.marker(c, { icon }).addTo(map))
        })
        try { map.fitBounds(coords, { padding: [50, 50] }) } catch {}
      }
      allCoords.push(...coords)
    })

    if (!selectedId && allCoords.length > 0) {
      try { map.fitBounds(allCoords, { padding: [40, 40] }) } catch {}
    }
  }, [tripsWithStops.length, selectedId, liveData, liveProgress])

  const loadLive = useCallback(async (trip) => {
    if (!trip?.tripId) return
    setLiveLoading(true); setLiveData(null); setLiveProgress(null)
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
    setLiveTrip(trip); setSelectedId(null); loadLive(trip)
  }

  // Show saved logbook trips (most recent first) that have a tripId for live tracking
  const logbookTrips = [...trips]
    .filter(t => t?.tripId)
    .sort((a, b) => new Date(b.depPlanned || 0) - new Date(a.depPlanned || 0))
    .slice(0, 10)
  const progressPct = liveProgress
    ? Math.round(Math.max(0, liveProgress.currentIdx) / Math.max(1, liveProgress.total - 1) * 100)
    : 0

  return (
    <div style={s.wrap}>
      <div ref={containerRef} style={s.mapEl} />

      <div style={s.panel}>
        <div style={s.tabs}>
          <button style={{ ...s.tabBtn, ...(panelTab === 'vergangen' ? s.tabActive : {}) }}
            onClick={() => { setPanelTab('vergangen'); setLiveTrip(null); setLiveData(null) }}>
            VERGANGEN
          </button>
          <button style={{ ...s.tabBtn, ...(panelTab === 'zukunft' ? s.tabActive : {}) }}
            onClick={() => { setPanelTab('zukunft'); setSelectedId(null); setLiveTrip(null); setLiveData(null) }}>
            GEPLANT
          </button>
          <button style={{ ...s.tabBtn, ...(panelTab === 'aktuell' ? s.tabActive : {}) }}
            onClick={() => { setPanelTab('aktuell'); setSelectedId(null) }}>
            AKTUELL
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

        {panelTab === 'zukunft' && (() => {
          const futureTrips = trips.filter(t => t.planned && t.stops?.length >= 2)
          const allFuture = trips.filter(t => t.planned)
          return (
            <div style={s.list}>
              {allFuture.length === 0
                ? <div style={s.empty}>Noch keine geplanten Reisen.<br />Klicke 📅 bei einem Suchergebnis.</div>
                : allFuture.map((trip, i) => (
                  <div key={trip.id}
                    style={{ ...s.row, ...(trip.id === selectedId ? s.rowActive : {}) }}
                    onClick={() => {
                      if (futureTrips.find(t => t.id === trip.id)) {
                        setSelectedId(trip.id === selectedId ? null : trip.id)
                        setLiveTrip(null); setLiveData(null)
                      }
                    }}
                  >
                    <div style={{ ...s.dot, background: '#4a9eff', opacity: 0.7 }} />
                    <div style={s.info}>
                      <div style={s.route}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                      <div style={s.meta}>{trip.depPlanned ? new Date(trip.depPlanned).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' }) : '–'} · {trip.trainName}</div>
                    </div>
                    {trip.distanceKm > 0 && <span style={s.km}>{trip.distanceKm} km</span>}
                  </div>
                ))
              }
            </div>
          )
        })()}

        {panelTab === 'aktuell' && (
          <div style={s.liveList}>
            {logbookTrips.length === 0
              ? <div style={s.empty}>Logge zuerst eine Fahrt im Tagebuch.<br />Dann kannst du sie hier live verfolgen.</div>
              : logbookTrips.map((trip, i) => {
                const isActive = liveTrip?.tripId === trip.tripId
                return (
                  <div key={i} style={{ ...s.liveCard, ...(isActive ? s.liveCardActive : {}) }} onClick={() => selectLive(trip)}>
                    <div style={s.liveTop}>
                      <span style={s.badge}>{trip.trainName}</span>
                      {isActive && <span style={s.liveDot} />}
                    </div>
                    <div style={s.liveRoute}>{trip.from?.split('(')[0].trim()} → {trip.to?.split('(')[0].trim()}</div>
                    <div style={s.liveMeta}>{formatTime(trip.depPlanned)} → {formatTime(trip.arrPlanned)}</div>
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
