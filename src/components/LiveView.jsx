import { useState, useEffect, useCallback } from 'react'
import { fetchLiveTrip, formatTime, calcDelayMin, getLiveProgress } from '../api.js'
import TrainMap from './TrainMap.jsx'

const s = {
  wrap: { minHeight: '100dvh', background: 'var(--bg)', padding: '0 0 40px' },
  header: { padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12, paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))' },
  backBtn: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: '0 16px', height: 44, color: 'var(--text)', fontSize: 15, flexShrink: 0 },
  logo: { fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 500, color: 'var(--amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '0 20px', gap: 16, textAlign: 'center' },
  spinner: { width: 28, height: 28, border: '2.5px solid var(--border2)', borderTop: '2.5px solid var(--amber)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  loadingText: { fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  errBox: { background: 'var(--red-dim)', border: '0.5px solid var(--red)', borderRadius: 12, padding: '16px 20px', width: '100%', maxWidth: 340 },
  errTitle: { fontSize: 15, fontWeight: 500, color: 'var(--red)', marginBottom: 6 },
  errText: { fontSize: 13, color: 'var(--red)', opacity: 0.8 },
  retryBtn: { background: 'var(--amber)', border: 'none', borderRadius: 10, padding: '12px 24px', color: '#080808', fontSize: 15, fontWeight: 500, marginTop: 8 },

  heroCard: { margin: '14px 16px 0', background: 'var(--surface)', border: '0.5px solid var(--border2)', borderRadius: 16, overflow: 'hidden' },
  heroTop: { padding: '16px 18px 14px', borderBottom: '0.5px solid var(--border)' },
  trainBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '4px 10px', borderRadius: 20, marginBottom: 10 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 },
  routeText: { fontSize: 18, fontWeight: 500, letterSpacing: -0.3 },
  delayRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  delayBadge: { fontFamily: 'var(--mono)', fontSize: 12, padding: '3px 9px', borderRadius: 20 },
  delayOk: { background: 'var(--green-dim)', color: 'var(--green)' },
  delayBad: { background: 'var(--red-dim)', color: 'var(--red)' },
  timesMuted: { fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' },

  progressWrap: { padding: '14px 18px', borderBottom: '0.5px solid var(--border)' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  progressLabelText: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  progressTrack: { width: '100%', height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--amber)', borderRadius: 2, transition: 'width 1s ease' },

  mapWrap: { padding: 12 },
  noMapBox: { margin: 12, height: 120, background: 'var(--surface2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  noMapText: { fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' },

  nextStop: { padding: '14px 18px', borderTop: '0.5px solid var(--border)' },
  nextLabel: { fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6, letterSpacing: 0.5 },
  nextName: { fontSize: 15, fontWeight: 500 },
  nextTime: { fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', marginTop: 2 },

  sectionTitle: { padding: '20px 16px 8px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  stopList: { margin: '0 16px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  stopRow: { display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '0.5px solid var(--border)', gap: 10 },
  stopRowLast: { display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 10 },
  dotCol: { width: 16, display: 'flex', justifyContent: 'center', flexShrink: 0 },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  dotPassed: { background: 'var(--green)' },
  dotCurrent: { background: 'var(--amber)', width: 10, height: 10 },
  dotFuture: { background: 'transparent', border: '1.5px solid var(--muted)' },
  stopName: { flex: 1, fontSize: 13 },
  stopNamePassed: { color: 'var(--muted)' },
  stopNameCurrent: { color: 'var(--amber)', fontWeight: 500 },
  stopNameFuture: { color: 'var(--text2)' },
  stopTimes: { textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 11 },
  stopTimePlanned: { color: 'var(--muted)' },
  stopTimeDelay: { color: 'var(--red)', fontSize: 10 },
  stopTrack: { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 },
  refreshRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 0', gap: 10 },
  refreshText: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' },
  refreshBtn: { background: 'var(--surface2)', border: '0.5px solid var(--border2)', borderRadius: 8, padding: '6px 14px', color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--mono)', height: 36 },
}

export default function LiveView({ trip, onBack }) {
  const [liveData, setLiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(30)

  const load = useCallback(async () => {
    if (!trip?.tripId) {
      setError('Kein Live-Tracking für diesen Zug verfügbar.')
      setLoading(false)
      return
    }
    try {
      setError(null)
      const data = await fetchLiveTrip(trip.tripId)
      setLiveData(data)
      setCountdown(30)
    } catch (e) {
      setError('Live-Daten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [trip?.tripId])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(load, 30000); return () => clearInterval(t) }, [load])
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [liveData])

  const stopovers = liveData?.stopovers || []
  const progress = getLiveProgress(stopovers)
  const currentIdx = progress?.currentIdx ?? -1
  const progressPct = stopovers.length > 1
    ? Math.round(Math.max(0, currentIdx) / (stopovers.length - 1) * 100)
    : 0
  const nextStop = stopovers[currentIdx + 1]
  const arrivalDelay = calcDelayMin(liveData?.plannedArrival || trip?.arrPlanned, liveData?.arrival || trip?.arrActual)
  const trainName = liveData?.line?.name || trip?.trainName || '?'
  const destination = liveData?.destination?.name || trip?.to || '?'
  const origin = liveData?.origin?.name || trip?.from || '?'

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Zurück</button>
        <span style={s.logo}>{trainName} · live</span>
      </div>

      {loading && (
        <div style={s.centerBox}>
          <div style={s.spinner} />
          <div style={s.loadingText}>Live-Daten werden geladen…</div>
        </div>
      )}

      {!loading && error && (
        <div style={s.centerBox}>
          <div style={s.errBox}>
            <div style={s.errTitle}>Kein Live-Status</div>
            <div style={s.errText}>{error}</div>
          </div>
          <button style={s.retryBtn} onClick={load}>Erneut versuchen</button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={s.heroCard}>
            <div style={s.heroTop}>
              <div style={s.trainBadge}>
                <span style={s.liveDot} />
                {trainName}
              </div>
              <div style={s.routeText}>
                {origin.split('(')[0].trim()} → {destination.split('(')[0].trim()}
              </div>
              <div style={s.delayRow}>
                <span style={arrivalDelay <= 5 ? { ...s.delayBadge, ...s.delayOk } : { ...s.delayBadge, ...s.delayBad }}>
                  {arrivalDelay <= 0 ? 'Pünktlich' : arrivalDelay <= 5 ? 'Fast pünktlich' : `+${arrivalDelay} Min`}
                </span>
                <span style={s.timesMuted}>
                  Ankunft {formatTime(liveData?.plannedArrival || trip?.arrPlanned)}
                  {arrivalDelay > 5 ? ` → ${formatTime(liveData?.arrival || trip?.arrActual)}` : ''}
                </span>
              </div>
            </div>

            <div style={s.progressWrap}>
              <div style={s.progressLabel}>
                <span style={s.progressLabelText}>{origin.split('(')[0].trim()}</span>
                <span style={{ ...s.progressLabelText, color: 'var(--amber)' }}>{progressPct}%</span>
                <span style={s.progressLabelText}>{destination.split('(')[0].trim()}</span>
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
              </div>
            </div>

            <div style={s.mapWrap}>
              {stopovers.length > 0
                ? <TrainMap stopovers={stopovers} polyline={liveData?.polyline} currentIdx={currentIdx} />
                : <div style={s.noMapBox}><span style={s.noMapText}>Kartendaten nicht verfügbar</span></div>
              }
            </div>

            {nextStop && (
              <div style={s.nextStop}>
                <div style={s.nextLabel}>NÄCHSTER HALT</div>
                <div style={s.nextName}>{nextStop.stop?.name}</div>
                <div style={s.nextTime}>
                  {formatTime(nextStop.plannedArrival || nextStop.arrival)}
                  {calcDelayMin(nextStop.plannedArrival, nextStop.arrival) > 2
                    ? ` · +${calcDelayMin(nextStop.plannedArrival, nextStop.arrival)} Min`
                    : ' · pünktlich'}
                  {nextStop.arrivalPlatform ? ` · Gl. ${nextStop.arrivalPlatform}` : ''}
                </div>
              </div>
            )}
          </div>

          {stopovers.length > 0 && (
            <>
              <div style={s.sectionTitle}>Alle Halte</div>
              <div style={s.stopList}>
                {stopovers.map((sv, i) => {
                  const state = i < currentIdx ? 'passed' : i === currentIdx ? 'current' : 'future'
                  const delay = calcDelayMin(sv.plannedArrival, sv.arrival) || calcDelayMin(sv.plannedDeparture, sv.departure)
                  const isLast = i === stopovers.length - 1
                  return (
                    <div key={i} style={isLast ? s.stopRowLast : s.stopRow}>
                      <div style={s.dotCol}>
                        <div style={{ ...s.dot, ...(state === 'passed' ? s.dotPassed : state === 'current' ? s.dotCurrent : s.dotFuture) }} />
                      </div>
                      <div style={{ ...s.stopName, ...(state === 'passed' ? s.stopNamePassed : state === 'current' ? s.stopNameCurrent : s.stopNameFuture) }}>
                        {sv.stop?.name}
                      </div>
                      {sv.arrivalPlatform && <span style={s.stopTrack}>Gl. {sv.arrivalPlatform}</span>}
                      <div style={s.stopTimes}>
                        <div style={s.stopTimePlanned}>{formatTime(sv.plannedArrival || sv.plannedDeparture)}</div>
                        {delay > 2 && <div style={s.stopTimeDelay}>+{delay} Min</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div style={s.refreshRow}>
            <span style={s.refreshText}>
              {countdown > 0 ? `Aktualisierung in ${countdown}s` : 'Wird aktualisiert…'}
            </span>
            <button style={s.refreshBtn} onClick={load}>Jetzt</button>
          </div>
        </>
      )}
    </div>
  )
}
