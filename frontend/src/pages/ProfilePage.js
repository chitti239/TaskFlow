import { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from '../components/Avatar';
import styles from '../styles/ProfilePage.module.css';

const BASE = 'http://localhost:5000/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('tf_token');
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => {
    axios.get(`${BASE}/profile`,{headers})
      .then(r=>setProfile(r.data))
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[]);

  const exportPDF = () => {
    const win = window.open('','_blank');
    win.document.write(`
      <html><head><title>TaskFlow Profile</title>
      <style>body{font-family:sans-serif;padding:2rem;color:#1a1916}h1{font-size:24px;margin-bottom:0.5rem}p{color:#7a7872;margin-bottom:2rem}.stat{display:inline-block;margin:0.5rem 1rem 0.5rem 0}.stat-val{font-size:28px;font-weight:600;display:block}.stat-label{font-size:12px;color:#7a7872;text-transform:uppercase;letter-spacing:0.05em}</style>
      </head><body>
      <h1>TaskFlow — ${profile?.username}</h1>
      <p>Exported on ${new Date().toLocaleDateString()}</p>
      <div class="stat"><span class="stat-val">${profile?.totalCompleted||0}</span><span class="stat-label">Tasks Completed</span></div>
      <div class="stat"><span class="stat-val">${profile?.currentStreak||0}</span><span class="stat-label">Current Streak</span></div>
      <div class="stat"><span class="stat-val">${profile?.longestStreak||0}</span><span class="stat-label">Longest Streak</span></div>
      <div class="stat"><span class="stat-val">${new Date(profile?.createdAt).toLocaleDateString()}</span><span class="stat-label">Member Since</span></div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) return <div className={styles.center}>Loading…</div>;

  const joined = new Date(profile?.createdAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});

  return (
    <div>
      <h1 className={styles.title}>👤 Profile</h1>

      <div className={styles.profileCard}>
        <div className={styles.avatarSection}>
          <Avatar username={profile?.username||'?'} color={profile?.avatarColor} size={72}/>
          <div>
            <div className={styles.username}>{profile?.username}</div>
            <div className={styles.email}>{profile?.email}</div>
            <div className={styles.joined}>Member since {joined}</div>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{profile?.totalCompleted||0}</div>
          <div className={styles.statLabel}>Tasks Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>🔥{profile?.currentStreak||0}</div>
          <div className={styles.statLabel}>Current Streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{profile?.longestStreak||0}</div>
          <div className={styles.statLabel}>Longest Streak</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{profile?.theme||'default'}</div>
          <div className={styles.statLabel}>Current Theme</div>
        </div>
      </div>

      <button className={styles.exportBtn} onClick={exportPDF}>
        📄 Export Profile as PDF
      </button>
    </div>
  );
}
