import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/TaskDetailPage.module.css';

const BASE = 'http://localhost:5000/api';

function formatDate(d) {
  if (!d) return 'No due date';
  return new Date(d).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function getStatus(dueDate, done) {
  if (done) return { label:'Completed ✓', cls:'done' };
  if (!dueDate) return { label:'No due date', cls:'none' };
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((new Date(dueDate) - today) / 86400000);
  if (diff < 0)  return { label:'Overdue', cls:'overdue' };
  if (diff === 0) return { label:'Due today', cls:'today' };
  if (diff === 1) return { label:'Due tomorrow', cls:'soon' };
  return { label:`Due in ${diff} days`, cls:'upcoming' };
}

// ── Pomodoro Component ──
function Pomodoro() {
  const WORK = 25*60, BREAK = 5*60;
  const [timeLeft, setTimeLeft]   = useState(WORK);
  const [running, setRunning]     = useState(false);
  const [isBreak, setIsBreak]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!isBreak) { setSessions(s => s+1); setIsBreak(true); setTimeLeft(BREAK); }
            else { setIsBreak(false); setTimeLeft(WORK); }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, isBreak]);

  const reset = () => { setRunning(false); setTimeLeft(isBreak ? BREAK : WORK); };
  const skip  = () => { setRunning(false); if (!isBreak) { setSessions(s=>s+1); setIsBreak(true); setTimeLeft(BREAK); } else { setIsBreak(false); setTimeLeft(WORK); }};

  const mins = String(Math.floor(timeLeft/60)).padStart(2,'0');
  const secs = String(timeLeft%60).padStart(2,'0');
  const pct  = isBreak ? ((BREAK-timeLeft)/BREAK)*100 : ((WORK-timeLeft)/WORK)*100;

  return (
    <div className={styles.pomodoro}>
      <div className={styles.pomLabel}>{isBreak ? '☕ Break time' : '⏱ Focus session'} · {sessions} session{sessions !== 1 ? 's' : ''} done</div>
      <div className={styles.pomRing}>
        <svg viewBox="0 0 80 80" className={styles.pomSvg}>
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="5"/>
          <circle cx="40" cy="40" r="34" fill="none" stroke={isBreak ? '#27a05a' : '#3570d4'} strokeWidth="5"
            strokeDasharray={`${2*Math.PI*34}`}
            strokeDashoffset={`${2*Math.PI*34*(1-pct/100)}`}
            strokeLinecap="round" transform="rotate(-90 40 40)"
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <div className={styles.pomTime}>{mins}:{secs}</div>
      </div>
      <div className={styles.pomBtns}>
        <button className={styles.pomBtn} onClick={() => setRunning(r=>!r)}>{running ? 'Pause' : 'Start'}</button>
        <button className={styles.pomBtnSm} onClick={reset}>Reset</button>
        <button className={styles.pomBtnSm} onClick={skip}>Skip</button>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [editText, setEditText]     = useState('');
  const [editDue, setEditDue]       = useState('');
  const [editImp, setEditImp]       = useState('high');
  const [editSubject, setEditSubject] = useState('');
  const [editTags, setEditTags]     = useState('');
  const [editNotes, setEditNotes]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  const token = localStorage.getItem('tf_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${BASE}/tasks/${id}`, { headers })
      .then(res => {
        setTask(res.data);
        setEditText(res.data.text);
        setEditDue(res.data.dueDate ? res.data.dueDate.split('T')[0] : '');
        setEditImp(res.data.importance);
        setEditSubject(res.data.subject || '');
        setEditTags((res.data.tags || []).join(', '));
        setEditNotes(res.data.notes || '');
      })
      .catch(() => setError('Task not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    await axios.delete(`${BASE}/tasks/${id}`, { headers });
    navigate('/dashboard');
  };

  const handleUpdate = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await axios.patch(`${BASE}/tasks/${id}`, {
        text: editText.trim(),
        dueDate: editDue || null,
        importance: editImp,
        subject: editSubject.trim(),
        tags: editTags.split(',').map(t=>t.trim()).filter(Boolean),
        notes: editNotes.trim(),
      }, { headers });
      setTask(res.data);
      setShowEdit(false);
    } catch { alert('Could not update task.'); }
    finally { setSaving(false); }
  };

  const toggleDone = async () => {
    const res = await axios.patch(`${BASE}/tasks/${id}`, { done: !task.done }, { headers });
    setTask(res.data);
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const updated = [...(task.subtasks||[]), { text: newSubtask.trim(), done: false }];
    const res = await axios.patch(`${BASE}/tasks/${id}`, { subtasks: updated }, { headers });
    setTask(res.data);
    setNewSubtask('');
  };

  const toggleSubtask = async (idx) => {
    const updated = task.subtasks.map((s,i) => i===idx ? { ...s, done: !s.done } : s);
    const res = await axios.patch(`${BASE}/tasks/${id}`, { subtasks: updated }, { headers });
    setTask(res.data);
  };

  const deleteSubtask = async (idx) => {
    const updated = task.subtasks.filter((_,i) => i!==idx);
    const res = await axios.patch(`${BASE}/tasks/${id}`, { subtasks: updated }, { headers });
    setTask(res.data);
  };

  if (loading) return <div className={styles.center}>Loading…</div>;
  if (error)   return <div className={styles.center}>{error} <button onClick={() => navigate('/dashboard')}>Go back</button></div>;

  const status   = getStatus(task.dueDate, task.done);
  const created  = new Date(task.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const doneCount = (task.subtasks||[]).filter(s=>s.done).length;
  const totalSub  = (task.subtasks||[]).length;

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
      </div>

      <div className={styles.layout}>
        {/* Left: task details */}
        <div className={styles.left}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={`${styles.statusBadge} ${styles[status.cls]}`}>{status.label}</span>
              <span className={`${styles.impBadge} ${task.importance==='high' ? styles.impHigh : styles.impLow}`}>
                {task.importance==='high' ? 'Important' : 'Low priority'}
              </span>
              {task.subject && <span className={styles.subjectBadge}>{task.subject}</span>}
            </div>

            <h1 className={`${styles.taskName} ${task.done ? styles.taskDone : ''}`}>{task.text}</h1>

            {(task.tags||[]).length > 0 && (
              <div className={styles.tagsRow}>
                {task.tags.map(t => <span key={t} className={styles.tagChip}>#{t}</span>)}
              </div>
            )}

            <div className={styles.metaRow}>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Due date</span><span className={styles.metaValue}>{formatDate(task.dueDate)}</span></div>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Created</span><span className={styles.metaValue}>{created}</span></div>
              <div className={styles.metaItem}><span className={styles.metaLabel}>Status</span><span className={styles.metaValue}>{task.done ? 'Done ✓' : 'Pending'}</span></div>
            </div>

            {task.notes && (
              <div className={styles.notesBox}>
                <div className={styles.notesLabel}>Notes</div>
                <p className={styles.notesText}>{task.notes}</p>
              </div>
            )}

            {/* Subtasks */}
            <div className={styles.subtaskSection}>
              <div className={styles.subtaskHeader}>
                <span className={styles.subtaskTitle}>Subtasks</span>
                {totalSub > 0 && <span className={styles.subtaskCount}>{doneCount}/{totalSub}</span>}
              </div>
              {totalSub > 0 && (
                <div className={styles.subtaskBar}>
                  <div className={styles.subtaskBarFill} style={{ width:`${Math.round((doneCount/totalSub)*100)}%` }}/>
                </div>
              )}
              {(task.subtasks||[]).map((s,i) => (
                <div key={i} className={`${styles.subtaskItem} ${s.done ? styles.subtaskDone : ''}`}>
                  <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(i)} className={styles.subtaskCheck} />
                  <span className={styles.subtaskText}>{s.text}</span>
                  <button className={styles.subtaskDel} onClick={() => deleteSubtask(i)}>×</button>
                </div>
              ))}
              <div className={styles.addSubRow}>
                <input
                  className={styles.addSubInput}
                  type="text"
                  placeholder="Add subtask…"
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key==='Enter' && addSubtask()}
                />
                <button className={styles.addSubBtn} onClick={addSubtask}>Add</button>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.doneToggle} onClick={toggleDone}>
                {task.done ? 'Mark as pending' : 'Mark as done ✓'}
              </button>
              <button className={styles.editBtn} onClick={() => setShowEdit(true)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => setShowDelete(true)}>Delete</button>
            </div>
          </div>
        </div>

        {/* Right: Pomodoro */}
        <div className={styles.right}>
          <Pomodoro />
        </div>
      </div>

      {/* DELETE POPUP */}
      {showDelete && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h3 className={styles.popupTitle}>Delete this task?</h3>
            <p className={styles.popupSub}>This can't be undone. You'll lose <strong>"{task.text}"</strong> and all its subtasks.</p>
            <div className={styles.popupActions}>
              <button className={styles.cancelBtn} onClick={() => setShowDelete(false)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POPUP */}
      {showEdit && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h3 className={styles.popupTitle}>Edit task</h3>

            <div className={styles.editField}>
              <label>Task name <span className={styles.charCount}>{editText.length}/200</span></label>
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} maxLength={200} rows={3} />
            </div>
            <div className={styles.editField}>
              <label>Due date</label>
              <input type="date" value={editDue} onChange={e=>setEditDue(e.target.value)} />
            </div>
            <div className={styles.editField}>
              <label>Subject</label>
              <input type="text" value={editSubject} onChange={e=>setEditSubject(e.target.value)} placeholder="e.g. Operating Systems" />
            </div>
            <div className={styles.editField}>
              <label>Tags <span className={styles.hint}>(comma separated)</span></label>
              <input type="text" value={editTags} onChange={e=>setEditTags(e.target.value)} placeholder="e.g. exam, revision" />
            </div>
            <div className={styles.editField}>
              <label>Notes</label>
              <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={2} placeholder="Any extra details…" />
            </div>
            <div className={styles.editField}>
              <label>Importance</label>
              <div className={styles.impToggle}>
                <input type="radio" id="e-high" name="editImp" value="high" checked={editImp==='high'} onChange={()=>setEditImp('high')} />
                <label htmlFor="e-high">Important</label>
                <input type="radio" id="e-low" name="editImp" value="low" checked={editImp==='low'} onChange={()=>setEditImp('low')} />
                <label htmlFor="e-low">Low priority</label>
              </div>
            </div>

            <div className={styles.popupActions}>
              <button className={styles.cancelBtn} onClick={() => setShowEdit(false)}>Cancel</button>
              <button className={styles.updateBtn} onClick={handleUpdate} disabled={saving || !editText.trim()}>
                {saving ? 'Saving…' : 'Update task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
