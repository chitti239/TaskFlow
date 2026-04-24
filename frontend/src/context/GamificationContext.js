import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// XP per action
export const XP_VALUES = {
  TASK_COMPLETE:     50,
  HIGH_PRIORITY:     30,  // bonus for high importance
  BEFORE_DUE:        20,  // bonus for completing before due date
  POMODORO_SESSION:  25,
  FLASHCARD_REVIEW:  10,
  DAILY_CHALLENGE:   100,
  STREAK_BONUS:      15,  // per day of streak
};

// Level thresholds
export const LEVELS = [
  { level: 1,  xp: 0,    title: 'Freshman',      color: '#64748b' },
  { level: 2,  xp: 200,  title: 'Sophomore',     color: '#3b82f6' },
  { level: 3,  xp: 500,  title: 'Junior',        color: '#22c55e' },
  { level: 4,  xp: 900,  title: 'Senior',        color: '#f59e0b' },
  { level: 5,  xp: 1400, title: 'Scholar',       color: '#f97316' },
  { level: 6,  xp: 2000, title: 'Honor Student', color: '#ef4444' },
  { level: 7,  xp: 2800, title: 'Dean\'s List',  color: '#8b5cf6' },
  { level: 8,  xp: 3800, title: 'Valedictorian', color: '#ec4899' },
  { level: 9,  xp: 5000, title: 'Professor',     color: '#06b6d4' },
  { level: 10, xp: 6500, title: 'Legend',        color: '#fbbf24' },
];

// Daily challenge templates
const CHALLENGE_TEMPLATES = [
  { id: 'c1', text: 'Complete 3 tasks today',        type: 'tasks',    target: 3,   xp: 100 },
  { id: 'c2', text: 'Complete a high-priority task', type: 'priority', target: 1,   xp: 80  },
  { id: 'c3', text: 'Do 2 Pomodoro sessions',        type: 'pomodoro', target: 2,   xp: 90  },
  { id: 'c4', text: 'Review 5 flashcards',           type: 'flash',    target: 5,   xp: 70  },
  { id: 'c5', text: 'Complete 5 tasks today',        type: 'tasks',    target: 5,   xp: 150 },
  { id: 'c6', text: 'Complete a task before noon',   type: 'morning',  target: 1,   xp: 60  },
  { id: 'c7', text: 'Study 3 different subjects',    type: 'subjects', target: 3,   xp: 120 },
];

export function getLevelInfo(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { current = LEVELS[i]; next = LEVELS[i + 1] || null; break; }
  }
  const xpInLevel = xp - current.xp;
  const xpToNext  = next ? next.xp - current.xp : 1;
  const pct       = next ? Math.min(100, Math.round((xpInLevel / xpToNext) * 100)) : 100;
  return { current, next, xpInLevel, xpToNext, pct };
}

function getTodayKey() {
  return new Date().toDateString();
}

function getDailyChallenge() {
  const stored = localStorage.getItem('tf_challenge');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === getTodayKey()) return parsed;
  }
  // Pick a random challenge for today
  const idx = Math.floor(Math.random() * CHALLENGE_TEMPLATES.length);
  const challenge = { ...CHALLENGE_TEMPLATES[idx], date: getTodayKey(), progress: 0, completed: false };
  localStorage.setItem('tf_challenge', JSON.stringify(challenge));
  return challenge;
}

const GamificationContext = createContext(null);

export function GamificationProvider({ children }) {
  const [xp, setXp]                       = useState(() => Number(localStorage.getItem('tf_xp') || 0));
  const [xpHistory, setXpHistory]         = useState(() => JSON.parse(localStorage.getItem('tf_xp_history') || '[]'));
  const [challenge, setChallenge]         = useState(() => getDailyChallenge());
  const [freezeTokens, setFreezeTokens]   = useState(() => Number(localStorage.getItem('tf_freeze') || 2));
  const [levelUpAnim, setLevelUpAnim]     = useState(null);
  const [xpPopups, setXpPopups]           = useState([]);

  const levelInfo = getLevelInfo(xp);

  const addXp = useCallback((amount, reason) => {
    setXp(prev => {
      const oldLevel = getLevelInfo(prev).current.level;
      const newXp    = prev + amount;
      const newLevel = getLevelInfo(newXp).current.level;
      if (newLevel > oldLevel) setLevelUpAnim(getLevelInfo(newXp).current);
      localStorage.setItem('tf_xp', newXp);
      // Track history
      const hist = JSON.parse(localStorage.getItem('tf_xp_history') || '[]');
      hist.push({ xp: amount, reason, ts: Date.now() });
      localStorage.setItem('tf_xp_history', JSON.stringify(hist.slice(-200)));
      return newXp;
    });
    // XP popup
    const id = Date.now();
    setXpPopups(p => [...p, { id, amount, reason }]);
    setTimeout(() => setXpPopups(p => p.filter(x => x.id !== id)), 2000);
  }, []);

  const advanceChallenge = useCallback((type, amount = 1) => {
    setChallenge(prev => {
      if (prev.completed || prev.type !== type) return prev;
      const newProg = Math.min(prev.target, prev.progress + amount);
      const completed = newProg >= prev.target;
      const updated = { ...prev, progress: newProg, completed };
      localStorage.setItem('tf_challenge', JSON.stringify(updated));
      if (completed) addXp(prev.xp, 'Daily challenge!');
      return updated;
    });
  }, [addXp]);

  const useFreeze = useCallback(() => {
    if (freezeTokens <= 0) return false;
    const n = freezeTokens - 1;
    setFreezeTokens(n);
    localStorage.setItem('tf_freeze', n);
    return true;
  }, [freezeTokens]);

  const earnFreeze = useCallback(() => {
    const n = Math.min(5, freezeTokens + 1);
    setFreezeTokens(n);
    localStorage.setItem('tf_freeze', n);
  }, [freezeTokens]);

  return (
    <GamificationContext.Provider value={{
      xp, levelInfo, challenge, freezeTokens,
      levelUpAnim, setLevelUpAnim,
      xpPopups,
      addXp, advanceChallenge, useFreeze, earnFreeze,
    }}>
      {children}
    </GamificationContext.Provider>
  );
}

export const useGamification = () => useContext(GamificationContext);
