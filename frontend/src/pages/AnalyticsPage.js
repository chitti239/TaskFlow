import { useOutletContext } from 'react-router-dom';
import { useMemo } from 'react';
import styles from '../styles/AnalyticsPage.module.css';

function getMiniBar(value, max, color) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className={styles.miniBarTrack}>
      <div className={styles.miniBarFill} style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function DonutChart({ segments, size = 140, thickness = 24, label, sub }) {
  const r = (size / 2) - thickness / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s, x) => s + x.value, 0);

  return (
    <div className={styles.donutWrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {total === 0 ? (
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
        ) : (
          segments.map((seg, i) => {
            const dash = (seg.value / total) * circ;
            const gap = circ - dash;
            const el = (
              <circle key={i} cx={size/2} cy={size/2} r={r}
                fill="none" stroke={seg.color} strokeWidth={thickness}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size/2} ${size/2})`}
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            );
            offset += dash;
            return el;
          })
        )}
      </svg>
      <div className={styles.donutCenter}>
        <div className={styles.donutLabel}>{label}</div>
        {sub && <div className={styles.donutSub}>{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className={styles.barChart}>
      {data.map((d, i) => (
        <div key={i} className={styles.barCol}>
          <div className={styles.barTrack}>
            <div className={styles.barFill}
              style={{ height: `${(d.value / max) * 100}%`, background: d.color || 'var(--accent)' }}
            />
          </div>
          <div className={styles.barVal}>{d.value}</div>
          <div className={styles.barLabel}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: accent + '18', color: accent }}>{icon}</div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

const COLORS = ['#3570d4','#d95a2e','#27a05a','#b87a14','#9b59b6','#e91e8c','#0891b2','#64748b'];

export default function AnalyticsPage() {
  const { tasks, streak } = useOutletContext();

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.done);
    const pending = tasks.filter(t => !t.done);
    const total = tasks.length;

    // Completion rate
    const completionRate = total ? Math.round((done.length / total) * 100) : 0;

    // By subject
    const subjectMap = {};
    tasks.forEach(t => {
      const s = t.subject || 'Unassigned';
      if (!subjectMap[s]) subjectMap[s] = { total: 0, done: 0 };
      subjectMap[s].total++;
      if (t.done) subjectMap[s].done++;
    });
    const subjects = Object.entries(subjectMap)
      .map(([name, d], i) => ({ name, ...d, color: COLORS[i % COLORS.length] }))
      .sort((a, b) => b.total - a.total);

    // Weekly completion (last 7 days)
    const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0,0,0,0);
      const count = done.filter(t => {
        const td = new Date(t.updatedAt); td.setHours(0,0,0,0);
        return td.getTime() === d.getTime();
      }).length;
      return { label: dayLabels[d.getDay()], value: count, color: i === 6 ? 'var(--accent)' : '#3570d4' };
    });

    // By importance
    const highImp = tasks.filter(t => t.importance === 'high');
    const lowImp  = tasks.filter(t => t.importance !== 'high');

    // Tags
    const tagMap = {};
    tasks.forEach(t => (t.tags||[]).forEach(g => { tagMap[g] = (tagMap[g]||0) + 1; }));
    const topTags = Object.entries(tagMap).sort((a,b) => b[1]-a[1]).slice(0, 8);

    // Average priority score
    const avgScore = total ? Math.round(tasks.reduce((s,t) => s + (t.priorityScore||0), 0) / total) : 0;

    return { done, pending, total, completionRate, subjects, weekly, highImp, lowImp, topTags, avgScore };
  }, [tasks]);

  const donutSegments = [
    { value: stats.done.length,    color: '#22c55e', label: 'Done' },
    { value: stats.pending.length, color: 'var(--border)', label: 'Pending' },
  ];

  const importanceSegments = [
    { value: stats.highImp.length, color: '#d95a2e', label: 'High' },
    { value: stats.lowImp.length,  color: '#3570d4', label: 'Low' },
  ];

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>📊 Analytics</h1>
        <p className={styles.sub}>Your productivity at a glance</p>
      </div>

      {/* Top stat cards */}
      <div className={styles.statCards}>
        <StatCard icon="✅" label="Tasks Completed" value={stats.done.length} sub={`of ${stats.total} total`} accent="#22c55e" />
        <StatCard icon="🔥" label="Current Streak"  value={`${streak}d`}     sub="consecutive days"           accent="#f97316" />
        <StatCard icon="⚡" label="Avg Priority"    value={stats.avgScore}   sub="priority score"              accent="#3570d4" />
        <StatCard icon="📈" label="Completion Rate" value={`${stats.completionRate}%`} sub="all time"          accent="#9b59b6" />
      </div>

      {/* Row 1: Donuts + Weekly bar */}
      <div className={styles.row}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>Task Status</div>
          <div className={styles.donutRow}>
            <DonutChart
              segments={donutSegments}
              label={`${stats.completionRate}%`}
              sub="done"
            />
            <div className={styles.legend}>
              {donutSegments.map((s, i) => (
                <div key={i} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className={styles.legendVal}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>Importance Split</div>
          <div className={styles.donutRow}>
            <DonutChart
              segments={importanceSegments}
              label={stats.highImp.length}
              sub="high priority"
            />
            <div className={styles.legend}>
              {importanceSegments.map((s, i) => (
                <div key={i} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className={styles.legendVal}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardWide}`}>
          <div className={styles.cardTitle}>Completed This Week</div>
          <BarChart data={stats.weekly} />
        </div>
      </div>

      {/* Row 2: Subject breakdown */}
      {stats.subjects.length > 0 && (
        <div className={styles.card} style={{ marginBottom: '1rem' }}>
          <div className={styles.cardTitle}>By Subject</div>
          <div className={styles.subjectList}>
            {stats.subjects.map((s, i) => (
              <div key={i} className={styles.subjectRow}>
                <div className={styles.subjectDot} style={{ background: s.color }} />
                <div className={styles.subjectName}>{s.name}</div>
                <div className={styles.subjectNums}>{s.done}/{s.total}</div>
                {getMiniBar(s.done, s.total, s.color)}
                <div className={styles.subjectPct}>{s.total ? Math.round((s.done/s.total)*100) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags cloud */}
      {stats.topTags.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>Top Tags</div>
          <div className={styles.tagCloud}>
            {stats.topTags.map(([tag, count], i) => (
              <span key={i} className={styles.tagPill}
                style={{ fontSize: `${Math.max(12, Math.min(18, 12 + count * 2))}px`, background: COLORS[i % COLORS.length] + '18', color: COLORS[i % COLORS.length], borderColor: COLORS[i % COLORS.length] + '40' }}>
                #{tag} <em>{count}</em>
              </span>
            ))}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p>No data yet — add some tasks and come back here!</p>
        </div>
      )}
    </div>
  );
}
