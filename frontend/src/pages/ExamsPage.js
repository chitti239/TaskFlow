import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/ExamsPage.module.css';

const BASE = 'http://localhost:5000/api';

function daysLeft(date) { const t=new Date();t.setHours(0,0,0,0); return Math.round((new Date(date)-t)/86400000); }

export default function ExamsPage() {
  const { exams, fetchExams } = useOutletContext();
  const [subject, setSubject] = useState('');
  const [date, setDate]       = useState('');
  const [notes, setNotes]     = useState('');
  const [error, setError]     = useState('');
  const token = localStorage.getItem('tf_token');
  const headers = { Authorization:`Bearer ${token}` };

  const add = async (e) => {
    e.preventDefault();
    if(!subject.trim()||!date) return setError('Subject and date are required.');
    try {
      await axios.post(`${BASE}/exams`,{subject,date,notes},{headers});
      setSubject(''); setDate(''); setNotes(''); setError('');
      fetchExams();
    } catch(err){ setError(err.response?.data?.message||'Error adding exam'); }
  };

  const del = async (id) => {
    await axios.delete(`${BASE}/exams/${id}`,{headers});
    fetchExams();
  };

  const sorted = [...exams].sort((a,b)=>new Date(a.date)-new Date(b.date));

  return (
    <div>
      <h1 className={styles.title}>📅 Exam Countdown</h1>
      <p className={styles.sub}>Pin upcoming exams and never miss a deadline</p>

      <div className={styles.addCard}>
        <h3 className={styles.addTitle}>Add Exam</h3>
        <form className={styles.addForm} onSubmit={add}>
          <input className={styles.input} type="text" placeholder="Subject (e.g. Operating Systems)" value={subject} onChange={e=>setSubject(e.target.value)}/>
          <input className={styles.input} type="date" value={date} onChange={e=>setDate(e.target.value)}/>
          <input className={styles.input} type="text" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
          {error&&<p className={styles.error}>{error}</p>}
          <button className={styles.addBtn} type="submit">Add Exam</button>
        </form>
      </div>

      {sorted.length===0?<div className={styles.empty}>No exams added yet.</div>:(
        <div className={styles.grid}>
          {sorted.map(e=>{
            const d=daysLeft(e.date);
            const urgent=d<=2&&d>=0;
            const past=d<0;
            return (
              <div key={e._id} className={`${styles.card} ${urgent?styles.urgent:''} ${past?styles.past:''}`}>
                <div className={styles.cardSubject}>{e.subject}</div>
                <div className={styles.cardDays}>{past?'Past':(d===0?'Today!':d===1?'Tomorrow':`${d} days`)}</div>
                <div className={styles.cardLabel}>{past?'exam date passed':'until exam'}</div>
                <div className={styles.cardDate}>{new Date(e.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
                {e.notes&&<div className={styles.cardNotes}>{e.notes}</div>}
                <button className={styles.delBtn} onClick={()=>del(e._id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
