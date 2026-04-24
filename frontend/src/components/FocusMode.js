import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/FocusMode.module.css';

const WORK = 25 * 60;
const BREAK = 5 * 60;

export default function FocusMode({ task, onClose, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [note, setNote] = useState('');
  const intervalRef = useRef(null);

  const pct = isBreak
    ? ((BREAK - timeLeft) / BREAK) * 100
    : ((WORK  - timeLeft) / WORK)  * 100;

  const r = 90;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!isBreak) {
              setSessions(s => s + 1);
              setIsBreak(true);
              setTimeLeft(BREAK);
            } else {
              setIsBreak(false);
              setTimeLeft(WORK);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, isBreak]);

  // Escape key closes
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className={styles.overlay}>
      <button className={styles.closeBtn} onClick={onClose} title="Exit focus mode (Esc)">✕</button>

      <div className={styles.ambient}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              opacity: 0.1 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.modeTag}>{isBreak ? '☕ Break' : '🎯 Focus'}</div>

        {task && (
          <div className={styles.taskLabel}>
            Working on: <strong>{task.text}</strong>
          </div>
        )}

        <div className={styles.ringWrap}>
          <svg className={styles.ring} viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle cx="100" cy="100" r={r} fill="none"
              stroke={isBreak ? '#27a05a' : '#ffffff'}
              strokeWidth="8"
              strokeDasharray={`${circ}`}
              strokeDashoffset={`${circ * (1 - pct / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <div className={styles.timerText}>{mins}:{secs}</div>
        </div>

        <div className={styles.controls}>
          <button className={styles.mainBtn} onClick={() => setRunning(r => !r)}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className={styles.smBtn} onClick={() => { setRunning(false); setTimeLeft(isBreak ? BREAK : WORK); }}>
            ↺ Reset
          </button>
          <button className={styles.smBtn} onClick={() => {
            setRunning(false);
            if (!isBreak) { setSessions(s => s + 1); setIsBreak(true); setTimeLeft(BREAK); }
            else { setIsBreak(false); setTimeLeft(WORK); }
          }}>
            ⏭ Skip
          </button>
        </div>

        <div className={styles.sessionDots}>
          {[...Array(Math.max(4, sessions + 1))].map((_, i) => (
            <div key={i} className={`${styles.dot} ${i < sessions ? styles.dotFilled : ''}`} />
          ))}
        </div>
        <p className={styles.sessionCount}>{sessions} session{sessions !== 1 ? 's' : ''} completed</p>

        <div className={styles.noteArea}>
          <textarea
            className={styles.noteInput}
            placeholder="Quick notes while you focus…"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {task && (
          <button className={styles.doneBtn} onClick={() => { onComplete(task._id); onClose(); }}>
            ✓ Mark task complete & exit
          </button>
        )}
      </div>
    </div>
  );
}
