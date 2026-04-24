import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Quadrant from '../components/Quadrant';
import StatsBar from '../components/StatsBar';
import WeeklyReportModal from '../components/WeeklyReportModal';
import styles from '../styles/DashboardPage.module.css';

const BASE = 'http://localhost:5000/api';

function isUrgent(d){ if(!d)return false; const t=new Date();t.setHours(0,0,0,0); return (new Date(d)-t)/86400000<=2; }
function isOverdue(d,done){ if(!d||done)return false; const t=new Date();t.setHours(0,0,0,0); return new Date(d)<t; }

const QUOTES=[
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "Focus on being productive instead of busy.",
  "One task at a time. That's enough.",
  "Small steps every day lead to big results.",
  "Your future self is watching you right now.",
  "You don't have to be great to start, but you have to start to be great.",
];

function ProductivityRing({ tasks }) {
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pct   = total ? Math.round((done / total) * 100) : 0;
  const r     = 30;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div className={styles.ringWidget}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#22c55e" strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className={styles.ringCenter}>
        <div className={styles.ringPct}>{pct}%</div>
      </div>
      <div className={styles.ringLabel}>Done</div>
    </div>
  );
}

export default function DashboardPage() {
  const { tasks = [], exams = [], search = '', streak = 0, updateTask, deleteTask, setShowAdd, openFocus } = useOutletContext();
  const navigate = useNavigate();
  const [showReport, setShowReport] = useState(false);

  useEffect(() => { if(new Date().getDay()===0) setShowReport(true); }, []);

  const filtered = tasks.filter(t => !search || t.text.toLowerCase().includes(search.toLowerCase()) || (t.subject&&t.subject.toLowerCase().includes(search.toLowerCase())) || (t.tags&&t.tags.some(g=>g.toLowerCase().includes(search.toLowerCase()))));

  const quadrants = {q1:[],q2:[],q3:[],q4:[]};
  filtered.forEach(t => {
    const u=isUrgent(t.dueDate),i=t.importance==='high';
    if(u&&i) quadrants.q1.push(t);
    else if(!u&&i) quadrants.q2.push(t);
    else if(u&&!i) quadrants.q3.push(t);
    else quadrants.q4.push(t);
  });

  const overdueCount = tasks.filter(t=>isOverdue(t.dueDate,t.done)).length;
  const today = exams.filter(e=>{ const d=new Date(e.date)-new Date(); return d>=0&&d<=86400000*30; }).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
  const user = JSON.parse(localStorage.getItem('tf_user')||'{}');
  const cap = (user.username||'').charAt(0).toUpperCase()+(user.username||'').slice(1);
  const quote = QUOTES[new Date().getDay()%QUOTES.length];

  const topTask = tasks.filter(t=>!t.done).sort((a,b)=>b.priorityScore-a.priorityScore)[0];

  const toggleDone = async (id, done) => {
    const task = tasks.find(t=>t._id===id);
    if(task && isOverdue(task.dueDate, task.done)) return;
    await updateTask(id, {done:!done});
  };

  return (
    <div>
      {showReport && <WeeklyReportModal tasks={tasks} streak={streak} onClose={()=>setShowReport(false)} />}

      {overdueCount > 0 && (
        <div className={styles.overdueBanner}>
          ⚠️ <strong>{overdueCount} overdue task{overdueCount>1?'s':''}</strong> — update the due date to mark them done.
        </div>
      )}

      <div className={styles.greetingRow}>
        <div>
          <h1 className={styles.greeting}>{greeting}, {cap}</h1>
          <p className={styles.quote}>"{quote}"</p>
        </div>
        <ProductivityRing tasks={tasks} />
      </div>

      {/* Quick focus CTA */}
      {topTask && openFocus && (
        <div className={styles.focusCTA}>
          <div className={styles.focusCTALeft}>
            <span className={styles.focusCTAIcon}>🎯</span>
            <div>
              <div className={styles.focusCTATitle}>Top priority task</div>
              <div className={styles.focusCTATask}>{topTask.text}</div>
            </div>
          </div>
          <button className={styles.focusCTABtn} onClick={() => openFocus(topTask)}>
            Start focusing →
          </button>
        </div>
      )}

      {/* Exam countdown cards */}
      {today.length > 0 && (
        <div className={styles.examCards}>
          {today.slice(0,3).map(e => {
            const days = Math.round((new Date(e.date)-new Date())/86400000);
            return (
              <div key={e._id} className={`${styles.examCard} ${days<=2?styles.examUrgent:''}`}>
                <div className={styles.examSubject}>{e.subject}</div>
                <div className={styles.examDays}>{days===0?'Today!':days===1?'Tomorrow':`${days} days`}</div>
                <div className={styles.examLabel}>until exam</div>
              </div>
            );
          })}
        </div>
      )}

      <StatsBar tasks={tasks} quadrantQ1={quadrants.q1} streak={streak} />

      {filtered.length === 0 ? (
        <p className={styles.empty}>{search?'No tasks match your search.':'No tasks yet — click + New Task!'}</p>
      ) : (
        <div className={styles.matrix}>
          <Quadrant id="q1" title="Do first"  sub="Urgent · important"        tasks={quadrants.q1} onToggle={toggleDone} onDelete={deleteTask} />
          <Quadrant id="q2" title="Schedule"  sub="Not urgent · important"    tasks={quadrants.q2} onToggle={toggleDone} onDelete={deleteTask} />
          <Quadrant id="q3" title="Quick do"  sub="Urgent · low priority"     tasks={quadrants.q3} onToggle={toggleDone} onDelete={deleteTask} />
          <Quadrant id="q4" title="Do later"  sub="Not urgent · low priority" tasks={quadrants.q4} onToggle={toggleDone} onDelete={deleteTask} />
        </div>
      )}

      <p className={styles.legend}><strong>How it works:</strong> Tasks due within 2 days are urgent. Overdue tasks must have their date updated before marking done.</p>
    </div>
  );
}
