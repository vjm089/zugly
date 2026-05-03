const V6 = 'https://v6.db.transport.rest'
const V5 = 'https://v5.db.transport.rest'
const PROXY = 'https://corsproxy.io/?url='

async function tryFetch(url, signal) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function apiFetch(path, signal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  const attempts = [
    () => tryFetch(V6 + path, signal),
    () => tryFetch(V5 + path),
    () => tryFetch(PROXY + encodeURIComponent(V6 + path)),
  ]
  let lastErr
  for (const attempt of attempts) {
    try { return await attempt() } catch (e) {
      if (e.name === 'AbortError') throw e
      lastErr = e
    }
  }
  throw new Error('DB-API nicht erreichbar — bitte kurz warten und nochmal versuchen.')
}

export async function searchStations(query, signal) {
  if (!query || query.length < 2) return []
  const path = `/locations?query=${encodeURIComponent(query)}&results=6&stops=true&addresses=false&poi=false`
  const data = await apiFetch(path, signal)
  return (Array.isArray(data) ? data : []).filter(s => s.type === 'stop' || s.type === 'station')
}

export async function searchJourneys(fromId, toId, date) {
  const dep = date ? new Date(date).toISOString() : new Date().toISOString()
  const path = `/journeys?from=${fromId}&to=${toId}&departure=${encodeURIComponent(dep)}&results=5&stopovers=true&polyline=false&language=de`
  const data = await apiFetch(path)
  return data.journeys || []
}

export async function fetchLiveTrip(tripId) {
  const path = `/trips/${encodeURIComponent(tripId)}?stopovers=true&polyline=true&language=de`
  const data = await apiFetch(path)
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

// Haversine formula — distance between two lat/lng points in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Calculate total route distance from a leg's stopovers
export function calcDistanceKmFromStopovers(stopovers) {
  if (!stopovers || stopovers.length < 2) return 0
  let total = 0
  for (let i = 0; i < stopovers.length - 1; i++) {
    const a = stopovers[i]?.stop?.location
    const b = stopovers[i + 1]?.stop?.location
    if (a?.latitude && a?.longitude && b?.latitude && b?.longitude) {
      total += haversine(a.latitude, a.longitude, b.latitude, b.longitude)
    }
  }
  return Math.round(total)
}

// Calculate distance across all legs of a journey
export function calcJourneyDistanceKm(journey) {
  const legs = getLegs(journey)
  return legs.reduce((sum, leg) => {
    return sum + calcDistanceKmFromStopovers(leg.stopovers || [])
  }, 0)
}

// Search a train by line/train number (e.g. "ICE 1091", "RE 4")
export async function searchTrainByNumber(query, signal) {
  if (!query) return []
  const path = `/trips?query=${encodeURIComponent(query)}&onlyCurrentlyRunning=false`
  try {
    const data = await apiFetch(path, signal)
    return Array.isArray(data?.trips) ? data.trips : (Array.isArray(data) ? data : [])
  } catch {
    return []
  }
}

// Get train metadata (type, name) — used for logbook details
export function trainModelInfo(line) {
  if (!line) return { displayName: '?', longName: 'Unbekannt', wikiImage: null }
  const name = line.name || line.fahrtNr || '?'
  const product = (line.product || '').toLowerCase()
  const productName = line.productName || ''
  
  // Try to detect train series (ICE 1, ICE 3, ICE 4, etc.)
  let series = null
  let wikiImage = null
  if (/^ICE\s*[0-9]/.test(name)) {
    const num = parseInt(name.replace(/\D/g, ''), 10)
    if (num < 1000) series = `ICE ${num}`
    if (product === 'nationalexpress' || product.includes('ice')) {
      wikiImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/ICE_3_Frankfurt_Sued.jpg/640px-ICE_3_Frankfurt_Sued.jpg'
    }
  } else if (product.includes('ic') || /^IC\s/.test(name)) {
    series = 'IC'
    wikiImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/IC_2_Doppelstockwagen.jpg/640px-IC_2_Doppelstockwagen.jpg'
  } else if (/^RE\s/.test(name)) {
    series = 'Regional-Express'
  } else if (/^RB\s/.test(name)) {
    series = 'Regionalbahn'
  } else if (/^S\s?[0-9]/.test(name)) {
    series = 'S-Bahn'
  }

  return {
    displayName: name,
    longName: series || productName || name,
    wikiImage,
    product: product || 'unknown',
  }
}

