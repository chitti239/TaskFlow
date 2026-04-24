import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../styles/CommonPage.module.css';

export default function SubjectsPage() {
  const { tasks, updateTask, deleteTask } = useOutletContext();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const active = params.get('s');

  const subjects = [...new Set(tasks.filter(t=>t.subject).map(t=>t.subject))];

  if(active) {
    const subTasks = tasks.filter(t=>t.subject===active);
    return (
      <div>
        <button className={styles.backBtn} onClick={()=>navigate('/subjects')}>← All subjects</button>
        <h1 className={styles.title}>📚 {active}</h1>
        <p className={styles.sub}>{subTasks.filter(t=>!t.done).length} pending · {subTasks.filter(t=>t.done).length} done</p>
        <div className={styles.list}>
          {subTasks.map(t=>(
            <div key={t._id} className={`${styles.taskRow} ${t.done?styles.taskDone:''}`} onClick={()=>navigate(`/tasks/${t._id}`)}>
              <input type="checkbox" className={styles.check} checked={t.done} onChange={e=>{e.stopPropagation();updateTask(t._id,{done:!t.done});}} onClick={e=>e.stopPropagation()}/>
              <div className={styles.taskBody}>
                <div className={styles.taskText}>{t.text}</div>
                <div className={styles.taskMeta}>{t.dueDate&&<span className={styles.chip}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className={styles.title}>📚 By Subject</h1>
      <p className={styles.sub}>{subjects.length} subject{subjects.length!==1?'s':''}</p>
      {subjects.length===0?<div className={styles.empty}>No subjects yet. Add tasks with a subject field.</div>:(
        <div className={styles.subjectGrid}>
          {subjects.map(sub=>{
            const all=tasks.filter(t=>t.subject===sub);
            const done=all.filter(t=>t.done).length;
            const pct=Math.round((done/Math.max(all.length,1))*100);
            return (
              <div key={sub} className={styles.subjectCard} onClick={()=>navigate(`/subjects?s=${encodeURIComponent(sub)}`)}>
                <div className={styles.subjectName}>{sub}</div>
                <div className={styles.subjectStats}>{all.length-done} pending · {done} done</div>
                <div className={styles.subjectBar}><div className={styles.subjectFill} style={{width:`${pct}%`}}/></div>
                <div className={styles.subjectPct}>{pct}% complete</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
