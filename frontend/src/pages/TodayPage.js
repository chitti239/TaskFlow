import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from '../styles/CommonPage.module.css';

function isDueToday(d){ if(!d)return false; const t=new Date();t.setHours(0,0,0,0); const due=new Date(d);due.setHours(0,0,0,0); return due.getTime()===t.getTime(); }

export default function TodayPage() {
  const { tasks, updateTask, deleteTask } = useOutletContext();
  const navigate = useNavigate();
  const today = tasks.filter(t=>isDueToday(t.dueDate)&&!t.done).sort((a,b)=>b.priorityScore-a.priorityScore);

  return (
    <div>
      <h1 className={styles.title}>📅 Today</h1>
      <p className={styles.sub}>{today.length} task{today.length!==1?'s':''} due today, sorted by priority</p>
      {today.length===0?(
        <div className={styles.empty}>🎉 Nothing due today!</div>
      ):(
        <div className={styles.list}>
          {today.map(t=>(
            <div key={t._id} className={styles.taskRow} onClick={()=>navigate(`/tasks/${t._id}`)}>
              <input type="checkbox" className={styles.check} checked={t.done} onChange={e=>{e.stopPropagation();updateTask(t._id,{done:!t.done});}} onClick={e=>e.stopPropagation()}/>
              <div className={styles.taskBody}>
                <div className={styles.taskText}>{t.text}</div>
                <div className={styles.taskMeta}>
                  {t.subject&&<span className={styles.chip}>{t.subject}</span>}
                  {t.tags&&t.tags.map(g=><span key={g} className={styles.chip}>#{g}</span>)}
                  <span className={styles.score}>⚡{t.priorityScore}</span>
                </div>
              </div>
              <button className={styles.del} onClick={e=>{e.stopPropagation();deleteTask(t._id);}}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
