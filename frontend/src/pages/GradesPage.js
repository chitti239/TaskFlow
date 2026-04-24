import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from '../styles/GradesPage.module.css';

export default function GradesPage() {
  const { tasks } = useOutletContext();
  const navigate  = useNavigate();
  const graded    = tasks.filter(t=>t.done&&t.grade!==null&&t.grade!==undefined);
  const subjects  = [...new Set(graded.filter(t=>t.subject).map(t=>t.subject))];

  const stats = subjects.map(sub=>{
    const s=graded.filter(t=>t.subject===sub);
    const avg=Math.round(s.reduce((a,t)=>a+t.grade,0)/s.length);
    const best=Math.max(...s.map(t=>t.grade));
    const worst=Math.min(...s.map(t=>t.grade));
    return {sub,count:s.length,avg,best,worst,tasks:s};
  });

  const ungrouped = graded.filter(t=>!t.subject);

  return (
    <div>
      <h1 className={styles.title}>📊 Grade Tracker</h1>
      <p className={styles.sub}>Track your scores across subjects</p>

      {graded.length===0?<div className={styles.empty}>No graded tasks yet. Open a completed task and add a grade score.</div>:(
        <>
          {stats.map(({sub,count,avg,best,worst,tasks:ts})=>(
            <div key={sub} className={styles.subjectBlock}>
              <div className={styles.subjectHeader}>
                <span className={styles.subjectName}>{sub}</span>
                <div className={styles.subjectStats}>
                  <span className={styles.statPill} style={{background:'#f0fff4',color:'#27a05a'}}>Avg {avg}%</span>
                  <span className={styles.statPill} style={{background:'#e8f0fe',color:'#3570d4'}}>Best {best}%</span>
                  <span className={styles.statPill} style={{background:'#fff0ee',color:'#d95a2e'}}>Worst {worst}%</span>
                </div>
              </div>
              <div className={styles.avgBar}><div className={styles.avgFill} style={{width:`${avg}%`,background:avg>=75?'#27a05a':avg>=50?'#b87a14':'#d95a2e'}}/></div>
              <div className={styles.taskList}>
                {ts.map(t=>(
                  <div key={t._id} className={styles.gradeRow} onClick={()=>navigate(`/tasks/${t._id}`)}>
                    <span className={styles.gradeTask}>{t.text}</span>
                    <span className={styles.gradeScore} style={{color:t.grade>=75?'#27a05a':t.grade>=50?'#b87a14':'#d95a2e'}}>{t.grade}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {ungrouped.length>0&&(
            <div className={styles.subjectBlock}>
              <div className={styles.subjectHeader}><span className={styles.subjectName}>Other</span></div>
              {ungrouped.map(t=>(
                <div key={t._id} className={styles.gradeRow} onClick={()=>navigate(`/tasks/${t._id}`)}>
                  <span className={styles.gradeTask}>{t.text}</span>
                  <span className={styles.gradeScore}>{t.grade}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
