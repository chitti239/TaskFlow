import { useState, useEffect } from 'react';
import styles from '../styles/AddTaskModal.module.css';

export default function AddTaskModal({ onAdd, onClose, prefill=null }) {
  const [text, setText]       = useState('');
  const [dueDate, setDue]     = useState('');
  const [importance, setImp]  = useState('high');
  const [subject, setSubject] = useState('');
  const [tags, setTags]       = useState('');
  const [notes, setNotes]     = useState('');
  const [recurring, setRec]   = useState('none');
  const [subtasks, setSubtasks] = useState([]);
  const [error, setError]     = useState('');
  const [saving, setSaving]   = useState(false);

  // Pre-fill fields when a template is passed
  useEffect(() => {
    if (prefill) {
      setText(prefill.text || '');
      setImp(prefill.importance || 'high');
      setSubject(prefill.subject || '');
      setTags((prefill.tags || []).join(', '));
      setNotes(prefill.notes || '');
      setSubtasks(prefill.subtasks || []);
    }
  }, [prefill]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Task name is required.');
    setSaving(true);
    try {
      await onAdd({
        text: text.trim(),
        dueDate: dueDate || null,
        importance,
        subject: subject.trim(),
        tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
        notes: notes.trim(),
        recurring,
        subtasks: subtasks.map(s => typeof s === 'string' ? { text:s, done:false } : { text:s.text, done:false }),
      });
    } catch { setError('Could not add task.'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{prefill ? `From template` : 'New Task'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        {prefill && <div className={styles.templateBanner}>📄 Pre-filled from template — adjust as needed</div>}
        <form onSubmit={submit}>
          <div className={styles.field}>
            <label>Task name <span className={styles.charCount}>{text.length}/200</span></label>
            <input type="text" value={text} onChange={e=>setText(e.target.value)} maxLength={200} placeholder="What do you need to do?" autoFocus />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Due date</label>
              <input type="date" value={dueDate} onChange={e=>setDue(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Subject</label>
              <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. OS, DBMS" />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Tags <span className={styles.hint}>(comma separated)</span></label>
              <input type="text" value={tags} onChange={e=>setTags(e.target.value)} placeholder="exam, revision" />
            </div>
            <div className={styles.field}>
              <label>Recurring</label>
              <select value={recurring} onChange={e=>setRec(e.target.value)}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Notes</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any extra details…"/>
          </div>

          {/* Show prefilled subtasks */}
          {subtasks.length > 0 && (
            <div className={styles.field}>
              <label>Subtasks from template</label>
              <div className={styles.subtaskPreview}>
                {subtasks.map((s,i) => (
                  <div key={i} className={styles.subtaskRow}>
                    <span className={styles.subtaskBullet}>·</span>
                    <span>{typeof s === 'string' ? s : s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label>Importance</label>
            <div className={styles.impToggle}>
              <input type="radio" id="m-high" name="mimp" checked={importance==='high'} onChange={()=>setImp('high')}/>
              <label htmlFor="m-high">Important</label>
              <input type="radio" id="m-low"  name="mimp" checked={importance==='low'}  onChange={()=>setImp('low')}/>
              <label htmlFor="m-low">Low priority</label>
            </div>
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.addBtn} disabled={saving}>{saving?'Adding…':'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
