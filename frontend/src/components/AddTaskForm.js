import { useState } from 'react';
import styles from '../styles/AddTaskForm.module.css';

export default function AddTaskForm({ onAdd }) {
  const [text, setText]         = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [importance, setImp]    = useState('high');
  const [subject, setSubject]   = useState('');
  const [tags, setTags]         = useState('');
  const [expanded, setExpanded] = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Please enter a task.');
    setError('');
    try {
      await onAdd({
        text: text.trim(),
        dueDate: dueDate || null,
        importance,
        subject: subject.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setText(''); setDueDate(''); setImp('high'); setSubject(''); setTags('');
      setExpanded(false);
    } catch { setError('Could not add task.'); }
  };

  return (
    <div className={styles.panel}>
      <form onSubmit={submit}>
        <div className={styles.mainRow}>
          <input className={styles.textInput} type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Add a task, e.g. OS exam revision…" />
          <button type="button" className={styles.expandBtn} onClick={() => setExpanded(e => !e)}>
            {expanded ? '▲' : '▼'} More
          </button>
          <button className={styles.addBtn} type="submit">Add</button>
        </div>

        {expanded && (
          <div className={styles.extraRow}>
            <input className={styles.smallInput} type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <input className={styles.smallInput} type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (e.g. OS, DBMS)" />
            <input className={styles.smallInput} type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" />
            <div className={styles.impToggle}>
              <input type="radio" id="imp-high" name="imp" value="high" checked={importance === 'high'} onChange={() => setImp('high')} />
              <label htmlFor="imp-high">Important</label>
              <input type="radio" id="imp-low" name="imp" value="low" checked={importance === 'low'} onChange={() => setImp('low')} />
              <label htmlFor="imp-low">Low priority</label>
            </div>
          </div>
        )}
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
