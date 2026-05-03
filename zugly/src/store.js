const KEY = 'zugly_trips_v1'

export function loadTrips() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveTrip(trip) {
  const trips = loadTrips()
  const newTrip = {
    ...trip,
    id: crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
  }
  trips.unshift(newTrip)
  localStorage.setItem(KEY, JSON.stringify(trips))
  return newTrip
}

export function deleteTrip(id) {
  const trips = loadTrips().filter(t => t.id !== id)
  localStorage.setItem(KEY, JSON.stringify(trips))
}

export function computeStats(trips) {
  const totalKm = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0)
  const totalMin = trips.reduce((sum, t) => sum + (t.durationMin || 0), 0)
  const delayed = trips.filter(t => (t.delayArrMin || 0) > 5).length
  const onTime = trips.length - delayed

  const byType = {}
  trips.forEach(t => {
    const type = t.trainType || 'Unbekannt'
    byType[type] = (byType[type] || 0) + 1
  })

  return { totalKm, totalMin, delayed, onTime, byType, count: trips.length }
}
