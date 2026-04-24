import { useOutletContext } from 'react-router-dom';
import styles from '../styles/AchievementsPage.module.css';

const BADGES = [
  { id:'first',    icon:'🥇', name:'First Step',    desc:'Complete your first task',           check:(t,s)=>t.filter(x=>x.done).length>=1 },
  { id:'streak3',  icon:'🔥', name:'On Fire',       desc:'Achieve a 3 day streak',             check:(t,s)=>s>=3 },
  { id:'streak7',  icon:'💪', name:'Consistent',    desc:'Achieve a 7 day streak',             check:(t,s)=>s>=7 },
  { id:'streak30', icon:'🏆', name:'Champion',      desc:'Achieve a 30 day streak',            check:(t,s)=>s>=30 },
  { id:'tasks10',  icon:'📚', name:'Scholar',       desc:'Complete 10 tasks',                  check:(t,s)=>t.filter(x=>x.done).length>=10 },
  { id:'tasks50',  icon:'⭐', name:'Star Student',  desc:'Complete 50 tasks',                  check:(t,s)=>t.filter(x=>x.done).length>=50 },
  { id:'tasks100', icon:'💯', name:'Century',       desc:'Complete 100 tasks',                 check:(t,s)=>t.filter(x=>x.done).length>=100 },
  { id:'subjects', icon:'📖', name:'Dedicated',     desc:'Study 5 different subjects',         check:(t,s)=>[...new Set(t.filter(x=>x.subject).map(x=>x.subject))].length>=5 },
  { id:'perfect',  icon:'🎯', name:'Perfectionist', desc:'Score 100% on a graded task',        check:(t,s)=>t.some(x=>x.grade===100) },
  { id:'planner',  icon:'📅', name:'Planner',       desc:'Add your first exam countdown',      check:(t,s,e)=>e&&e.length>=1 },
  { id:'night',    icon:'🌙', name:'Night Owl',     desc:'Complete a task after 11 PM',        check:(t,s)=>t.some(x=>x.done&&new Date(x.updatedAt).getHours()>=23) },
  { id:'subtasks', icon:'📝', name:'Detail Oriented',desc:'Complete a task with 3+ subtasks',  check:(t,s)=>t.some(x=>x.done&&(x.subtasks||[]).length>=3) },
];

export default function AchievementsPage() {
  const { tasks, exams, streak } = useOutletContext();
  const unlocked = BADGES.filter(b=>b.check(tasks,streak,exams));
  const locked   = BADGES.filter(b=>!b.check(tasks,streak,exams));

  return (
    <div>
      <h1 className={styles.title}>🏆 Achievements</h1>
      <p className={styles.sub}>{unlocked.length}/{BADGES.length} badges unlocked</p>

      <div className={styles.progressBar}><div className={styles.progressFill} style={{width:`${Math.round((unlocked.length/BADGES.length)*100)}%`}}/></div>

      {unlocked.length>0&&(
        <>
          <h2 className={styles.sectionTitle}>Unlocked</h2>
          <div className={styles.grid}>
            {unlocked.map(b=>(
              <div key={b.id} className={styles.badge}>
                <div className={styles.badgeIcon}>{b.icon}</div>
                <div className={styles.badgeName}>{b.name}</div>
                <div className={styles.badgeDesc}>{b.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className={styles.sectionTitle}>Locked</h2>
      <div className={styles.grid}>
        {locked.map(b=>(
          <div key={b.id} className={`${styles.badge} ${styles.badgeLocked}`}>
            <div className={styles.badgeIcon}>🔒</div>
            <div className={styles.badgeName}>{b.name}</div>
            <div className={styles.badgeDesc}>{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
