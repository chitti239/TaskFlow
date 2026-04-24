import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useGamification, XP_VALUES } from '../context/GamificationContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AddTaskModal from './AddTaskModal';
import FocusMode from './FocusMode';
import KeyboardShortcuts, { useKeyboardShortcuts } from './KeyboardShortcuts';
import { useToast } from './Toast';
import { XPPopups, LevelUpModal } from './XPOverlay';

const BASE = 'http://localhost:5000/api';

function calcStreak(tasks) {
  const doneDates = [...new Set(
    tasks.filter(t => t.done && t.updatedAt)
      .map(t => { const d = new Date(t.updatedAt); d.setHours(0,0,0,0); return d.getTime(); })
  )].sort((a,b) => b-a);
  if (!doneDates.length) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayMs = today.getTime(), yestMs = todayMs - 86400000;
  if (doneDates[0] !== todayMs && doneDates[0] !== yestMs) return 0;
  let count = 1;
  for (let i = 1; i < doneDates.length; i++) {
    if (doneDates[i-1] - doneDates[i] === 86400000) count++; else break;
  }
  return count;
}

export default function AppLayout() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const toast       = useToast();
  const { addXp, advanceChallenge } = useGamification();

  const [tasks,     setTasks]     = useState([]);
  const [exams,     setExams]     = useState([]);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [prefill,   setPrefill]   = useState(null);
  const [confetti,  setConfetti]  = useState(false);
  const [focusTask, setFocusTask] = useState(null);
  const [showFocus, setShowFocus] = useState(false);

  const token   = localStorage.getItem('tf_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchTasks = useCallback(async () => {
    try { const r = await axios.get(`${BASE}/tasks`, {headers}); setTasks(r.data); } catch {}
  }, []);

  const fetchExams = useCallback(async () => {
    try { const r = await axios.get(`${BASE}/exams`, {headers}); setExams(r.data); } catch {}
  }, []);

  useEffect(() => { fetchTasks(); fetchExams(); }, []);

  const addTask = async (data) => {
    const r = await axios.post(`${BASE}/tasks`, data, {headers});
    setTasks(prev => [r.data, ...prev]);
    setShowAdd(false); setPrefill(null);
    toast.success(`Task added!`);
  };

  const updateTask = async (id, data) => {
    const r = await axios.patch(`${BASE}/tasks/${id}`, data, {headers});
    const updated = r.data;
    setTasks(prev => prev.map(t => t._id === id ? updated : t));
    if (data.done === true) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
      toast.success('Task completed! 🎉');
      // Award XP
      let xpGained = XP_VALUES.TASK_COMPLETE;
      addXp(XP_VALUES.TASK_COMPLETE, 'Task completed');
      if (updated.importance === 'high') { addXp(XP_VALUES.HIGH_PRIORITY, 'High priority bonus'); xpGained += XP_VALUES.HIGH_PRIORITY; }
      if (updated.dueDate && new Date(updated.dueDate) >= new Date()) { addXp(XP_VALUES.BEFORE_DUE, 'Before due date!'); }
      // Challenge progress
      advanceChallenge('tasks');
      if (updated.importance === 'high') advanceChallenge('priority');
      if (new Date().getHours() < 12) advanceChallenge('morning');
    }
    return updated;
  };

  const deleteTask = async (id) => {
    await axios.delete(`${BASE}/tasks/${id}`, {headers});
    setTasks(prev => prev.filter(t => t._id !== id));
    toast.info('Task deleted');
  };

  const openWithTemplate = (data) => { setPrefill(data); setShowAdd(true); };
  const openFocus = (task = null) => { setFocusTask(task); setShowFocus(true); };

  const { showShortcuts, setShowShortcuts } = useKeyboardShortcuts({
    onNewTask: () => { setPrefill(null); setShowAdd(true); },
    onFocus: () => openFocus(null),
    onSearch: () => document.querySelector('input[type="search"], input[placeholder*="earch"]')?.focus(),
    navigate,
  });

  const streak = calcStreak(tasks);

  return (
    <div className="app-layout">
      {/* Confetti */}
      {confetti && (
        <div className="confetti-wrap">
          {[...Array(40)].map((_,i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random()*100}%`,
              background: ['#d95a2e','#3570d4','#b87a14','#27a05a','#9b59b6','#e91e8c'][i%6],
              animationDelay: `${Math.random()*0.6}s`,
              width: `${6+Math.random()*8}px`, height: `${6+Math.random()*8}px`,
              borderRadius: Math.random()>0.5?'50%':'2px',
            }}/>
          ))}
        </div>
      )}

      {/* XP popups + level up */}
      <XPPopups />
      <LevelUpModal />

      <Sidebar tasks={tasks} onNewTask={() => { setPrefill(null); setShowAdd(true); }} />

      <div className="app-main">
        <Topbar
          user={user} tasks={tasks} streak={streak}
          onSearch={setSearch}
          onShortcuts={() => setShowShortcuts(true)}
          onFocus={() => openFocus(null)}
        />
        <div className="app-content">
          <Outlet context={{ tasks, exams, search, streak, addTask, updateTask, deleteTask, fetchTasks, setShowAdd, openWithTemplate, openFocus }} />
        </div>
      </div>

      {showAdd && <AddTaskModal onAdd={addTask} onClose={() => { setShowAdd(false); setPrefill(null); }} prefill={prefill} />}
      {showFocus && <FocusMode task={focusTask} onClose={() => setShowFocus(false)} onComplete={id => updateTask(id, {done:true})} />}
      {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
