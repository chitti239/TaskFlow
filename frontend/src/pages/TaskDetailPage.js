import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/TaskDetailPage.module.css';

const BASE = 'http://localhost:5000/api';

function formatDate(d) { if(!d)return 'No due date'; return new Date(d).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }

function getStatus(dueDate,done) {
  if(done) return {label:'Completed ✓',cls:'done'};
  if(!dueDate) return {label:'No due date',cls:'none'};
  const today=new Date();today.setHours(0,0,0,0);
  const diff=Math.round((new Date(dueDate)-today)/86400000);
  if(diff<0)  return {label:'Overdue',cls:'overdue'};
  if(diff===0) return {label:'Due today',cls:'today'};
  if(diff===1) return {label:'Due tomorrow',cls:'soon'};
  return {label:`Due in ${diff} days`,cls:'upcoming'};
}

function isTaskOverdue(dueDate,done){ if(!dueDate||done)return false; const t=new Date();t.setHours(0,0,0,0); return new Date(dueDate)<t; }

function Pomodoro({ onSessionComplete }) {
  const WORK=25*60,BREAK=5*60;
  const [timeLeft,setTimeLeft]=useState(WORK);
  const [running,setRunning]=useState(false);
  const [isBreak,setIsBreak]=useState(false);
  const [sessions,setSessions]=useState(0);
  const ref=useRef(null);
  useEffect(()=>{
    if(running){ ref.current=setInterval(()=>{setTimeLeft(t=>{ if(t<=1){ clearInterval(ref.current);setRunning(false); if(!isBreak){setSessions(s=>s+1);setIsBreak(true);setTimeLeft(BREAK);onSessionComplete&&onSessionComplete();}else{setIsBreak(false);setTimeLeft(WORK);}return 0;} return t-1; });},1000); }
    return()=>clearInterval(ref.current);
  },[running,isBreak]);
  const mins=String(Math.floor(timeLeft/60)).padStart(2,'0');
  const secs=String(timeLeft%60).padStart(2,'0');
  const pct=isBreak?((BREAK-timeLeft)/BREAK)*100:((WORK-timeLeft)/WORK)*100;
  return (
    <div className={styles.pomodoro}>
      <div className={styles.pomLabel}>{isBreak?'☕ Break':'🎯 Focus'} · {sessions} done</div>
      <div className={styles.pomRing}>
        <svg viewBox="0 0 80 80" className={styles.pomSvg}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="5"/>
          <circle cx="40" cy="40" r="34" fill="none" stroke={isBreak?'#27a05a':'var(--accent)'} strokeWidth="5"
            strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`}
            strokeLinecap="round" transform="rotate(-90 40 40)" style={{transition:'stroke-dashoffset 0.9s linear'}}/>
        </svg>
        <div className={styles.pomTime}>{mins}:{secs}</div>
      </div>
      <div className={styles.pomBtns}>
        <button className={styles.pomBtn} onClick={()=>setRunning(r=>!r)}>{running?'Pause':'Start'}</button>
        <button className={styles.pomBtnSm} onClick={()=>{setRunning(false);setTimeLeft(isBreak?BREAK:WORK);}}>Reset</button>
        <button className={styles.pomBtnSm} onClick={()=>{setRunning(false);if(!isBreak){setSessions(s=>s+1);setIsBreak(true);setTimeLeft(BREAK);}else{setIsBreak(false);setTimeLeft(WORK);}}}>Skip</button>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const {id}=useParams(); const navigate=useNavigate();
  const [task,setTask]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [showDelete,setShowDelete]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [showOverdue,setShowOverdue]=useState(false);
  const [showRevision,setShowRevision]=useState(false);
  const [confetti,setConfetti]=useState(false);
  const [editText,setEditText]=useState('');
  const [editDue,setEditDue]=useState('');
  const [editImp,setEditImp]=useState('high');
  const [editSubject,setEditSubject]=useState('');
  const [editTags,setEditTags]=useState('');
  const [editNotes,setEditNotes]=useState('');
  const [editGrade,setEditGrade]=useState('');
  const [saving,setSaving]=useState(false);
  const [newSubtask,setNewSubtask]=useState('');
  const token=localStorage.getItem('tf_token');
  const headers={Authorization:`Bearer ${token}`};

  useEffect(()=>{
    axios.get(`${BASE}/tasks/${id}`,{headers}).then(r=>{
      setTask(r.data);setEditText(r.data.text);setEditDue(r.data.dueDate?r.data.dueDate.split('T')[0]:'');
      setEditImp(r.data.importance);setEditSubject(r.data.subject||'');setEditTags((r.data.tags||[]).join(', '));
      setEditNotes(r.data.notes||'');setEditGrade(r.data.grade!==null&&r.data.grade!==undefined?String(r.data.grade):'');
    }).catch(()=>setError('Task not found.')).finally(()=>setLoading(false));
  },[id]);

  const handleDelete=async()=>{ await axios.delete(`${BASE}/tasks/${id}`,{headers}); navigate('/dashboard'); };

  const handleUpdate=async()=>{
    if(!editText.trim())return; setSaving(true);
    try{
      const res=await axios.patch(`${BASE}/tasks/${id}`,{text:editText.trim(),dueDate:editDue||null,importance:editImp,subject:editSubject.trim(),tags:editTags.split(',').map(t=>t.trim()).filter(Boolean),notes:editNotes.trim(),grade:editGrade!==''?Number(editGrade):null},{headers});
      setTask(res.data);setShowEdit(false);
    }catch{alert('Could not update.');}finally{setSaving(false);}
  };

  const toggleDone=async()=>{
    if(isTaskOverdue(task.dueDate,task.done)){setShowOverdue(true);return;}
    const res=await axios.patch(`${BASE}/tasks/${id}`,{done:!task.done},{headers});
    setTask(res.data);
    if(!task.done){ setConfetti(true); setTimeout(()=>setConfetti(false),3000); setShowRevision(true); }
  };

  const scheduleRevisions=async()=>{
    const today=new Date();today.setHours(0,0,0,0);
    const dates=[1,3,7,14].map(d=>{const x=new Date(today);x.setDate(x.getDate()+d);return x;});
    for(const date of dates){
      await axios.post(`${BASE}/tasks`,{text:`📖 Revision: ${task.text}`,dueDate:date,importance:task.importance,subject:task.subject,tags:[...(task.tags||[]),'revision'],isRevision:true,originalTask:task._id},{headers});
    }
    setShowRevision(false);
    alert('Revision tasks created for +1, +3, +7, +14 days!');
  };

  const toggleSubtask=async(idx)=>{
    if(isTaskOverdue(task.dueDate,task.done)){setShowOverdue(true);return;}
    const updated=task.subtasks.map((s,i)=>i===idx?{...s,done:!s.done}:s);
    const res=await axios.patch(`${BASE}/tasks/${id}`,{subtasks:updated},{headers});
    setTask(res.data);
  };

  const addSubtask=async()=>{
    if(!newSubtask.trim())return;
    const updated=[...(task.subtasks||[]),{text:newSubtask.trim(),done:false}];
    const res=await axios.patch(`${BASE}/tasks/${id}`,{subtasks:updated},{headers});
    setTask(res.data);setNewSubtask('');
  };

  const deleteSubtask=async(idx)=>{
    const updated=task.subtasks.filter((_,i)=>i!==idx);
    const res=await axios.patch(`${BASE}/tasks/${id}`,{subtasks:updated},{headers});
    setTask(res.data);
  };

  const logSession=async()=>{ await axios.post(`${BASE}/pomodoro`,{taskId:id},{headers}).catch(()=>{}); };

  if(loading)return <div className={styles.center}>Loading…</div>;
  if(error)  return <div className={styles.center}>{error} <button onClick={()=>navigate('/dashboard')}>Go back</button></div>;

  const overdue=isTaskOverdue(task.dueDate,task.done);
  const status=getStatus(task.dueDate,task.done);
  const created=new Date(task.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const doneCount=(task.subtasks||[]).filter(s=>s.done).length;
  const totalSub=(task.subtasks||[]).length;

  return (
    <div className={styles.page}>
      {confetti&&(
        <div className={styles.confettiWrap}>
          {[...Array(40)].map((_,i)=>(
            <div key={i} className={styles.confettiPiece} style={{left:`${Math.random()*100}%`,background:['#d95a2e','#3570d4','#b87a14','#27a05a','#9b59b6','#e91e8c'][i%6],animationDelay:`${Math.random()*0.6}s`,width:`${6+Math.random()*8}px`,height:`${6+Math.random()*8}px`,borderRadius:Math.random()>0.5?'50%':'2px'}}/>
          ))}
        </div>
      )}

      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={()=>navigate(-1)}>← Back</button>
      </div>

      <div className={styles.layout}>
        <div className={styles.left}>
          <div className={styles.card}>
            {overdue&&<div className={styles.overdueCardBanner}>⚠️ This task is overdue. Edit the due date before marking done.</div>}

            <div className={styles.cardHeader}>
              <span className={`${styles.statusBadge} ${styles[status.cls]}`}>{status.label}</span>
              <span className={`${styles.impBadge} ${task.importance==='high'?styles.impHigh:styles.impLow}`}>{task.importance==='high'?'Important':'Low priority'}</span>
              {task.subject&&<span className={styles.subjectBadge}>{task.subject}</span>}
              {task.isRevision&&<span className={styles.revisionBadge}>🔁 Revision</span>}
              {task.recurring!=='none'&&<span className={styles.recurBadge}>🔄 {task.recurring}</span>}
            </div>

            <h1 className={`${styles.taskName} ${task.done?styles.taskDone:''}`}>{task.text}</h1>

            {(task.tags||[]).length>0&&<div className={styles.tagsRow}>{task.tags.map(t=><span key={t} className={styles.tagChip}>#{t}</span>)}</div>}

            <div className={styles.metaRow}>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Due date</span><span className={styles.metaValue}>{formatDate(task.dueDate)}</span></div>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Created</span><span className={styles.metaValue}>{created}</span></div>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Priority</span><span className={styles.metaValue}>⚡{task.priorityScore}</span></div>
              {task.grade!==null&&task.grade!==undefined&&<div className={styles.metaItem}><span className={styles.metaLabel}>Grade</span><span className={styles.metaValue} style={{color:task.grade>=75?'#27a05a':task.grade>=50?'#b87a14':'#d95a2e'}}>{task.grade}%</span></div>}
            </div>

            {task.notes&&<div className={styles.notesBox}><div className={styles.notesLabel}>Notes</div><p className={styles.notesText}>{task.notes}</p></div>}

            <div className={styles.subtaskSection}>
              <div className={styles.subtaskHeader}><span className={styles.subtaskTitle}>Subtasks</span>{totalSub>0&&<span className={styles.subtaskCount}>{doneCount}/{totalSub}</span>}</div>
              {totalSub>0&&<div className={styles.subtaskBar}><div className={styles.subtaskBarFill} style={{width:`${Math.round((doneCount/totalSub)*100)}%`}}/></div>}
              {(task.subtasks||[]).map((s,i)=>(
                <div key={i} className={`${styles.subtaskItem} ${s.done?styles.subtaskDone:''}`}>
                  <input type="checkbox" checked={s.done} onChange={()=>toggleSubtask(i)} className={styles.subtaskCheck} disabled={overdue}/>
                  <span className={styles.subtaskText}>{s.text}</span>
                  <button className={styles.subtaskDel} onClick={()=>deleteSubtask(i)}>×</button>
                </div>
              ))}
              <div className={styles.addSubRow}>
                <input className={styles.addSubInput} type="text" placeholder="Add subtask…" value={newSubtask} onChange={e=>setNewSubtask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSubtask()}/>
                <button className={styles.addSubBtn} onClick={addSubtask}>Add</button>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={`${styles.doneToggle} ${overdue?styles.doneToggleLocked:''}`} onClick={toggleDone}>
                {overdue?'🔒 Update date first':task.done?'Mark as pending':'Mark as done ✓'}
              </button>
              <button className={styles.editBtn} onClick={()=>setShowEdit(true)}>Edit</button>
              <button className={styles.deleteBtn} onClick={()=>setShowDelete(true)}>Delete</button>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          <Pomodoro onSessionComplete={logSession}/>
        </div>
      </div>

      {/* OVERDUE POPUP */}
      {showOverdue&&(
        <div className={styles.overlay}><div className={styles.popup}>
          <h3 className={styles.popupTitle}>Task is overdue</h3>
          <p className={styles.popupSub}>Update the due date in Edit before marking this task done.</p>
          <div className={styles.popupActions}>
            <button className={styles.cancelBtn} onClick={()=>setShowOverdue(false)}>Cancel</button>
            <button className={styles.updateBtn} onClick={()=>{setShowOverdue(false);setShowEdit(true);}}>Open Edit</button>
          </div>
        </div></div>
      )}

      {/* REVISION POPUP */}
      {showRevision&&(
        <div className={styles.overlay}><div className={styles.popup}>
          <h3 className={styles.popupTitle}>Schedule for revision? 📖</h3>
          <p className={styles.popupSub}>Great work completing this task! Would you like to automatically schedule revision tasks at +1, +3, +7, and +14 days to reinforce your learning?</p>
          <div className={styles.popupActions}>
            <button className={styles.cancelBtn} onClick={()=>setShowRevision(false)}>No thanks</button>
            <button className={styles.updateBtn} onClick={scheduleRevisions}>Yes, schedule!</button>
          </div>
        </div></div>
      )}

      {/* DELETE POPUP */}
      {showDelete&&(
        <div className={styles.overlay}><div className={styles.popup}>
          <h3 className={styles.popupTitle}>Delete this task?</h3>
          <p className={styles.popupSub}>This can't be undone. You'll lose <strong>"{task.text}"</strong> and all its subtasks.</p>
          <div className={styles.popupActions}>
            <button className={styles.cancelBtn} onClick={()=>setShowDelete(false)}>Cancel</button>
            <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Yes, delete</button>
          </div>
        </div></div>
      )}

      {/* EDIT POPUP */}
      {showEdit&&(
        <div className={styles.overlay}><div className={styles.popup}>
          <h3 className={styles.popupTitle}>Edit task</h3>
          <div className={styles.editField}><label>Task name <span className={styles.charCount}>{editText.length}/200</span></label><textarea value={editText} onChange={e=>setEditText(e.target.value)} maxLength={200} rows={3}/></div>
          <div className={styles.editField}><label>Due date {overdue&&<span className={styles.overdueHint}>← update this!</span>}</label><input type="date" value={editDue} onChange={e=>setEditDue(e.target.value)} className={overdue?styles.overdueInput:''}/></div>
          <div className={styles.editRow}>
            <div className={styles.editField}><label>Subject</label><input type="text" value={editSubject} onChange={e=>setEditSubject(e.target.value)} placeholder="e.g. OS"/></div>
            <div className={styles.editField}><label>Grade % {!task.done&&<span className={styles.hint}>(completed tasks only)</span>}</label><input type="number" min="0" max="100" value={editGrade} onChange={e=>setEditGrade(e.target.value)} placeholder="0–100" disabled={!task.done}/></div>
          </div>
          <div className={styles.editField}><label>Tags <span className={styles.hint}>(comma separated)</span></label><input type="text" value={editTags} onChange={e=>setEditTags(e.target.value)} placeholder="exam, revision"/></div>
          <div className={styles.editField}><label>Notes</label><textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={2} placeholder="Any extra details…"/></div>
          <div className={styles.editField}><label>Importance</label>
            <div className={styles.impToggle}>
              <input type="radio" id="e-high" name="editImp" checked={editImp==='high'} onChange={()=>setEditImp('high')}/><label htmlFor="e-high">Important</label>
              <input type="radio" id="e-low"  name="editImp" checked={editImp==='low'}  onChange={()=>setEditImp('low')}/>  <label htmlFor="e-low">Low priority</label>
            </div>
          </div>
          <div className={styles.popupActions}>
            <button className={styles.cancelBtn} onClick={()=>setShowEdit(false)}>Cancel</button>
            <button className={styles.updateBtn} onClick={handleUpdate} disabled={saving||!editText.trim()}>{saving?'Saving…':'Update task'}</button>
          </div>
        </div></div>
      )}
    </div>
  );
}
