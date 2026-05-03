import { useEffect, useRef } from 'react'

export default function TrainMap({ stopovers, polyline, currentIdx }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  useEffect(() => {
    const L = window.L
    if (!L || !containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map)
    mapRef.current = map

    const stops = (stopovers || []).filter(s => s.stop?.location)
    if (!stops.length) return

    const coords = stops.map(s => [s.stop.location.latitude, s.stop.location.longitude])

    if (polyline?.features?.[0]?.geometry?.coordinates) {
      const lc = polyline.features[0].geometry.coordinates.map(c => [c[1], c[0]])
      L.polyline(lc, { color: '#5a5a5a', weight: 2 }).addTo(map)
    } else {
      L.polyline(coords, { color: '#5a5a5a', weight: 2, dashArray: '4 6' }).addTo(map)
    }

    const passed = coords.slice(0, currentIdx + 1)
    if (passed.length > 1) L.polyline(passed, { color: '#e8a020', weight: 3 }).addTo(map)

    stops.forEach((s, i) => {
      const isCur = i === currentIdx
      const isPast = i <= currentIdx
      const size = isCur ? 14 : 8
      const color = isCur ? '#e8a020' : isPast ? '#34c96a' : '#3a3a3a'
      const border = isCur ? '#f0b84a' : isPast ? '#34c96a' : '#5a5a5a'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${border};${isCur ? 'box-shadow:0 0 0 4px rgba(232,160,32,0.25)' : ''}"></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size / 2],
      })
      L.marker([s.stop.location.latitude, s.stop.location.longitude], { icon })
        .addTo(map).bindPopup(`<b style="color:#e8a020">${s.stop.name}</b>`)
    })

    if (currentIdx >= 0 && coords[currentIdx]) map.setView(coords[currentIdx], 8)
    else map.fitBounds(coords, { padding: [20, 20] })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', background: '#141414' }}
    />
  )
}
