import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGamification, getLevelInfo } from '../context/GamificationContext';
import styles from '../styles/Sidebar.module.css';

const NAV = [
  { path:'/dashboard',     icon:'🏠', label:'Dashboard' },
  { path:'/today',         icon:'📅', label:'Today' },
  { path:'/all-tasks',     icon:'📋', label:'All Tasks' },
  { path:'/subjects',      icon:'📚', label:'By Subject' },
  { path:'/completed',     icon:'✅', label:'Completed' },
  { path:'/analytics',     icon:'📊', label:'Analytics' },
];

const STUDY = [
  { path:'/flashcards',    icon:'🃏', label:'Flashcards' },
  { path:'/pomodoro',      icon:'⏱',  label:'Pomodoro' },
  { path:'/brain-break',   icon:'🎮', label:'Brain Break' },
  { path:'/templates',     icon:'📄', label:'Templates' },
];

const PROFILE = [
  { path:'/gamification',  icon:'🎮', label:'Gamification', badge:'XP' },
  { path:'/achievements',  icon:'🏆', label:'Achievements' },
  { path:'/calendar-sync', icon:'📅', label:'Calendar Sync' },
];

export default function Sidebar({ tasks = [], onNewTask }) {
  const { logout }  = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { xp, levelInfo, challenge } = useGamification();
  const { current, pct } = levelInfo;

  const active = (p) => location.pathname === p;
  const subjects = [...new Set(tasks.filter(t => t.subject).map(t => t.subject))];

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoText}>TaskFlow</span>
      </div>

      {/* XP mini bar */}
      <div className={styles.xpMini} onClick={() => navigate('/gamification')}>
        <div className={styles.xpMiniLeft}>
          <span className={styles.xpMiniLevel} style={{ color: current.color }}>Lv.{current.level}</span>
          <span className={styles.xpMiniTitle}>{current.title}</span>
        </div>
        <div className={styles.xpMiniBar}>
          <div className={styles.xpMiniBarFill} style={{ width: `${pct}%`, background: current.color }} />
        </div>
      </div>

      {/* Daily challenge strip */}
      {challenge && !challenge.completed && (
        <div className={styles.challengeStrip} onClick={() => navigate('/gamification')}>
          <span className={styles.challengeStripIcon}>🎯</span>
          <div className={styles.challengeStripText}>{challenge.text}</div>
          <div className={styles.challengeStripBar}>
            <div style={{ width: `${Math.round((challenge.progress/challenge.target)*100)}%`, background:'#22c55e', height:'100%', borderRadius:'2px', transition:'width 0.4s' }} />
          </div>
        </div>
      )}
      {challenge?.completed && (
        <div className={`${styles.challengeStrip} ${styles.challengeDone}`} onClick={() => navigate('/gamification')}>
          <span>✅</span>
          <div className={styles.challengeStripText}>Daily challenge done!</div>
        </div>
      )}

      <nav className={styles.nav}>
        <div className={styles.section}>Navigate</div>
        {NAV.map(({ path, icon, label }) => (
          <button key={path} className={`${styles.navItem} ${active(path) ? styles.navActive : ''}`} onClick={() => navigate(path)}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}

        <div className={styles.section}>Study Tools</div>
        {STUDY.map(({ path, icon, label }) => (
          <button key={path} className={`${styles.navItem} ${active(path) ? styles.navActive : ''}`} onClick={() => navigate(path)}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
          </button>
        ))}

        <div className={styles.section}>Progress</div>
        {PROFILE.map(({ path, icon, label, badge }) => (
          <button key={path} className={`${styles.navItem} ${active(path) ? styles.navActive : ''}`} onClick={() => navigate(path)}>
            <span className={styles.icon}>{icon}</span>
            <span className={styles.label}>{label}</span>
            {badge && <span className={styles.navBadge}>{badge}</span>}
          </button>
        ))}

        {subjects.length > 0 && (
          <>
            <div className={styles.section}>Subjects</div>
            {subjects.map(sub => {
              const count = tasks.filter(t => t.subject === sub && !t.done).length;
              return (
                <button key={sub} className={styles.subjectItem} onClick={() => navigate(`/subjects?s=${encodeURIComponent(sub)}`)}>
                  <span className={styles.subjectDot} />
                  <span className={styles.subjectName}>{sub}</span>
                  {count > 0 && <span className={styles.subjectCount}>{count}</span>}
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className={styles.bottom}>
        <button className={styles.newTaskBtn} onClick={onNewTask}>+ New Task</button>
        <button className={`${styles.navItem} ${active('/settings') ? styles.navActive : ''}`} onClick={() => navigate('/settings')}>
          <span className={styles.icon}>⚙️</span><span className={styles.label}>Settings</span>
        </button>
        <button className={styles.navItem} onClick={() => { logout(); navigate('/login'); }}>
          <span className={styles.icon}>🚪</span><span className={styles.label}>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
