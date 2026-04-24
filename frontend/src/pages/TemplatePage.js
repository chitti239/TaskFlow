import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/TemplatePage.module.css';

const BASE = 'http://localhost:5000/api';

export default function TemplatePage() {
  const { openWithTemplate } = useOutletContext();
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName]           = useState('');
  const [text, setText]           = useState('');
  const [importance, setImp]      = useState('high');
  const [subject, setSubject]     = useState('');
  const [tags, setTags]           = useState('');
  const [subtasks, setSubtasks]   = useState('');
  const [notes, setNotes]         = useState('');
  const token = localStorage.getItem('tf_token');
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => {
    axios.get(`${BASE}/templates`,{headers}).then(r=>setTemplates(r.data)).catch(()=>{});
  }, []);

  const resetForm = () => {
    setName('');setText('');setImp('high');setSubject('');setTags('');setSubtasks('');setNotes('');
    setEditingId(null);setShowForm(false);
  };

  const save = async (e) => {
    e.preventDefault();
    if(!name.trim()||!text.trim()) return;
    const payload = {
      name, text, importance, subject,
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      subtasks: subtasks.split('\n').map(t=>({text:t.trim()})).filter(t=>t.text),
      notes,
    };
    if (editingId) {
      const r = await axios.patch(`${BASE}/templates/${editingId}`, payload, {headers});
      setTemplates(prev=>prev.map(t=>t._id===editingId?r.data:t));
    } else {
      const r = await axios.post(`${BASE}/templates`, payload, {headers});
      setTemplates(prev=>[r.data,...prev]);
    }
    resetForm();
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setName(t.name); setText(t.text); setImp(t.importance);
    setSubject(t.subject||''); setTags((t.tags||[]).join(', '));
    setSubtasks((t.subtasks||[]).map(s=>s.text).join('\n'));
    setNotes(t.notes||'');
    setShowForm(true);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const del = async (id) => {
    if(!window.confirm('Delete this template?')) return;
    await axios.delete(`${BASE}/templates/${id}`,{headers});
    setTemplates(prev=>prev.filter(t=>t._id!==id));
  };

  // Opens AddTaskModal pre-filled with template data
  const useTemplate = (t) => {
    openWithTemplate({
      text: t.text,
      importance: t.importance,
      subject: t.subject,
      tags: t.tags,
      notes: t.notes,
      subtasks: t.subtasks,
    });
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📄 Templates</h1>
          <p className={styles.sub}>Save reusable task structures. Click "Use Template" to open a pre-filled new task form.</p>
        </div>
        <button className={styles.newBtn} onClick={()=>{ resetForm(); setShowForm(v=>!v); }}>
          {showForm ? 'Cancel' : '+ New Template'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>{editingId ? 'Edit Template' : 'Create Template'}</h3>
          <form onSubmit={save} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Template name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Assignment Template"/>
              </div>
              <div className={styles.field}>
                <label>Default task text</label>
                <input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. Complete assignment"/>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Subject</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. OS"/>
              </div>
              <div className={styles.field}>
                <label>Tags <span className={styles.hint}>(comma separated)</span></label>
                <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="assignment, exam"/>
              </div>
            </div>
            <div className={styles.field}>
              <label>Subtasks <span className={styles.hint}>(one per line — these will appear in the task form)</span></label>
              <textarea value={subtasks} onChange={e=>setSubtasks(e.target.value)} rows={5} placeholder={"Read the question\nResearch topic\nWrite draft\nReview\nSubmit"}/>
            </div>
            <div className={styles.field}>
              <label>Notes</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Any default notes…"/>
            </div>
            <div className={styles.field}>
              <label>Importance</label>
              <div className={styles.impToggle}>
                <input type="radio" id="t-high" name="timp" checked={importance==='high'} onChange={()=>setImp('high')}/>
                <label htmlFor="t-high">Important</label>
                <input type="radio" id="t-low"  name="timp" checked={importance==='low'}  onChange={()=>setImp('low')}/>
                <label htmlFor="t-low">Low priority</label>
              </div>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
              <button type="submit" className={styles.saveBtn}>{editingId?'Save changes':'Save Template'}</button>
            </div>
          </form>
        </div>
      )}

      {templates.length === 0 && !showForm ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📄</div>
          <p>No templates yet.</p>
          <p className={styles.emptySub}>Create one to speed up adding tasks you do repeatedly.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {templates.map(t=>(
            <div key={t._id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardName}>{t.name}</div>
                <button className={styles.editIconBtn} onClick={()=>startEdit(t)} title="Edit template">✏️</button>
              </div>
              <div className={styles.cardText}>"{t.text}"</div>
              {(t.subject||t.tags?.length>0) && (
                <div className={styles.cardMeta}>
                  {t.subject&&<span className={styles.chip}>{t.subject}</span>}
                  {(t.tags||[]).map(g=><span key={g} className={styles.chip}>#{g}</span>)}
                </div>
              )}
              {t.subtasks?.length>0&&(
                <div className={styles.subtaskPreview}>
                  {t.subtasks.slice(0,3).map((s,i)=><div key={i} className={styles.subtaskLine}>· {s.text}</div>)}
                  {t.subtasks.length>3&&<div className={styles.subtaskMore}>+{t.subtasks.length-3} more</div>}
                </div>
              )}
              <div className={styles.cardActions}>
                <button className={styles.useBtn} onClick={()=>useTemplate(t)}>
                  Use Template →
                </button>
                <button className={styles.delBtn} onClick={()=>del(t._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
