const KEY = 'zugly_trips_v1'

export function loadTrips() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveTrip(trip) {
  const trips = loadTrips()
  const newTrip = { ...trip, id: crypto.randomUUID(), loggedAt: new Date().toISOString() }
  trips.unshift(newTrip)
  localStorage.setItem(KEY, JSON.stringify(trips))
  return newTrip
}

export function deleteTrip(id) {
  const trips = loadTrips().filter(t => t.id !== id)
  localStorage.setItem(KEY, JSON.stringify(trips))
}

function stationShort(name) {
  return name?.split('(')[0].trim() || ''
}

export function computeStats(trips) {
  const past = trips.filter(t => !t.planned)

  const totalKm = past.reduce((sum, t) => sum + (t.distanceKm || 0), 0)
  const totalMin = past.reduce((sum, t) => sum + (t.durationMin || 0), 0)
  const delayed = past.filter(t => (t.delayArrMin || 0) > 5).length
  const onTime = past.length - delayed

  const byType = {}
  past.forEach(t => {
    const type = t.trainType || 'Unbekannt'
    byType[type] = (byType[type] || 0) + 1
  })

  // Most visited station
  const stationCount = {}
  past.forEach(t => {
    const f = stationShort(t.from)
    const to = stationShort(t.to)
    if (f) stationCount[f] = (stationCount[f] || 0) + 1
    if (to) stationCount[to] = (stationCount[to] || 0) + 1
  })
  const topStation = Object.entries(stationCount).sort((a, b) => b[1] - a[1])[0] || null

  // Most traveled route
  const routeCount = {}
  past.forEach(t => {
    const f = stationShort(t.from)
    const to = stationShort(t.to)
    if (f && to) {
      const key = `${f} → ${to}`
      routeCount[key] = (routeCount[key] || 0) + 1
    }
  })
  const topRoute = Object.entries(routeCount).sort((a, b) => b[1] - a[1])[0] || null

  // CO2: train ~32g/km, car ~170g/km → saved 138g/km
  const co2SavedKg = Math.round(totalKm * 0.138)
  // Comparisons
  const treesPerYear = Math.round(co2SavedKg / 22)     // 1 tree ≈ 22kg CO2/year
  const flightsFfmBer = Math.round(co2SavedKg / 63)    // Frankfurt↔Berlin flight ≈ 63kg/person
  const carKm = Math.round(totalKm * (170 / 170))      // km you would have driven

  return {
    totalKm, totalMin, delayed, onTime, byType,
    count: past.length,
    topStation, topRoute,
    co2SavedKg, treesPerYear, flightsFfmBer, carKm,
  }
}
