import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from '../styles/CommonPage.module.css';

export default function CompletedPage() {
  const { tasks, deleteTask } = useOutletContext();
  const navigate = useNavigate();
  const done = [...tasks.filter(t=>t.done)].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));

  const grouped = done.reduce((acc,t)=>{ const d=new Date(t.updatedAt).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); if(!acc[d])acc[d]=[]; acc[d].push(t); return acc; },{});

  return (
    <div>
      <h1 className={styles.title}>✅ Completed</h1>
      <p className={styles.sub}>{done.length} task{done.length!==1?'s':''} completed total</p>
      {done.length===0?<div className={styles.empty}>No completed tasks yet.</div>:(
        Object.entries(grouped).map(([date,items])=>(
          <div key={date} className={styles.group}>
            <div className={styles.groupDate}>{date}</div>
            {items.map(t=>(
              <div key={t._id} className={`${styles.taskRow} ${styles.taskDone}`} onClick={()=>navigate(`/tasks/${t._id}`)}>
                <span className={styles.doneCheck}>✓</span>
                <div className={styles.taskBody}>
                  <div className={styles.taskText}>{t.text}</div>
                  {t.subject&&<div className={styles.taskMeta}><span className={styles.chip}>{t.subject}</span>{t.grade!==null&&t.grade!==undefined&&<span className={styles.grade}>Grade: {t.grade}%</span>}</div>}
                </div>
                <button className={styles.del} onClick={e=>{e.stopPropagation();deleteTask(t._id);}}>×</button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
