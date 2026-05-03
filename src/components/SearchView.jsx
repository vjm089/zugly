import { useState, useRef, useEffect, useCallback } from 'react'
import { searchStations, searchJourneys, formatTime, calcDuration, calcDelayMin, getLegs, journeyChanges, calcJourneyDistanceKm, searchTrainByNumber, fetchLiveTrip } from '../api.js'

const s = {
  wrap: { padding: '0 0 40px' },
  header: { padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  livePill: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--green)', fontFamily: 'var(--mono)', background: 'var(--green-dim)', padding: '4px 10px', borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite' },

  searchWrap: { margin: '18px 16px 0' },
  modeRow: { display: 'flex', gap: 6, marginBottom: 10, padding: '4px', background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: 12 },
  modeBtn: { flex: 1, background: 'transparent', border: 'none', padding: '10px 0', fontSize: 13, fontFamily: 'var(--sans)', color: 'var(--muted)', borderRadius: 8, cursor: 'pointer', minHeight: 40 },
  modeBtnActive: { background: 'var(--surface3)', color: 'var(--amber)', fontWeight: 500 },
  searchBox: { background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: '14px 14px 0 0', overflow: 'visible', position: 'relative' },
  row: { display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, borderBottom: '0.5px solid var(--border)', position: 'relative' },
  rowLast: { display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, position: 'relative' },
  label: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', width: 28, flexShrink: 0, letterSpacing: 0.3 },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 16, padding: '14px 0', minWidth: 0 },
  swapBtn: { background: 'var(--surface3)', border: '0.5px solid var(--border2)', borderRadius: 7, padding: '6px 10px', color: 'var(--amber)', fontSize: 14, lineHeight: 1 },

  dropdown: { position: 'absolute', top: 'calc(100% + 1px)', left: -1, right: -1, background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: '0 0 12px 12px', zIndex: 100, overflow: 'hidden' },
  dropItem: { padding: '14px 16px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)', minHeight: 48 },
  dropItemLast: { padding: '14px 16px', cursor: 'pointer', minHeight: 48 },
  dropName: { color: 'var(--text)', fontSize: 13, fontWeight: 500 },
  dropSub: { color: 'var(--muted)', fontSize: 11, marginTop: 1 },

  metaBox: { display: 'flex', background: 'var(--surface)', border: '0.5px solid var(--border2)', borderTop: 'none', borderRadius: '0 0 14px 14px' },
  metaPill: { flex: 1, padding: '10px 16px', borderRight: '0.5px solid var(--border)' },
  metaPillLast: { flex: 1, padding: '10px 16px' },
  metaLbl: { fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.3 },
  metaVal: { fontSize: 13, color: 'var(--text)', marginTop: 2 },
  dateInput: { background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, width: '100%', cursor: 'pointer' },

  searchBtn: { marginTop: 10, background: 'var(--amber)', border: 'none', borderRadius: 12, padding: '16px', width: '100%', color: '#080808', fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 500, letterSpacing: 0.2, minHeight: 52 },
  searchBtnDisabled: { opacity: 0.35, cursor: 'not-allowed' },

  sectionTitle: { padding: '24px 16px 10px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },

  card: { margin: '0 16px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, overflow: 'hidden', animation: 'fadeUp 0.25s ease both', cursor: 'pointer' },
  cardActive: { border: '0.5px solid var(--border3)' },
  cardTop: { padding: '13px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  trainId: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' },
  trainName: { fontSize: 16, fontWeight: 500, marginTop: 2, letterSpacing: -0.2 },
  badge: { fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 20 },
  badgeGreen: { background: 'var(--green-dim)', color: 'var(--green)' },
  badgeAmber: { background: 'var(--amber-dim)', color: 'var(--amber)' },

  journeyRow: { padding: '14px 16px', display: 'flex', alignItems: 'center' },
  stBlock: {},
  stBlockR: { textAlign: 'right' },
  stTime: { fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 500, letterSpacing: -1 },
  stName: { fontSize: 12, color: 'var(--text2)', marginTop: 3 },
  midLine: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 14px' },
  dur: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  track: { width: '100%', height: 1, background: 'var(--border2)', position: 'relative' },
  trackFill: { height: '100%', background: 'var(--amber)', position: 'absolute', left: 0, top: 0 },
  changes: { fontSize: 11, color: 'var(--muted)', marginTop: 5 },

  cardFooter: { padding: '10px 16px', borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 },
  chip: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface2)', border: '0.5px solid var(--border2)', padding: '3px 8px', borderRadius: 5, color: 'var(--text2)' },
  liveBtn: { marginLeft: 'auto', background: 'var(--blue-dim)', border: '0.5px solid rgba(74,158,255,0.3)', borderRadius: 10, padding: '10px 14px', color: 'var(--blue)', fontSize: 12, fontFamily: 'var(--mono)', minHeight: 40 },
  logBtn: { background: 'var(--amber)', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#080808', fontSize: 13, fontWeight: 500, minHeight: 40 },

  legs: { borderTop: '0.5px solid var(--border)' },
  legRow: { padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' },
  legTag: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface3)', padding: '3px 8px', borderRadius: 4, color: 'var(--amber)', flexShrink: 0 },
  legStations: { fontSize: 13, color: 'var(--text2)', flex: 1 },
  legTimes: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' },

  err: { margin: '14px 16px 0', padding: '12px 16px', background: 'var(--red-dim)', border: '0.5px solid var(--red)', borderRadius: 10, fontSize: 13, color: 'var(--red)' },
  spinner: { margin: '32px auto', width: 22, height: 22, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
}

const CACHE = new Map()
const RECENT_KEY = 'zugly_recent_stations'

function loadRecentStations() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch { return [] }
}

function saveRecentStation(station) {
  try {
    const recent = loadRecentStations().filter(s => s.id !== station.id)
    recent.unshift({ id: station.id, name: station.name, type: station.type })
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)))
  } catch {}
}

function StationInput({ label, value, onChange, onSelect, placeholder }) {
  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef(null)
  const abortRef = useRef(null)
  const justPicked = useRef(false)

  useEffect(() => { setQuery(value?.name || '') }, [value])

  const doSearch = useCallback(async (q) => {
    const key = q.toLowerCase().trim()
    if (CACHE.has(key)) {
      setResults(CACHE.get(key))
      setOpen(true)
      setLoading(false)
      return
    }
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    try {
      setLoading(true)
      const r = await searchStations(q, abortRef.current.signal)
      CACHE.set(key, r)
      setResults(r)
      setOpen(r.length > 0)
    } catch (e) {
      if (e.name !== 'AbortError') { setResults([]); setOpen(false) }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e) {
    if (justPicked.current) { justPicked.current = false; return }
    const q = e.target.value
    setQuery(q)
    onChange(null)
    clearTimeout(timer.current)
    if (!q.trim()) {
      const recent = loadRecentStations()
      setResults(recent)
      setOpen(recent.length > 0)
      setLoading(false)
      return
    }
    const key = q.toLowerCase().trim()
    if (CACHE.has(key)) { doSearch(q); return }
    setLoading(true)
    timer.current = setTimeout(() => doSearch(q), 150)
  }

  function handleFocus() {
    if (!query.trim()) {
      const recent = loadRecentStations()
      setResults(recent)
      setOpen(recent.length > 0)
    } else if (results.length > 0) setOpen(true)
  }

  function pick(station) {
    justPicked.current = true
    saveRecentStation(station)
    setQuery(station.name)
    setResults([])
    setOpen(false)
    setLoading(false)
    onSelect(station)
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={s.label}>{label}</span>
        <input
          style={s.input}
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>
      {open && (
        <div style={{ ...s.dropdown, zIndex: label === 'VON' ? 102 : 101 }}>
          {loading && <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>Suche…</div>}
          {!loading && !query.trim() && results.length > 0 && (
            <div style={{ padding: '8px 16px 4px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.4 }}>ZULETZT GESUCHT</div>
          )}
          {!loading && results.map((r, i) => (
            <div key={r.id} style={i === results.length - 1 ? s.dropItemLast : s.dropItem} onPointerDown={e => { e.preventDefault(); pick(r) }}>
              <div style={s.dropName}>{r.name}</div>
              {r.location?.city && <div style={s.dropSub}>{r.location.city}</div>}
            </div>
          ))}
          {!loading && !query.trim() && results.length === 0 && (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>Tippe einen Bahnhofsnamen ein</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SearchView({ onLog, onLive, onTrackLive, onResults }) {
  const [searchMode, setSearchMode] = useState('route')
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [trainNumber, setTrainNumber] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  function swap() { const t = from; setFrom(to); setTo(t); setJourneys([]) }

  async function search() {
    setLoading(true); setError(null); setJourneys([])
    try {
      if (searchMode === 'train') {
        if (!trainNumber.trim()) { setError('Bitte Zugnummer eingeben.'); return }
        const departures = await searchTrainByNumber(trainNumber.trim())
        if (!departures || departures.length === 0) {
          setError('Kein Zug mit dieser Nummer in den nächsten Stunden gefunden. Tipp: Probier "ICE 1091" mit Leerzeichen.')
          return
        }
        // Fetch full trip data for each departure to get destination + route
        const fullTrips = await Promise.all(departures.slice(0, 6).map(async dep => {
          const tripId = dep.tripId || dep.id
          if (!tripId) return null
          try {
            const tripData = await fetchLiveTrip(tripId)
            const stopovers = tripData?.stopovers || []
            const lastStop = stopovers[stopovers.length - 1]
            return {
              legs: [{
                origin: dep.stop || tripData?.origin || { name: stopovers[0]?.stop?.name || '?' },
                destination: tripData?.destination || lastStop?.stop || { name: '?' },
                plannedDeparture: dep.plannedWhen || stopovers[0]?.plannedDeparture,
                plannedArrival: lastStop?.plannedArrival,
                departure: dep.when || stopovers[0]?.departure,
                arrival: lastStop?.arrival,
                line: dep.line || tripData?.line,
                tripId,
                stopovers,
                departurePlatform: dep.plannedPlatform || dep.platform,
              }],
            }
          } catch { return null }
        }))
        const wrapped = fullTrips.filter(Boolean)
        if (wrapped.length === 0) {
          setError('Zugdetails konnten nicht geladen werden.')
          return
        }
        setJourneys(wrapped)
        if (onResults) onResults(wrapped.map(j => buildTrip(j)).filter(Boolean))
      } else {
        if (!from || !to) { setError('Bitte Start und Ziel auswählen.'); return }
        const r = await searchJourneys(from.id, to.id, date)
        setJourneys(r)
        if (r.length === 0) setError('Keine Verbindungen gefunden.')
        else if (onResults) onResults(r.map(j => buildTrip(j)).filter(Boolean))
      }
    } catch (e) { setError(e.message || 'Suche fehlgeschlagen.') }
    finally { setLoading(false) }
  }

  function buildTrip(journey) {
    const legs = getLegs(journey)
    const leg = legs[0]
    if (!leg) return null
    return {
      from: leg.origin?.name || from?.name,
      to: leg.destination?.name || to?.name,
      depPlanned: leg.plannedDeparture || leg.departure,
      arrPlanned: leg.plannedArrival || leg.arrival,
      depActual: leg.departure,
      arrActual: leg.arrival,
      durationMin: Math.round((new Date(leg.plannedArrival || leg.arrival) - new Date(leg.plannedDeparture || leg.departure)) / 60000),
      delayArrMin: calcDelayMin(leg.plannedArrival, leg.arrival),
      trainType: leg.line?.product?.toUpperCase() || 'ICE',
      trainName: leg.line?.name || '?',
      tripId: leg.tripId,
      changes: journeyChanges(journey),
      distanceKm: calcJourneyDistanceKm(journey),
      stops: legs.flatMap(l =>
        (l.stopovers || [])
          .map(sv => ({
            name: sv.stop?.name,
            lat: sv.stop?.location?.latitude,
            lng: sv.stop?.location?.longitude,
          }))
          .filter(sv => sv.lat && sv.lng)
      ),
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>zugly</div>
        <div style={s.livePill}><span style={s.liveDot} />DB Echtzeit</div>
      </div>

      <div style={s.searchWrap}>
        <div style={s.modeRow}>
          <button
            style={{ ...s.modeBtn, ...(searchMode === 'route' ? s.modeBtnActive : {}) }}
            onClick={() => setSearchMode('route')}
          >Strecke</button>
          <button
            style={{ ...s.modeBtn, ...(searchMode === 'train' ? s.modeBtnActive : {}) }}
            onClick={() => setSearchMode('train')}
          >Zugnummer</button>
        </div>
        {searchMode === 'route' ? (
          <div style={s.searchBox}>
            <div style={s.row}>
              <StationInput label="VON" value={from} onChange={setFrom} onSelect={setFrom} placeholder="Abfahrtsbahnhof" />
              <button style={s.swapBtn} onClick={swap}>⇅</button>
            </div>
            <div style={s.rowLast}>
              <StationInput label="NACH" value={to} onChange={setTo} onSelect={setTo} placeholder="Zielbahnhof" />
            </div>
          </div>
        ) : (
          <div style={s.searchBox}>
            <div style={s.rowLast}>
              <span style={s.label}>ZUG</span>
              <input
                style={s.input}
                value={trainNumber}
                onChange={e => setTrainNumber(e.target.value)}
                placeholder="z.B. ICE 1091, RE 6"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
          </div>
        )}
        {searchMode === "route" && <div style={s.metaBox}>
          <div style={s.metaPill}>
            <div style={s.metaLbl}>ABFAHRT</div>
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} style={s.dateInput} />
          </div>
          <div style={s.metaPillLast}>
            <div style={s.metaLbl}>KLASSE</div>
            <div style={s.metaVal}>2. Klasse</div>
          </div>
        </div>}
        <button
          style={{ ...s.searchBtn, ...((!from || !to || loading) ? s.searchBtnDisabled : {}) }}
          onClick={search}
          disabled={loading || (searchMode === "route" ? (!from || !to) : !trainNumber.trim())}
        >
          {loading ? 'Suche läuft…' : 'Verbindungen suchen'}
        </button>
      </div>

      {error && <div style={s.err}>{error}</div>}
      {loading && <div style={s.spinner} />}

      {journeys.length > 0 && (
        <>
          <div style={s.sectionTitle}>
            {journeys.length} Verbindungen · {from?.name?.split('(')[0].trim()} → {to?.name?.split('(')[0].trim()}
          </div>
          {journeys.map((journey, ji) => {
            const legs = getLegs(journey)
            const first = legs[0], last = legs[legs.length - 1]
            if (!first || !last) return null
            const dep = formatTime(first.plannedDeparture || first.departure)
            const arr = formatTime(last.plannedArrival || last.arrival)
            const dur = calcDuration(first.plannedDeparture, last.plannedArrival)
            const changes = journeyChanges(journey)
            const isOpen = expanded === ji
            const tripData = buildTrip(journey)

            return (
              <div key={ji} style={{ ...s.card, ...(isOpen ? s.cardActive : {}), animationDelay: `${ji * 0.05}s` }}>
                <div style={s.cardTop} onClick={() => setExpanded(isOpen ? null : ji)}>
                  <div>
                    <div style={s.trainId}>{legs.map(l => l.line?.name).filter(Boolean).join(' · ')}</div>
                    <div style={s.trainName}>{first.origin?.name?.split('(')[0]} → {last.destination?.name?.split('(')[0]}</div>
                  </div>
                  <span style={changes === 0 ? s.badgeGreen : s.badgeAmber}>
                    {changes === 0 ? 'Direkt' : `${changes}× Umstieg`}
                  </span>
                </div>

                <div style={s.journeyRow} onClick={() => setExpanded(isOpen ? null : ji)}>
                  <div style={s.stBlock}>
                    <div style={s.stTime}>{dep}</div>
                    <div style={s.stName}>{first.origin?.name?.split('(')[0]}</div>
                  </div>
                  <div style={s.midLine}>
                    <div style={s.dur}>{dur}</div>
                    <div style={s.track}><div style={s.trackFill} /></div>
                    <div style={s.changes}>{changes === 0 ? 'Direktzug' : `${changes} Umstieg${changes > 1 ? 'e' : ''}`}</div>
                  </div>
                  <div style={s.stBlockR}>
                    <div style={s.stTime}>{arr}</div>
                    <div style={{ ...s.stName, textAlign: 'right' }}>{last.destination?.name?.split('(')[0]}</div>
                  </div>
                </div>

                {isOpen && (
                  <div style={s.legs}>
                    {legs.map((leg, li) => (
                      <div key={li} style={s.legRow}>
                        <span style={s.legTag}>{leg.line?.name || '?'}</span>
                        <span style={s.legStations}>{leg.origin?.name?.split('(')[0]} → {leg.destination?.name?.split('(')[0]}</span>
                        <span style={s.legTimes}>{formatTime(leg.plannedDeparture)} – {formatTime(leg.plannedArrival)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={s.cardFooter}>
                  <span style={s.chip}>Gl. {first.departurePlatform || '?'}</span>
                  <span style={{ ...s.chip, border: 'none', background: 'transparent', paddingLeft: 0 }}>
                    {legs.map(l => l.line?.product?.toUpperCase()).filter(Boolean).join('+')}
                  </span>
                  {tripData?.tripId && (
                    <button style={s.liveBtn} onClick={() => (onLive || onTrackLive)?.(tripData)}>
                      ◉ Live
                    </button>
                  )}
                  <button style={s.logBtn} onClick={() => tripData && onLog(tripData)}>
                    + Loggen
                  </button>
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
