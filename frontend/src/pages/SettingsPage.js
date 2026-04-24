import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/SettingsPage.module.css';

const BASE = 'http://localhost:5000/api';

export default function SettingsPage() {
  const { theme, setTheme, dark, setDark, themes } = useTheme();
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [email, setEmail]           = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass]       = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg]               = useState('');
  const [err, setErr]               = useState('');
  const [saving, setSaving]         = useState(false);

  const token = localStorage.getItem('tf_token');
  const headers = { Authorization:`Bearer ${token}` };

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (newPass && newPass !== confirmPass) return setErr('New passwords do not match.');
    if (newPass && newPass.length < 4) return setErr('Password must be at least 4 characters.');
    setSaving(true);
    try {
      const payload = {};
      if (email.trim()) payload.email = email.trim();
      if (newPass) { payload.currentPassword = currentPass; payload.newPassword = newPass; }
      if (theme) payload.theme = theme;
      await axios.patch(`${BASE}/profile`, payload, {headers});
      setMsg('Settings saved successfully!');
      setEmail(''); setCurrentPass(''); setNewPass(''); setConfirmPass('');
      if (newPass) { logout(); navigate('/login'); }
    } catch(e) { setErr(e.response?.data?.message||'Could not save settings.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <h1 className={styles.title}>⚙️ Settings</h1>

      {/* Theme */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.darkRow}>
          <span className={styles.label}>Dark mode</span>
          <button className={`${styles.toggle} ${dark?styles.toggleOn:''}`} onClick={()=>setDark(d=>!d)}>
            <div className={styles.toggleThumb}/>
          </button>
        </div>
        <div className={styles.themeLabel}>Accent colour</div>
        <div className={styles.themeGrid}>
          {Object.entries(themes).map(([key,val])=>(
            <button key={key} className={`${styles.themeBtn} ${theme===key?styles.themeBtnActive:''}`}
              onClick={()=>setTheme(key)} style={{background:val.accent}}>
              {theme===key&&<span className={styles.themeCheck}>✓</span>}
              <span className={styles.themeName}>{val.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <form onSubmit={saveProfile} className={styles.form}>
          <div className={styles.field}>
            <label>New email address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Leave blank to keep current"/>
          </div>
          <div className={styles.divider}>Change password</div>
          <div className={styles.field}>
            <label>Current password</label>
            <input type="password" value={currentPass} onChange={e=>setCurrentPass(e.target.value)} placeholder="Required to change password"/>
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>New password</label>
              <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 4 characters"/>
            </div>
            <div className={styles.field}>
              <label>Confirm new password</label>
              <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Repeat new password"/>
            </div>
          </div>
          {msg&&<p className={styles.success}>{msg}</p>}
          {err&&<p className={styles.error}>{err}</p>}
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving?'Saving…':'Save changes'}
          </button>
        </form>
      </div>

      {/* Danger zone */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>
        <button className={styles.logoutBtn} onClick={()=>{logout();navigate('/login');}}>Sign out</button>
      </div>
    </div>
  );
}
