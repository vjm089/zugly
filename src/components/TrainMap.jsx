import { useEffect, useRef } from 'react'

export default function TrainMap({ stopovers, polyline, currentIdx }) {
  const mapRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css')

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: true,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(map)

      instanceRef.current = { map, L }

      const stops = (stopovers || []).filter(s => s.stop?.location)

      if (stops.length === 0) return

      const coords = stops.map(s => [s.stop.location.latitude, s.stop.location.longitude])

      if (polyline?.features?.[0]?.geometry?.coordinates) {
        const lineCoords = polyline.features[0].geometry.coordinates.map(c => [c[1], c[0]])
        L.polyline(lineCoords, { color: '#5a5a5a', weight: 2, opacity: 0.8 }).addTo(map)
      } else {
        L.polyline(coords, { color: '#5a5a5a', weight: 2, opacity: 0.8, dashArray: '4 6' }).addTo(map)
      }

      const passedCoords = coords.slice(0, currentIdx + 1)
      if (passedCoords.length > 1) {
        L.polyline(passedCoords, { color: '#e8a020', weight: 3, opacity: 1 }).addTo(map)
      }

      stops.forEach((s, i) => {
        const isPassed = i <= currentIdx
        const isCurrent = i === currentIdx

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width: ${isCurrent ? 14 : 8}px;
            height: ${isCurrent ? 14 : 8}px;
            border-radius: 50%;
            background: ${isCurrent ? '#e8a020' : isPassed ? '#34c96a' : '#3a3a3a'};
            border: 2px solid ${isCurrent ? '#f0b84a' : isPassed ? '#34c96a' : '#5a5a5a'};
            box-shadow: ${isCurrent ? '0 0 0 4px rgba(232,160,32,0.25)' : 'none'};
          "></div>`,
          iconSize: [isCurrent ? 14 : 8, isCurrent ? 14 : 8],
          iconAnchor: [isCurrent ? 7 : 4, isCurrent ? 7 : 4],
        })

        L.marker([s.stop.location.latitude, s.stop.location.longitude], { icon })
          .addTo(map)
          .bindPopup(`<strong style="color:#e8a020">${s.stop.name}</strong>`)
      })

      if (currentIdx >= 0 && coords[currentIdx]) {
        map.setView(coords[currentIdx], 8)
      } else {
        map.fitBounds(coords, { padding: [20, 20] })
      }
    })

    return () => {
      if (instanceRef.current?.map) {
        instanceRef.current.map.remove()
        instanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', background: '#141414' }}
    />
  )
}
