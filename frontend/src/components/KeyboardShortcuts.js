import { useState, useEffect } from 'react';
import styles from '../styles/KeyboardShortcuts.module.css';

const SHORTCUTS = [
  { keys: ['N'],       action: 'New task' },
  { keys: ['F'],       action: 'Focus mode' },
  { keys: ['/'],       action: 'Search' },
  { keys: ['?'],       action: 'Show shortcuts' },
  { keys: ['G', 'D'],  action: 'Go to Dashboard' },
  { keys: ['G', 'T'],  action: 'Go to Today' },
  { keys: ['G', 'A'],  action: 'Go to All Tasks' },
  { keys: ['G', 'P'],  action: 'Go to Pomodoro' },
  { keys: ['G', 'S'],  action: 'Go to Analytics' },
  { keys: ['Esc'],     action: 'Close / cancel' },
];

export default function KeyboardShortcuts({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>⌨️ Keyboard Shortcuts</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.list}>
          {SHORTCUTS.map((s, i) => (
            <div key={i} className={styles.row}>
              <div className={styles.keys}>
                {s.keys.map((k, j) => (
                  <span key={j}>
                    <kbd className={styles.kbd}>{k}</kbd>
                    {j < s.keys.length - 1 && <span className={styles.then}>then</span>}
                  </span>
                ))}
              </div>
              <span className={styles.action}>{s.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Hook to wire up global shortcuts */
export function useKeyboardShortcuts({ onNewTask, onFocus, onSearch, navigate }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [gPressed, setGPressed] = useState(false);

  useEffect(() => {
    let gTimer;
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = ['INPUT','TEXTAREA','SELECT'].includes(tag);

      if (e.key === 'Escape') { setShowShortcuts(false); return; }
      if (e.key === '?' && !isInput) { setShowShortcuts(s => !s); return; }
      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') { onNewTask?.(); return; }
      if (e.key === 'f' || e.key === 'F') { onFocus?.(); return; }
      if (e.key === '/') { e.preventDefault(); onSearch?.(); return; }

      if (e.key === 'g' || e.key === 'G') {
        setGPressed(true);
        clearTimeout(gTimer);
        gTimer = setTimeout(() => setGPressed(false), 1500);
        return;
      }

      if (gPressed) {
        const map = { d: '/dashboard', t: '/today', a: '/all-tasks', p: '/pomodoro', s: '/analytics' };
        const dest = map[e.key.toLowerCase()];
        if (dest) { navigate?.(dest); setGPressed(false); }
      }
    };

    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('keydown', handler); clearTimeout(gTimer); };
  }, [gPressed, onNewTask, onFocus, onSearch, navigate]);

  return { showShortcuts, setShowShortcuts };
}
