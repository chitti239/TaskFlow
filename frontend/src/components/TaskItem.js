import { useNavigate } from 'react-router-dom';
import styles from '../styles/TaskItem.module.css';

function formatDue(dueDate) {
  if (!dueDate) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)  return 'Overdue';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff} days`;
}

function isOverdueFn(dueDate, done) {
  if (!dueDate || done) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(dueDate) < today;
}

export default function TaskItem({ task, onToggle, onDelete }) {
  const navigate = useNavigate();
  const overdue = isOverdueFn(task.dueDate, task.done);
  const doneCount = task.subtasks ? task.subtasks.filter(s => s.done).length : 0;
  const totalSub  = task.subtasks ? task.subtasks.length : 0;

  return (
    <div className={`${styles.item} ${task.done ? styles.done : ''}`}>
      <input
        type="checkbox"
        className={styles.check}
        checked={task.done}
        onChange={() => onToggle(task._id, task.done)}
      />
      <div className={styles.body} onClick={() => navigate(`/tasks/${task._id}`)}>
        <span className={styles.name}>{task.text}</span>
        <div className={styles.meta}>
          {task.dueDate && (
            <span className={`${styles.due} ${overdue ? styles.overdueDue : ''}`}>{formatDue(task.dueDate)}</span>
          )}
          {task.subject && <span className={styles.tag}>{task.subject}</span>}
          {task.tags && task.tags.map(t => <span key={t} className={styles.tag}>#{t}</span>)}
          {totalSub > 0 && (
            <span className={styles.subtaskPill}>{doneCount}/{totalSub} subtasks</span>
          )}
        </div>
        {totalSub > 0 && (
          <div className={styles.subBar}>
            <div className={styles.subBarFill} style={{ width: `${Math.round((doneCount/totalSub)*100)}%` }} />
          </div>
        )}
      </div>
      <button className={styles.del} onClick={() => onDelete(task._id)} title="Delete">×</button>
    </div>
  );
}
