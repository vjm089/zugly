import { useState, useEffect, useRef } from 'react'
import { searchStations, searchJourneys, formatTime, formatDate, calcDuration, calcDelayMin, getLegs, journeyChanges } from '../api.js'

const s = {
  wrap: { padding: '0 0 40px' },
  header: { padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  logoSub: { color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', marginRight: 5 },

  searchBox: { margin: '20px 20px 0', background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: 12, overflow: 'visible', position: 'relative' },
  row: { display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, borderBottom: '0.5px solid var(--border)', position: 'relative' },
  rowLast: { display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, position: 'relative' },
  label: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', width: 30, flexShrink: 0 },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 14, padding: '13px 0', width: '100%' },
  swapBtn: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '5px 8px', color: 'var(--amber)', fontSize: 14, lineHeight: 1 },

  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: '0 0 10px 10px', zIndex: 100, overflow: 'hidden' },
  dropItem: { padding: '10px 16px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)', fontSize: 13 },
  dropItemName: { color: 'var(--text)', fontWeight: 500 },
  dropItemSub: { color: 'var(--muted)', fontSize: 11, marginTop: 1 },

  metaRow: { display: 'flex', margin: '0 20px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px' },
  metaPill: { flex: 1, padding: '10px 16px', borderRight: '0.5px solid var(--border)', cursor: 'default' },
  metaLabel: { fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  metaVal: { fontSize: 13, color: 'var(--text)', marginTop: 2 },

  searchBtn: { margin: '12px 20px 0', background: 'var(--amber)', border: 'none', borderRadius: 10, padding: 12, width: 'calc(100% - 40px)', color: '#0c0c0c', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500 },
  searchBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  sectionTitle: { padding: '28px 20px 10px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },

  card: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  cardHeader: { padding: '14px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  trainId: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' },
  trainName: { fontSize: 16, fontWeight: 500, marginTop: 2 },
  badge: { fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 8px', borderRadius: 6 },
  badgeGreen: { background: 'var(--green-dim)', color: 'var(--green)' },
  badgeAmber: { background: 'var(--amber-dim)', color: 'var(--amber)' },

  journeyRow: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 0 },
  stationBlock: { textAlign: 'left' },
  stationBlockRight: { textAlign: 'right' },
  stationTime: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, letterSpacing: -0.5 },
  stationName: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  journeyLine: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 12px' },
  duration: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 },
  lineTrack: { width: '100%', height: 1, background: 'var(--border2)' },
  changes: { fontSize: 11, color: 'var(--muted)', marginTop: 4 },

  cardFooter: { padding: '10px 16px', borderTop: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 },
  trackPill: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface2)', border: '0.5px solid var(--border2)', padding: '3px 8px', borderRadius: 5, color: 'var(--text)' },
  logBtn: { marginLeft: 'auto', background: 'var(--amber)', border: 'none', borderRadius: 8, padding: '6px 14px', color: '#0c0c0c', fontSize: 13, fontWeight: 500 },

  legs: { borderTop: '0.5px solid var(--border)' },
  legRow: { padding: '10px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' },
  legIcon: { fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--surface2)', padding: '3px 7px', borderRadius: 4, color: 'var(--amber)', flexShrink: 0, marginTop: 1 },
  legInfo: { flex: 1 },
  legStations: { fontSize: 13, color: 'var(--text)' },
  legTime: { fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--mono)' },

  err: { margin: '16px 20px', padding: '12px 16px', background: 'var(--red-dim)', border: '0.5px solid var(--red)', borderRadius: 10, fontSize: 13, color: 'var(--red)' },
  spinner: { margin: '32px auto', width: 24, height: 24, border: '2px solid var(--border2)', borderTop: '2px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
}

function StationInput({ label, value, onChange, onSelect, placeholder }) {
  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { setQuery(value?.name || '') }, [value])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    onChange(null)
    clearTimeout(timer.current)
    if (q.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      try {
        const r = await searchStations(q)
        setResults(r)
        setOpen(r.length > 0)
      } catch { setResults([]); setOpen(false) }
    }, 300)
  }

  function pick(station) {
    setQuery(station.name)
    setResults([])
    setOpen(false)
    onSelect(station)
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={s.label}>{label}</span>
        <input
          ref={inputRef}
          style={s.input}
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && (
        <div style={s.dropdown}>
          {results.map(r => (
            <div key={r.id} style={s.dropItem} onMouseDown={() => pick(r)}>
              <div style={s.dropItemName}>{r.name}</div>
              {r.location?.city && <div style={s.dropItemSub}>{r.location.city}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LegLine({ leg }) {
  const name = leg.line?.name || leg.line?.fahrtNr || '?'
  const dep = formatTime(leg.plannedDeparture || leg.departure)
  const arr = formatTime(leg.plannedArrival || leg.arrival)
  const from = leg.origin?.name || '?'
  const to = leg.destination?.name || '?'
  return (
    <div style={s.legRow}>
      <span style={s.legIcon}>{name}</span>
      <div style={s.legInfo}>
        <div style={s.legStations}>{from} → {to}</div>
        <div style={s.legTime}>{dep} – {arr}</div>
      </div>
    </div>
  )
}

export default function SearchView({ onLog }) {
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [journeys, setJourneys] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  function swap() {
    const tmp = from
    setFrom(to)
    setTo(tmp)
    setJourneys([])
  }

  async function search() {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    setJourneys([])
    try {
      const results = await searchJourneys(from.id, to.id, date)
      setJourneys(results)
      if (results.length === 0) setError('Keine Verbindungen gefunden.')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function buildTripData(journey, legIndex) {
    const legs = getLegs(journey)
    const leg = legs[legIndex] || legs[0]
    if (!leg) return null
    const depPlanned = leg.plannedDeparture || leg.departure
    const arrPlanned = leg.plannedArrival || leg.arrival
    const depActual = leg.departure
    const arrActual = leg.arrival
    const durationMin = Math.round((new Date(arrPlanned) - new Date(depPlanned)) / 60000)
    const delayArrMin = calcDelayMin(arrPlanned, arrActual)
    return {
      from: leg.origin?.name || from?.name,
      to: leg.destination?.name || to?.name,
      fromId: leg.origin?.id || from?.id,
      toId: leg.destination?.id || to?.id,
      depPlanned,
      arrPlanned,
      depActual,
      arrActual,
      durationMin,
      delayArrMin,
      trainType: leg.line?.product?.toUpperCase() || 'ICE',
      trainName: leg.line?.name || '?',
      tripId: leg.tripId,
      stopovers: leg.stopovers || [],
      changes: journeyChanges(journey),
      distanceKm: 0,
    }
  }

  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={s.header}>
        <div style={s.logo}>zugly <span style={s.logoSub}>DE</span></div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          <span style={s.liveDot} />live
        </div>
      </div>

      <div style={s.searchBox}>
        <div style={s.row}>
          <StationInput label="VON" value={from} onChange={setFrom} onSelect={setFrom} placeholder="Abfahrtsbahnhof" />
          <button style={s.swapBtn} onClick={swap}>⇅</button>
        </div>
        <div style={s.rowLast}>
          <StationInput label="NACH" value={to} onChange={setTo} onSelect={setTo} placeholder="Zielbahnhof" />
        </div>
      </div>

      <div style={s.metaRow}>
        <div style={s.metaPill}>
          <div style={s.metaLabel}>DATUM & ZEIT</div>
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--sans)', fontSize: 13, marginTop: 2, width: '100%', cursor: 'pointer' }}
          />
        </div>
        <div style={{ ...s.metaPill, borderRight: 'none' }}>
          <div style={s.metaLabel}>API</div>
          <div style={s.metaVal}>DB Echtzeit</div>
        </div>
      </div>

      <button
        style={{ ...s.searchBtn, ...((!from || !to) ? s.searchBtnDisabled : {}) }}
        onClick={search}
        disabled={!from || !to || loading}
      >
        {loading ? 'Suche läuft…' : 'Verbindungen suchen'}
      </button>

      {error && <div style={s.err}>{error}</div>}

      {loading && <div style={s.spinner} />}

      {journeys.length > 0 && (
        <>
          <div style={s.sectionTitle}>Verbindungen — {from?.name?.split('(')[0].trim()} → {to?.name?.split('(')[0].trim()}</div>
          {journeys.map((journey, ji) => {
            const legs = getLegs(journey)
            const firstLeg = legs[0]
            const lastLeg = legs[legs.length - 1]
            if (!firstLeg || !lastLeg) return null
            const dep = formatTime(firstLeg.plannedDeparture || firstLeg.departure)
            const arr = formatTime(lastLeg.plannedArrival || lastLeg.arrival)
            const dur = calcDuration(firstLeg.plannedDeparture, lastLeg.plannedArrival)
            const changes = journeyChanges(journey)
            const isOpen = expanded === ji

            return (
              <div key={ji} style={s.card}>
                <div style={{ ...s.cardHeader, cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : ji)}>
                  <div>
                    <div style={s.trainId}>
                      {legs.map(l => l.line?.name).filter(Boolean).join(' · ')}
                    </div>
                    <div style={s.trainName}>{firstLeg.origin?.name?.split('(')[0]} → {lastLeg.destination?.name?.split('(')[0]}</div>
                  </div>
                  <span style={changes === 0 ? s.badgeGreen : s.badgeAmber}>
                    {changes === 0 ? 'Direkt' : `${changes}× Umstieg`}
                  </span>
                </div>

                <div style={s.journeyRow}>
                  <div style={s.stationBlock}>
                    <div style={s.stationTime}>{dep}</div>
                    <div style={s.stationName}>{firstLeg.origin?.name?.split('(')[0]}</div>
                  </div>
                  <div style={s.journeyLine}>
                    <div style={s.duration}>{dur}</div>
                    <div style={s.lineTrack} />
                    <div style={s.changes}>{changes === 0 ? 'Direktzug' : `${changes} Umstieg${changes > 1 ? 'e' : ''}`}</div>
                  </div>
                  <div style={s.stationBlockRight}>
                    <div style={s.stationTime}>{arr}</div>
                    <div style={{ ...s.stationName, textAlign: 'right' }}>{lastLeg.destination?.name?.split('(')[0]}</div>
                  </div>
                </div>

                {isOpen && (
                  <div style={s.legs}>
                    {legs.map((leg, li) => <LegLine key={li} leg={leg} />)}
                  </div>
                )}

                <div style={s.cardFooter}>
                  <span style={s.trackPill}>Gl. {firstLeg.departurePlatform || '?'}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {legs.map(l => l.line?.product?.toUpperCase()).filter(Boolean).join('+')}
                  </span>
                  <button style={s.logBtn} onClick={() => onLog(buildTripData(journey, 0))}>
                    + Fahrt loggen
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
