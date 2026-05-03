import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function TrainMap({ stopovers, polyline, currentIdx }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    const map = L.map(mapRef.current, {
      zoomControl: true, attributionControl: false, scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(map)
    instanceRef.current = map

    const stops = (stopovers || []).filter(s => s.stop?.location)
    if (!stops.length) return

    const coords = stops.map(s => [s.stop.location.latitude, s.stop.location.longitude])

    if (polyline?.features?.[0]?.geometry?.coordinates) {
      const lineCoords = polyline.features[0].geometry.coordinates.map(c => [c[1], c[0]])
      L.polyline(lineCoords, { color: '#5a5a5a', weight: 2, opacity: 0.8 }).addTo(map)
    } else {
      L.polyline(coords, { color: '#5a5a5a', weight: 2, opacity: 0.8, dashArray: '4 6' }).addTo(map)
    }

    const passed = coords.slice(0, currentIdx + 1)
    if (passed.length > 1) L.polyline(passed, { color: '#e8a020', weight: 3 }).addTo(map)

    stops.forEach((s, i) => {
      const isPassed = i <= currentIdx
      const isCurrent = i === currentIdx
      const size = isCurrent ? 14 : 8
      const color = isCurrent ? '#e8a020' : isPassed ? '#34c96a' : '#3a3a3a'
      const border = isCurrent ? '#f0b84a' : isPassed ? '#34c96a' : '#5a5a5a'
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid ${border};${isCurrent?'box-shadow:0 0 0 4px rgba(232,160,32,0.25)':''}"></div>`,
        iconSize: [size, size], iconAnchor: [size/2, size/2],
      })
      L.marker([s.stop.location.latitude, s.stop.location.longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong style="color:#e8a020">${s.stop.name}</strong>`)
    })

    if (currentIdx >= 0 && coords[currentIdx]) map.setView(coords[currentIdx], 8)
    else map.fitBounds(coords, { padding: [20, 20] })

    setTimeout(() => map.invalidateSize(), 50)

    return () => { map.remove(); instanceRef.current = null }
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', background: '#141414' }} />
}
