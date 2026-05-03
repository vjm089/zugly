import { computeStats } from '../store.js'

const s = {
  wrap: { padding: '0 0 40px' },
  header: { padding: '20px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 20px 20px' },
  metaCard: { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' },
  metaLabel: { fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 6 },
  metaValue: { fontSize: 28, fontWeight: 500, fontFamily: 'var(--mono)', letterSpacing: -1 },
  metaSub: { fontSize: 11, color: 'var(--muted)', marginTop: 4 },
  sectionTitle: { padding: '8px 20px 12px', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', letterSpacing: 0.5, textTransform: 'uppercase' },
  barCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  barLabel: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--amber)', width: 60, flexShrink: 0 },
  barTrack: { flex: 1, height: 4, background: 'var(--border2)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', background: 'var(--amber)', borderRadius: 2 },
  barCount: { fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', width: 24, textAlign: 'right' },
  achievementCard: { margin: '0 20px 8px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 },
  achIcon: { fontSize: 28, flexShrink: 0 },
  achTitle: { fontSize: 14, fontWeight: 500 },
  achSub: { fontSize: 12, color: 'var(--muted)', marginTop: 2 },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 },
}

function getAchievements(stats) {
  const list = []
  if (stats.count >= 1) list.push({ icon: '🚆', title: 'Erste Fahrt', sub: 'Willkommen an Bord!' })
  if (stats.count >= 10) list.push({ icon: '🏅', title: '10 Fahrten', sub: 'Echter Bahnpendler' })
  if (stats.count >= 50) list.push({ icon: '🥇', title: '50 Fahrten', sub: 'Bahnexperte' })
  if (stats.totalKm >= 1000) list.push({ icon: '📍', title: '1.000 km', sub: 'Quer durch Deutschland' })
  if (stats.totalKm >= 10000) list.push({ icon: '🌍', title: '10.000 km', sub: 'Europareisender' })
  if (stats.delayed === 0 && stats.count > 0) list.push({ icon: '⏱️', title: 'Immer pünktlich', sub: 'Kein einziger Delay' })
  return list
}

export default function StatsView({ trips }) {
  const stats = computeStats(trips)
  const achievements = getAchievements(stats)
  const maxByType = Math.max(...Object.values(stats.byType), 1)
  const totalHours = Math.floor(stats.totalMin / 60)
  const totalMins = stats.totalMin % 60
  const onTimeRate = stats.count > 0 ? Math.round((stats.onTime / stats.count) * 100) : 0

  if (trips.length === 0) {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Statistiken</span></div>
        </div>
        <div style={s.empty}>Noch keine Fahrten für Statistiken vorhanden.</div>
      </div>
    )
  }

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.logo}>zugly <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 400, marginLeft: 8 }}>Statistiken</span></div>
      </div>

      <div style={s.grid}>
        <div style={s.metaCard}>
          <div style={s.metaLabel}>FAHRTEN</div>
          <div style={s.metaValue}>{stats.count}</div>
          <div style={s.metaSub}>gesamt</div>
        </div>
        <div style={s.metaCard}>
          <div style={s.metaLabel}>KILOMETER</div>
          <div style={s.metaValue}>{stats.totalKm.toLocaleString('de-DE')}</div>
          <div style={s.metaSub}>gefahren</div>
        </div>
        <div style={s.metaCard}>
          <div style={s.metaLabel}>FAHRZEIT</div>
          <div style={s.metaValue}>{totalHours}<span style={{ fontSize: 14 }}>h</span></div>
          <div style={s.metaSub}>{totalMins} Minuten</div>
        </div>
        <div style={s.metaCard}>
          <div style={s.metaLabel}>PÜNKTLICH</div>
          <div style={{ ...s.metaValue, color: onTimeRate >= 70 ? 'var(--green)' : 'var(--red)' }}>{onTimeRate}<span style={{ fontSize: 14 }}>%</span></div>
          <div style={s.metaSub}>{stats.onTime} von {stats.count}</div>
        </div>
      </div>

      {Object.keys(stats.byType).length > 0 && (
        <>
          <div style={s.sectionTitle}>Zugtypen</div>
          <div style={s.barCard}>
            {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} style={s.barRow}>
                <span style={s.barLabel}>{type}</span>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${(count / maxByType) * 100}%` }} />
                </div>
                <span style={s.barCount}>{count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {achievements.length > 0 && (
        <>
          <div style={s.sectionTitle}>Errungenschaften</div>
          {achievements.map((a, i) => (
            <div key={i} style={s.achievementCard}>
              <span style={s.achIcon}>{a.icon}</span>
              <div>
                <div style={s.achTitle}>{a.title}</div>
                <div style={s.achSub}>{a.sub}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
