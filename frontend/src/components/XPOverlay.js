import { useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import styles from '../styles/XPOverlay.module.css';

export function XPPopups() {
  const { xpPopups } = useGamification();
  return (
    <div className={styles.popupContainer}>
      {xpPopups.map(p => (
        <div key={p.id} className={styles.xpPopup}>
          +{p.amount} XP <span className={styles.popupReason}>{p.reason}</span>
        </div>
      ))}
    </div>
  );
}

export function LevelUpModal() {
  const { levelUpAnim, setLevelUpAnim } = useGamification();
  useEffect(() => {
    if (levelUpAnim) {
      const t = setTimeout(() => setLevelUpAnim(null), 4000);
      return () => clearTimeout(t);
    }
  }, [levelUpAnim, setLevelUpAnim]);

  if (!levelUpAnim) return null;
  return (
    <div className={styles.levelUpOverlay} onClick={() => setLevelUpAnim(null)}>
      <div className={styles.levelUpCard}>
        <div className={styles.levelUpStars}>✦ ✦ ✦</div>
        <div className={styles.levelUpLabel}>Level Up!</div>
        <div className={styles.levelUpNum} style={{ color: levelUpAnim.color }}>
          Level {levelUpAnim.level}
        </div>
        <div className={styles.levelUpTitle} style={{ color: levelUpAnim.color }}>
          {levelUpAnim.title}
        </div>
        <p className={styles.levelUpSub}>You're on a roll. Keep it up! 🚀</p>
        <div className={styles.levelUpRays} />
      </div>
    </div>
  );
}

export function XPBar() {
  const { xp, levelInfo } = useGamification();
  const { current, next, pct, xpInLevel, xpToNext } = levelInfo;

  return (
    <div className={styles.xpBar}>
      <div className={styles.xpBarLeft}>
        <span className={styles.xpLevel} style={{ background: current.color + '20', color: current.color, borderColor: current.color + '40' }}>
          Lv.{current.level}
        </span>
        <span className={styles.xpTitle}>{current.title}</span>
      </div>
      <div className={styles.xpBarTrack}>
        <div className={styles.xpBarFill} style={{ width: `${pct}%`, background: current.color }} />
      </div>
      <div className={styles.xpBarRight}>
        <span className={styles.xpNum}>{xpInLevel}<span className={styles.xpOf}>/{xpToNext} XP</span></span>
      </div>
    </div>
  );
}
