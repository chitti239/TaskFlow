import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/NotificationBell.module.css';

export default function NotificationBell({ tasks=[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const today = new Date(); today.setHours(0,0,0,0);
  const notifications = [];

  // Overdue tasks
  const overdue = tasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < today);
  if (overdue.length > 0) notifications.push({ type:'overdue', message:`${overdue.length} overdue task${overdue.length>1?'s':''}`, icon:'⚠️', path:'/all-tasks' });

  // Today's tasks
  const todayTasks = tasks.filter(t => {
    if(!t.dueDate||t.done) return false;
    const d=new Date(t.dueDate); d.setHours(0,0,0,0);
    return d.getTime()===today.getTime();
  });
  if (todayTasks.length > 0) notifications.push({ type:'today', message:`${todayTasks.length} task${todayTasks.length>1?'s':''} due today`, icon:'📋', path:'/today' });

  // Weekly report ready on Sunday
  if (new Date().getDay() === 0) notifications.push({ type:'report', message:'Your weekly report is ready!', icon:'📊', path:'/dashboard' });

  const count = notifications.length;

  return (
    <div className={styles.wrap} ref={ref}>
      <button className={styles.bell} onClick={() => setOpen(o=>!o)}>
        🔔
        {count > 0 && <span className={styles.badge}>{count}</span>}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropHeader}>Notifications</div>
          {count === 0 ? (
            <div className={styles.empty}>All caught up! 🎉</div>
          ) : notifications.map((n,i) => (
            <button key={i} className={`${styles.notif} ${styles[n.type]}`} onClick={() => { navigate(n.path); setOpen(false); }}>
              <span className={styles.notifIcon}>{n.icon}</span>
              <span className={styles.notifMsg}>{n.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
