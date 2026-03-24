import styles from '../styles/StatsBar.module.css';

export default function StatsBar({ tasks, quadrantQ1 }) {
  const total = tasks.filter(t => !t.done).length;
  const done  = tasks.filter(t => t.done).length;
  const urgent = quadrantQ1.filter(t => !t.done).length;
  const pct  = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.card}><div className={styles.label}>Pending</div><div className={styles.value}>{total}</div></div>
        <div className={styles.card}><div className={styles.label}>Do first</div><div className={styles.value}>{urgent}</div></div>
        <div className={styles.card}><div className={styles.label}>Completed</div><div className={styles.value}>{done}</div></div>
        <div className={styles.card}><div className={styles.label}>Progress</div><div className={styles.value}>{pct}%</div></div>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
