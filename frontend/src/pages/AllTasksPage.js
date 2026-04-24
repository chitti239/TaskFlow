import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import styles from '../styles/CommonPage.module.css';

export default function AllTasksPage() {
  const { tasks, search, updateTask, deleteTask } = useOutletContext();
  const navigate = useNavigate();
  const [sort, setSort] = useState('priority');
  const [filter, setFilter] = useState('all');

  let list = tasks.filter(t=>{
    const ms = !search||t.text.toLowerCase().includes(search.toLowerCase())||(t.subject&&t.subject.toLowerCase().includes(search.toLowerCase()));
    if(filter==='done') return ms&&t.done;
    if(filter==='pending') return ms&&!t.done;
    return ms;
  });

  if(sort==='priority') list=[...list].sort((a,b)=>b.priorityScore-a.priorityScore);
  else if(sort==='due') list=[...list].sort((a,b)=>{ if(!a.dueDate)return 1; if(!b.dueDate)return -1; return new Date(a.dueDate)-new Date(b.dueDate); });
  else if(sort==='subject') list=[...list].sort((a,b)=>(a.subject||'').localeCompare(b.subject||''));

  return (
    <div>
      <h1 className={styles.title}>📋 All Tasks</h1>
      <div className={styles.toolbar}>
        <div className={styles.filterRow}>
          {['all','pending','done'].map(f=><button key={f} className={`${styles.filterBtn} ${filter===f?styles.filterActive:''}`} onClick={()=>setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
        </div>
        <select className={styles.sortSelect} value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="priority">Sort by Priority</option>
          <option value="due">Sort by Due Date</option>
          <option value="subject">Sort by Subject</option>
        </select>
      </div>
      <p className={styles.sub}>{list.length} task{list.length!==1?'s':''}</p>
      {list.length===0?<div className={styles.empty}>No tasks found.</div>:(
        <div className={styles.list}>
          {list.map(t=>(
            <div key={t._id} className={`${styles.taskRow} ${t.done?styles.taskDone:''}`} onClick={()=>navigate(`/tasks/${t._id}`)}>
              <input type="checkbox" className={styles.check} checked={t.done} onChange={e=>{e.stopPropagation();updateTask(t._id,{done:!t.done});}} onClick={e=>e.stopPropagation()}/>
              <div className={styles.taskBody}>
                <div className={styles.taskText}>{t.text}</div>
                <div className={styles.taskMeta}>
                  {t.dueDate&&<span className={styles.chip}>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                  {t.subject&&<span className={styles.chip}>{t.subject}</span>}
                  <span className={styles.score}>⚡{t.priorityScore}</span>
                  {t.recurring!=='none'&&<span className={styles.chip}>🔁{t.recurring}</span>}
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
