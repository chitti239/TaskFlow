import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import styles from '../styles/Topbar.module.css';

export default function Topbar({ user, tasks=[], streak=0, onSearch, onShortcuts, onFocus }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    setSearch(e.target.value);
    onSearch && onSearch(e.target.value);
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <span className={styles.logo}>TaskFlow</span>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search tasks, subjects, tags…"
            value={search}
            onChange={handleSearch}
          />
          {search && <button className={styles.clearBtn} onClick={() => { setSearch(''); onSearch && onSearch(''); }}>×</button>}
        </div>
      </div>

      <div className={styles.right}>
        {/* Focus mode button */}
        {onFocus && (
          <button className={styles.focusBtn} onClick={onFocus} title="Enter focus mode (F)">
            🎯 <span className={styles.focusBtnLabel}>Focus</span>
          </button>
        )}

        {/* Keyboard shortcuts */}
        {onShortcuts && (
          <button className={styles.shortcutBtn} onClick={onShortcuts} title="Keyboard shortcuts (?)">
            ⌨️
          </button>
        )}

        <div className={styles.streak} title={streak > 0 ? `${streak} day streak!` : 'Start a streak by completing a task!'}>
          🔥 <span>{streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : '0 days'}</span>
        </div>
        <NotificationBell tasks={tasks} />
        <button className={styles.avatarBtn} onClick={() => navigate('/profile')}>
          <Avatar username={user?.username || '?'} color={user?.avatarColor} size={32} />
          <span className={styles.username}>{user?.username}</span>
        </button>
      </div>
    </header>
  );
}
