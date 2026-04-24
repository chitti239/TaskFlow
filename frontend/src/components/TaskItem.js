import { useNavigate } from 'react-router-dom';
import styles from '../styles/TaskItem.module.css';

function formatDue(dueDate) {
  if(!dueDate)return '';
  const today=new Date();today.setHours(0,0,0,0);
  const diff=Math.round((new Date(dueDate)-today)/86400000);
  if(diff<0)  return 'Overdue';
  if(diff===0) return 'Due today';
  if(diff===1) return 'Due tomorrow';
  return `Due in ${diff} days`;
}

function isOverdueFn(dueDate,done){ if(!dueDate||done)return false; const t=new Date();t.setHours(0,0,0,0); return new Date(dueDate)<t; }

export default function TaskItem({ task, onToggle, onDelete }) {
  const navigate = useNavigate();
  const overdue  = isOverdueFn(task.dueDate,task.done);
  const doneCount=(task.subtasks||[]).filter(s=>s.done).length;
  const totalSub =(task.subtasks||[]).length;

  return (
    <div className={`${styles.item} ${task.done?styles.done:''}`}>
      <input type="checkbox" className={styles.check} checked={task.done}
        onChange={()=>!overdue&&onToggle(task._id,task.done)}
        style={{cursor:overdue?'not-allowed':'pointer'}}
        title={overdue?'Update due date first':''}
      />
      <div className={styles.body} onClick={()=>navigate(`/tasks/${task._id}`)}>
        <span className={styles.name}>{task.text}</span>
        <div className={styles.meta}>
          {task.dueDate&&<span className={`${styles.due} ${overdue?styles.overdueDue:''}`}>{formatDue(task.dueDate)}</span>}
          {task.subject&&<span className={styles.tag}>{task.subject}</span>}
          {(task.tags||[]).map(t=><span key={t} className={styles.tag}>#{t}</span>)}
          {task.isRevision&&<span className={styles.revTag}>🔁</span>}
          {task.recurring!=='none'&&<span className={styles.tag}>🔄{task.recurring}</span>}
          {totalSub>0&&<span className={styles.subtaskPill}>{doneCount}/{totalSub}</span>}
          <span className={styles.score}>⚡{task.priorityScore}</span>
        </div>
        {totalSub>0&&<div className={styles.subBar}><div className={styles.subBarFill} style={{width:`${Math.round((doneCount/totalSub)*100)}%`}}/></div>}
      </div>
      <button className={styles.del} onClick={()=>onDelete(task._id)} title="Delete">×</button>
    </div>
  );
}
