import styles from '../styles/WeeklyReportModal.module.css';

export default function WeeklyReportModal({ tasks, streak, onClose }) {
  const now = new Date();
  const weekAgo = new Date(now - 7*86400000);
  const lastWeekAgo = new Date(now - 14*86400000);

  const thisWeek = tasks.filter(t=>t.done&&new Date(t.updatedAt)>=weekAgo);
  const lastWeek = tasks.filter(t=>t.done&&new Date(t.updatedAt)>=lastWeekAgo&&new Date(t.updatedAt)<weekAgo);

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dayCounts = days.map((d,i)=>({ day:d, count:thisWeek.filter(t=>new Date(t.updatedAt).getDay()===i).length }));
  const bestDay = dayCounts.reduce((a,b)=>a.count>=b.count?a:b);

  const subjects = [...new Set(thisWeek.filter(t=>t.subject).map(t=>t.subject))];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>📊 Weekly Report</h2>
          <p>Here's how your week went!</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statVal}>{thisWeek.length}</div>
            <div className={styles.statLabel}>Tasks done</div>
            {lastWeek.length>0&&<div className={styles.statDiff}>{thisWeek.length>=lastWeek.length?'▲':'▼'} vs {lastWeek.length} last week</div>}
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>🔥{streak}</div>
            <div className={styles.statLabel}>Day streak</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>{bestDay.count>0?bestDay.day:'—'}</div>
            <div className={styles.statLabel}>Best day</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statVal}>{subjects.length}</div>
            <div className={styles.statLabel}>Subjects</div>
          </div>
        </div>

        {subjects.length>0&&(
          <div className={styles.subjects}>
            <div className={styles.subLabel}>Subjects covered this week</div>
            <div className={styles.subList}>{subjects.map(s=><span key={s} className={styles.subChip}>{s}</span>)}</div>
          </div>
        )}

        <div className={styles.bars}>
          {dayCounts.map(({day,count})=>(
            <div key={day} className={styles.bar}>
              <div className={styles.barFill} style={{height:`${count>0?Math.max((count/Math.max(...dayCounts.map(d=>d.count),1))*60,8):0}px`}}/>
              <div className={styles.barDay}>{day}</div>
              {count>0&&<div className={styles.barCount}>{count}</div>}
            </div>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close report</button>
      </div>
    </div>
  );
}
