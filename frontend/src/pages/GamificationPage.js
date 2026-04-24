import { useOutletContext } from 'react-router-dom';
import { useGamification, getLevelInfo, LEVELS, XP_VALUES } from '../context/GamificationContext';
import styles from '../styles/GamificationPage.module.css';

function LevelRoadmap({ currentLevel }) {
  return (
    <div className={styles.roadmap}>
      {LEVELS.map((lvl, i) => {
        const done    = currentLevel > lvl.level;
        const current = currentLevel === lvl.level;
        return (
          <div key={lvl.level} className={`${styles.roadmapStep} ${done ? styles.done : ''} ${current ? styles.current : ''}`}>
            {i > 0 && <div className={`${styles.roadmapLine} ${done ? styles.lineDone : ''}`} />}
            <div className={styles.roadmapDot} style={done || current ? { background: lvl.color, borderColor: lvl.color } : {}}>
              {done ? '✓' : lvl.level}
            </div>
            <div className={styles.roadmapLabel}>{lvl.title}</div>
          </div>
        );
      })}
    </div>
  );
}

function ChallengeCard() {
  const { challenge, advanceChallenge } = useGamification();
  const pct = Math.round((challenge.progress / challenge.target) * 100);

  return (
    <div className={`${styles.challengeCard} ${challenge.completed ? styles.challengeDone : ''}`}>
      <div className={styles.challengeTop}>
        <div className={styles.challengeBadge}>
          {challenge.completed ? '✅ Completed!' : '🎯 Daily Challenge'}
        </div>
        <div className={styles.challengeXp}>+{challenge.xp} XP</div>
      </div>
      <div className={styles.challengeText}>{challenge.text}</div>
      <div className={styles.challengeProgress}>
        <div className={styles.challengeBar}>
          <div className={styles.challengeFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.challengeCount}>{challenge.progress}/{challenge.target}</span>
      </div>
      {!challenge.completed && (
        <p className={styles.challengeHint}>Complete tasks, study sessions, or flashcards to advance this challenge.</p>
      )}
    </div>
  );
}

function FreezeTokens() {
  const { freezeTokens, useFreeze, earnFreeze, addXp } = useGamification();
  const MAX = 5;

  return (
    <div className={styles.freezeCard}>
      <div className={styles.freezeTitle}>❄️ Streak Freeze Tokens</div>
      <p className={styles.freezeSub}>Use a token to protect your streak on a missed day.</p>
      <div className={styles.freezeIcons}>
        {[...Array(MAX)].map((_, i) => (
          <div key={i} className={`${styles.freezeIcon} ${i < freezeTokens ? styles.freezeActive : ''}`}>
            {i < freezeTokens ? '🧊' : '○'}
          </div>
        ))}
      </div>
      <div className={styles.freezeActions}>
        <button className={styles.freezeUseBtn} onClick={useFreeze} disabled={freezeTokens === 0}>
          Use token {freezeTokens === 0 ? '(none left)' : `(${freezeTokens} left)`}
        </button>
        <button className={styles.freezeEarnBtn} onClick={() => { earnFreeze(); addXp(-50, 'Bought freeze token'); }}>
          Buy token (50 XP)
        </button>
      </div>
    </div>
  );
}

function XpLog() {
  const history = JSON.parse(localStorage.getItem('tf_xp_history') || '[]').reverse().slice(0, 15);
  if (!history.length) return null;
  return (
    <div className={styles.logCard}>
      <div className={styles.logTitle}>Recent XP</div>
      <div className={styles.logList}>
        {history.map((h, i) => (
          <div key={i} className={styles.logRow}>
            <span className={styles.logXp}>+{h.xp}</span>
            <span className={styles.logReason}>{h.reason}</span>
            <span className={styles.logTime}>{new Date(h.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const XP_TABLE = [
  { action: 'Complete a task',          xp: XP_VALUES.TASK_COMPLETE   },
  { action: 'Complete high priority',   xp: `+${XP_VALUES.HIGH_PRIORITY} bonus` },
  { action: 'Complete before due date', xp: `+${XP_VALUES.BEFORE_DUE} bonus`    },
  { action: 'Pomodoro session',         xp: XP_VALUES.POMODORO_SESSION },
  { action: 'Flashcard review',         xp: XP_VALUES.FLASHCARD_REVIEW },
  { action: 'Daily challenge',          xp: XP_VALUES.DAILY_CHALLENGE  },
];

export default function GamificationPage() {
  const { tasks, streak } = useOutletContext();
  const { xp, levelInfo, freezeTokens } = useGamification();
  const { current, next, pct, xpInLevel, xpToNext } = levelInfo;

  const doneTasks = tasks.filter(t => t.done).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>🎮 Gamification</h1>
        <p className={styles.sub}>Level up your study game</p>
      </div>

      {/* Hero level card */}
      <div className={styles.heroCard} style={{ '--lvl-color': current.color }}>
        <div className={styles.heroLeft}>
          <div className={styles.heroLevel}>Level {current.level}</div>
          <div className={styles.heroTitle}>{current.title}</div>
          <div className={styles.heroXp}>{xp.toLocaleString()} total XP</div>
          <div className={styles.heroBarWrap}>
            <div className={styles.heroBar}>
              <div className={styles.heroBarFill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.heroBarLabel}>
              {xpInLevel} / {xpToNext} XP {next ? `→ ${next.title}` : '(Max level!)'}
            </div>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatVal}>{doneTasks}</div>
              <div className={styles.heroStatLbl}>tasks done</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatVal}>{streak}🔥</div>
              <div className={styles.heroStatLbl}>streak</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatVal}>{freezeTokens}❄️</div>
              <div className={styles.heroStatLbl}>freeze tokens</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.col}>
          <ChallengeCard />
          <FreezeTokens />
          <XpLog />
        </div>
        <div className={styles.col}>
          {/* Level roadmap */}
          <div className={styles.roadmapCard}>
            <div className={styles.roadmapTitle}>Level Roadmap</div>
            <LevelRoadmap currentLevel={current.level} />
          </div>

          {/* XP table */}
          <div className={styles.xpTableCard}>
            <div className={styles.xpTableTitle}>How to earn XP</div>
            <table className={styles.xpTable}>
              <tbody>
                {XP_TABLE.map((row, i) => (
                  <tr key={i}>
                    <td className={styles.xpTableAction}>{row.action}</td>
                    <td className={styles.xpTableVal}>+{row.xp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
