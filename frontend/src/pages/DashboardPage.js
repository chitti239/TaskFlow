import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AddTaskForm from '../components/AddTaskForm';
import StatsBar from '../components/StatsBar';
import Quadrant from '../components/Quadrant';
import styles from '../styles/DashboardPage.module.css';

const BASE = 'http://localhost:5000/api';

function isUrgent(dueDate) {
  if (!dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return (new Date(dueDate) - today) / 86400000 <= 2;
}

function isOverdue(dueDate, done) {
  if (!dueDate || done) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(dueDate) < today;
}

function isDueToday(dueDate) {
  if (!dueDate) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  return due.getTime() === today.getTime();
}

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "Don't watch the clock; do what it does. Keep going.",
  "You don't have to be great to start, but you have to start to be great.",
  "Focus on being productive instead of busy.",
  "One task at a time. That's enough.",
  "Small steps every day lead to big results.",
  "Your future self is watching you right now.",
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today'
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('tf_dark') === 'true');
  const [confetti, setConfetti] = useState(false);

  const token = localStorage.getItem('tf_token');
  const headers = { Authorization: `Bearer ${token}` };

  // Apply dark mode
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
    localStorage.setItem('tf_dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    axios.get(`${BASE}/tasks`, { headers })
      .then(res => setTasks(res.data))
      .catch(() => setError('Could not load tasks.'))
      .finally(() => setLoading(false));
  }, []);

  const addTask = async (taskData) => {
    const res = await axios.post(`${BASE}/tasks`, taskData, { headers });
    setTasks(prev => [res.data, ...prev]);
  };

  const toggleDone = async (id, done) => {
    const res = await axios.patch(`${BASE}/tasks/${id}`, { done: !done }, { headers });
    setTasks(prev => prev.map(t => t._id === id ? res.data : t));
    if (!done) { setConfetti(true); setTimeout(() => setConfetti(false), 3000); }
  };

  const deleteTask = async (id) => {
    await axios.delete(`${BASE}/tasks/${id}`, { headers });
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Streak calc
  const streak = (() => {
    const doneDates = tasks
      .filter(t => t.done && t.updatedAt)
      .map(t => { const d = new Date(t.updatedAt); d.setHours(0,0,0,0); return d.getTime(); });
    const unique = [...new Set(doneDates)].sort((a,b) => b - a);
    let count = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let check = today.getTime();
    for (const d of unique) {
      if (d === check) { count++; check -= 86400000; }
      else break;
    }
    return count;
  })();

  // Filter tasks
  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.text.toLowerCase().includes(search.toLowerCase()) ||
      (t.subject && t.subject.toLowerCase().includes(search.toLowerCase())) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    const matchTab = activeTab === 'all' || isDueToday(t.dueDate);
    return matchSearch && matchTab;
  });

  // Sort into quadrants
  const quadrants = { q1:[], q2:[], q3:[], q4:[] };
  filtered.forEach(t => {
    const u = isUrgent(t.dueDate), i = t.importance === 'high';
    if      (u && i)  quadrants.q1.push(t);
    else if (!u && i) quadrants.q2.push(t);
    else if (u && !i) quadrants.q3.push(t);
    else              quadrants.q4.push(t);
  });

  // Group by subject for subject view
  const subjects = [...new Set(tasks.filter(t => t.subject).map(t => t.subject))];

  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.done)).length;
  const todayCount   = tasks.filter(t => isDueToday(t.dueDate) && !t.done).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const cap = user.username.charAt(0).toUpperCase() + user.username.slice(1);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  return (
    <div className={styles.app}>
      {/* Confetti */}
      {confetti && (
        <div className={styles.confettiWrap}>
          {[...Array(30)].map((_, i) => (
            <div key={i} className={styles.confettiPiece} style={{
              left: `${Math.random()*100}%`,
              background: ['#d95a2e','#3570d4','#b87a14','#27a05a','#9b59b6'][i%5],
              animationDelay: `${Math.random()*0.5}s`,
              width: `${6 + Math.random()*6}px`,
              height: `${6 + Math.random()*6}px`,
            }}/>
          ))}
        </div>
      )}

      {/* Topbar */}
      <header className={styles.topbar}>
        <span className={styles.logo}>TaskFlow</span>
        <div className={styles.topRight}>
          {streak > 0 && <span className={styles.streak}>🔥 {streak} day{streak > 1 ? 's' : ''}</span>}
          <button className={styles.darkBtn} onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <span className={styles.userPill}>{cap}</span>
          <button className={styles.logoutBtn} onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Overdue banner */}
        {overdueCount > 0 && (
          <div className={styles.overdueBanner}>
            ⚠️ You have <strong>{overdueCount} overdue task{overdueCount > 1 ? 's' : ''}</strong> — tackle them first!
          </div>
        )}

        <h1 className={styles.greeting}>{greeting}, {cap}</h1>
        <p className={styles.quote}>"{quote}"</p>

        <StatsBar tasks={tasks} quadrantQ1={quadrants.q1} streak={streak} />

        {/* Search */}
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search tasks, subjects, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`} onClick={() => setActiveTab('all')}>
            All tasks
          </button>
          <button className={`${styles.tab} ${activeTab === 'today' ? styles.activeTab : ''}`} onClick={() => setActiveTab('today')}>
            Today {todayCount > 0 && <span className={styles.tabBadge}>{todayCount}</span>}
          </button>
        </div>

        <AddTaskForm onAdd={addTask} />

        {error && <p className={styles.errorMsg}>{error}</p>}

        {loading ? (
          <p className={styles.loadingMsg}>Loading your tasks…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.emptyMsg}>{search ? 'No tasks match your search.' : activeTab === 'today' ? 'No tasks due today 🎉' : 'No tasks yet — add one above!'}</p>
        ) : (
          <div className={styles.matrix}>
            <Quadrant id="q1" title="Do first"  sub="Urgent · important"        tasks={quadrants.q1} onToggle={toggleDone} onDelete={deleteTask} />
            <Quadrant id="q2" title="Schedule"  sub="Not urgent · important"    tasks={quadrants.q2} onToggle={toggleDone} onDelete={deleteTask} />
            <Quadrant id="q3" title="Quick do"  sub="Urgent · low priority"     tasks={quadrants.q3} onToggle={toggleDone} onDelete={deleteTask} />
            <Quadrant id="q4" title="Do later"  sub="Not urgent · low priority" tasks={quadrants.q4} onToggle={toggleDone} onDelete={deleteTask} />
          </div>
        )}

        {/* Subject grouping */}
        {subjects.length > 0 && !search && activeTab === 'all' && (
          <div className={styles.subjectSection}>
            <h2 className={styles.sectionTitle}>By subject</h2>
            <div className={styles.subjectList}>
              {subjects.map(sub => {
                const subTasks = tasks.filter(t => t.subject === sub && !t.done);
                return (
                  <div key={sub} className={styles.subjectCard}>
                    <div className={styles.subjectName}>{sub}</div>
                    <div className={styles.subjectCount}>{subTasks.length} pending</div>
                    <div className={styles.subjectBar}>
                      <div className={styles.subjectBarFill} style={{
                        width: `${Math.round((tasks.filter(t => t.subject === sub && t.done).length / Math.max(tasks.filter(t => t.subject === sub).length, 1)) * 100)}%`
                      }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className={styles.legend}>
          <strong>How it works:</strong> Tasks due within 2 days are urgent. You set importance. The matrix places each task automatically.
        </p>
      </main>
    </div>
  );
}
