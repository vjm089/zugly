const BASE = 'https://v6.db.transport.rest'

export async function searchStations(query) {
  if (!query || query.length < 2) return []
  const res = await fetch(
    `${BASE}/locations?query=${encodeURIComponent(query)}&results=6&stops=true&addresses=false&poi=false`,
    { headers: { 'Accept': 'application/json' } }
  )
  if (!res.ok) throw new Error('Stationssuche fehlgeschlagen')
  const data = await res.json()
  return data.filter(s => s.type === 'stop' || s.type === 'station')
}

export async function searchJourneys(fromId, toId, date) {
  const dep = date ? new Date(date).toISOString() : new Date().toISOString()
  const res = await fetch(
    `${BASE}/journeys?from=${fromId}&to=${toId}&departure=${encodeURIComponent(dep)}&results=5&stopovers=true&polyline=false&language=de`,
    { headers: { 'Accept': 'application/json' } }
  )
  if (!res.ok) throw new Error('Verbindungssuche fehlgeschlagen')
  const data = await res.json()
  return data.journeys || []
}

export async function fetchTrip(tripId, lineName) {
  const res = await fetch(
    `${BASE}/trips/${encodeURIComponent(tripId)}?stopovers=true&polyline=false&language=de`,
    { headers: { 'Accept': 'application/json' } }
  )
  if (!res.ok) throw new Error('Live-Daten konnten nicht geladen werden')
  const data = await res.json()
  return data.trip || data
}

export function formatTime(isoString) {
  if (!isoString) return '–'
  return new Date(isoString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(isoString) {
  if (!isoString) return '–'
  return new Date(isoString).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function calcDuration(dep, arr) {
  if (!dep || !arr) return '–'
  const diffMs = new Date(arr) - new Date(dep)
  const h = Math.floor(diffMs / 3600000)
  const m = Math.floor((diffMs % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function calcDelayMin(planned, actual) {
  if (!planned || !actual) return 0
  return Math.round((new Date(actual) - new Date(planned)) / 60000)
}

export function getLegs(journey) {
  return (journey.legs || []).filter(l => !l.walking && !l.transfer)
}

export function journeyMainLeg(journey) {
  const legs = getLegs(journey)
  if (legs.length === 0) return journey.legs?.[0]
  return legs.reduce((a, b) => {
    const aMs = new Date(a.arrival || 0) - new Date(a.departure || 0)
    const bMs = new Date(b.arrival || 0) - new Date(b.departure || 0)
    return bMs > aMs ? b : a
  })
}

export function journeyChanges(journey) {
  const legs = getLegs(journey)
  return Math.max(0, legs.length - 1)
}
