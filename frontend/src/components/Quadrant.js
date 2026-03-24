import TaskItem from './TaskItem';
import styles from '../styles/Quadrant.module.css';

export default function Quadrant({ id, title, sub, tasks, onToggle, onDelete }) {
  return (
    <div className={`${styles.quadrant} ${styles[id]}`}>
      <div className={styles.header}>
        <div className={styles.dot} />
        <span className={styles.title}>{title}</span>
        <span className={styles.sub}>{sub}</span>
      </div>
      {tasks.length === 0 ? (
        <p className={styles.empty}>Nothing here</p>
      ) : (
        tasks.map(t => (
          <TaskItem key={t._id} task={t} onToggle={onToggle} onDelete={onDelete} />
        ))
      )}
    </div>
  );
}
