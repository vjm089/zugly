const BASE = 'https://v6.db.transport.rest'

export async function searchStations(query) {
  if (!query || query.length < 2) return []
  const res = await fetch(
    `${BASE}/locations?query=${encodeURIComponent(query)}&results=6&stops=true&addresses=false&poi=false`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error('Stationssuche fehlgeschlagen')
  const data = await res.json()
  return data.filter(s => s.type === 'stop' || s.type === 'station')
}

export async function searchJourneys(fromId, toId, date) {
  const dep = date ? new Date(date).toISOString() : new Date().toISOString()
  const res = await fetch(
    `${BASE}/journeys?from=${fromId}&to=${toId}&departure=${encodeURIComponent(dep)}&results=5&stopovers=true&polyline=false&language=de`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error('Verbindungssuche fehlgeschlagen')
  const data = await res.json()
  return data.journeys || []
}

export async function fetchLiveTrip(tripId) {
  const res = await fetch(
    `${BASE}/trips/${encodeURIComponent(tripId)}?stopovers=true&polyline=true&language=de`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res.ok) throw new Error('Live-Daten nicht verfügbar')
  const data = await res.json()
  return data.trip || data
}

export function formatTime(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function calcDuration(dep, arr) {
  if (!dep || !arr) return '–'
  const ms = new Date(arr) - new Date(dep)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function calcDelayMin(planned, actual) {
  if (!planned || !actual) return 0
  return Math.round((new Date(actual) - new Date(planned)) / 60000)
}

export function getLegs(journey) {
  return (journey.legs || []).filter(l => !l.walking && !l.transfer)
}

export function journeyChanges(journey) {
  return Math.max(0, getLegs(journey).length - 1)
}

export function getLiveProgress(stopovers) {
  if (!stopovers || stopovers.length === 0) return null
  const now = Date.now()
  let lastPassed = -1
  for (let i = 0; i < stopovers.length; i++) {
    const dep = stopovers[i].departure || stopovers[i].plannedDeparture
    const arr = stopovers[i].arrival || stopovers[i].plannedArrival
    if ((dep && new Date(dep) < now) || (arr && new Date(arr) < now)) {
      lastPassed = i
    }
  }
  return { currentIdx: lastPassed, total: stopovers.length }
}
