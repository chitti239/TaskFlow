import { useState, useEffect, useRef, useCallback } from 'react';
import styles from '../styles/BrainBreakPage.module.css';

/* ── Reaction Test ─────────────────────────────────────── */
function ReactionGame() {
  const [phase, setPhase] = useState('idle'); // idle | waiting | ready | done
  const [result, setResult] = useState(null);
  const [best, setBest] = useState(() => Number(localStorage.getItem('tf_reaction_best')) || null);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  const start = () => {
    setPhase('waiting');
    setResult(null);
    const delay = 2000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => {
      setPhase('ready');
      startRef.current = Date.now();
    }, delay);
  };

  const click = () => {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setPhase('idle');
      setResult({ ms: null, msg: '😬 Too early! Wait for green.' });
      return;
    }
    if (phase === 'ready') {
      const ms = Date.now() - startRef.current;
      const newBest = best === null || ms < best ? ms : best;
      setBest(newBest);
      localStorage.setItem('tf_reaction_best', newBest);
      setPhase('done');
      const emoji = ms < 200 ? '⚡' : ms < 300 ? '🏃' : ms < 500 ? '🐢' : '🦥';
      const msg = ms < 200 ? 'Superhuman!!' : ms < 300 ? 'Sharp!' : ms < 500 ? 'Not bad!' : 'Keep practicing!';
      setResult({ ms, msg, emoji });
    }
  };

  const reset = () => { setPhase('idle'); setResult(null); };

  const bg = phase === 'waiting' ? '#ef4444' : phase === 'ready' ? '#22c55e' : 'var(--surface)';

  return (
    <div className={styles.gameCard}>
      <div className={styles.gameTitle}>⚡ Reaction Test</div>
      <p className={styles.gameSub}>Click as fast as you can when it turns green!</p>

      <div className={styles.reactionBox} style={{ background: bg }} onClick={phase === 'idle' || phase === 'done' ? undefined : click}>
        {phase === 'idle' && <button className={styles.startBtn} onClick={start}>Start</button>}
        {phase === 'waiting' && <span className={styles.reactionMsg} onClick={click}>Wait…</span>}
        {phase === 'ready' && <span className={styles.reactionMsg} onClick={click}>Click!</span>}
        {phase === 'done' && result && (
          <div className={styles.reactionResult}>
            <div className={styles.reactionEmoji}>{result.emoji}</div>
            <div className={styles.reactionMs}>{result.ms}ms</div>
            <div className={styles.reactionLabel}>{result.msg}</div>
            {best && <div className={styles.reactionBest}>Best: {best}ms</div>}
            <button className={styles.startBtn} onClick={start} style={{ marginTop: 12 }}>Try again</button>
          </div>
        )}
      </div>
      {result?.msg === '😬 Too early! Wait for green.' && (
        <div className={styles.earlyMsg}>{result.msg} <button className={styles.linkBtn} onClick={reset}>Reset</button></div>
      )}
    </div>
  );
}

/* ── Memory Tiles ──────────────────────────────────────── */
const EMOJIS = ['🍕','🎸','🌙','🦊','🍉','⚽','🎲','🌸','🦋','🔮','🌈','🎯'];

function MemoryGame() {
  const [size, setSize] = useState(8); // pairs
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const lockRef = useRef(false);

  const init = useCallback((n = size) => {
    const pool = EMOJIS.slice(0, n);
    const deck = [...pool, ...pool].map((e, i) => ({ id: i, emoji: e }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setWon(false);
    setStarted(true);
    lockRef.current = false;
  }, [size]);

  const flip = (idx) => {
    if (lockRef.current) return;
    if (flipped.includes(idx) || matched.includes(cards[idx].emoji)) return;

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      lockRef.current = true;
      const [a, b] = next;
      if (cards[a].emoji === cards[b].emoji) {
        const newMatched = [...matched, cards[a].emoji];
        setMatched(newMatched);
        setFlipped([]);
        lockRef.current = false;
        if (newMatched.length === size) setWon(true);
      } else {
        setTimeout(() => { setFlipped([]); lockRef.current = false; }, 900);
      }
    }
  };

  const cols = size <= 6 ? 3 : 4;

  return (
    <div className={styles.gameCard}>
      <div className={styles.gameTitle}>🧠 Memory Tiles</div>
      <p className={styles.gameSub}>Find all matching pairs!</p>

      {!started ? (
        <div className={styles.memorySetup}>
          <div className={styles.diffRow}>
            {[{n:6,l:'Easy'},{n:8,l:'Medium'},{n:12,l:'Hard'}].map(({n,l}) => (
              <button key={n} className={`${styles.diffBtn} ${size===n?styles.diffActive:''}`} onClick={() => setSize(n)}>{l}</button>
            ))}
          </div>
          <button className={styles.startBtn} onClick={() => init(size)}>Play</button>
        </div>
      ) : won ? (
        <div className={styles.wonBox}>
          <div className={styles.wonEmoji}>🎉</div>
          <div className={styles.wonText}>Cleared in <strong>{moves}</strong> moves!</div>
          <div className={styles.wonRating}>{moves <= size + 2 ? '🏆 Perfect!' : moves <= size + 6 ? '⭐ Great!' : '👍 Well done!'}</div>
          <div className={styles.diffRow} style={{ justifyContent: 'center' }}>
            {[{n:6,l:'Easy'},{n:8,l:'Medium'},{n:12,l:'Hard'}].map(({n,l}) => (
              <button key={n} className={`${styles.diffBtn} ${size===n?styles.diffActive:''}`} onClick={() => setSize(n)}>{l}</button>
            ))}
          </div>
          <button className={styles.startBtn} onClick={() => init(size)}>Play again</button>
        </div>
      ) : (
        <>
          <div className={styles.memoryStats}>Moves: <strong>{moves}</strong> · Pairs left: <strong>{size - matched.length}</strong></div>
          <div className={styles.memoryGrid} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {cards.map((card, idx) => {
              const isFlipped = flipped.includes(idx) || matched.includes(card.emoji);
              return (
                <button key={idx} className={`${styles.memCard} ${isFlipped ? styles.memCardFlipped : ''} ${matched.includes(card.emoji) ? styles.memCardMatched : ''}`}
                  onClick={() => flip(idx)}>
                  <span className={styles.memFront}>?</span>
                  <span className={styles.memBack}>{card.emoji}</span>
                </button>
              );
            })}
          </div>
          <button className={styles.linkBtn} onClick={() => setStarted(false)}>Quit</button>
        </>
      )}
    </div>
  );
}

/* ── Word Scramble ─────────────────────────────────────── */
const WORDS = [
  {word:'PYTHON', hint:'A snake AND a language'},
  {word:'BINARY', hint:'Zeros and ones vibes'},
  {word:'RECURSION', hint:'A function that calls itself... calls itself...'},
  {word:'ALGORITHM', hint:'Step by step recipe for a computer'},
  {word:'DEADLINE', hint:'The thing you are probably avoiding right now'},
  {word:'DATABASE', hint:'Where your data lives rent-free'},
  {word:'KEYBOARD', hint:'You\'re probably using one right now'},
  {word:'CAFFEINE', hint:'Student\'s primary fuel source'},
  {word:'DEBUGGING', hint:'90% of programming is this'},
  {word:'VARIABLE', hint:'A box that holds stuff'},
  {word:'FUNCTION', hint:'A reusable action'},
  {word:'COMPILER', hint:'The strict grammar teacher of code'},
  {word:'OVERFLOW', hint:'Stack ___? You\'ve been there.'},
  {word:'SEMESTER', hint:'The unit of academic suffering'},
  {word:'CLIPBOARD', hint:'Copy paste hero'},
];

function scramble(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word ? scramble(word) : result;
}

function WordScramble() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WORDS.length));
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('playing'); // playing | correct | wrong
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const inputRef = useRef(null);

  const nextWord = useCallback((newIdx) => {
    const i = newIdx ?? Math.floor(Math.random() * WORDS.length);
    setIdx(i);
    setScrambled(scramble(WORDS[i].word));
    setInput('');
    setStatus('playing');
    setShowHint(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => { nextWord(idx); }, []);

  const check = () => {
    if (input.toUpperCase() === WORDS[idx].word) {
      setStatus('correct');
      setScore(s => s + 1);
    } else {
      setStatus('wrong');
    }
  };

  return (
    <div className={styles.gameCard}>
      <div className={styles.gameTitle}>🔤 Word Scramble</div>
      <p className={styles.gameSub}>Unscramble the word — score: <strong>{score}</strong></p>

      <div className={styles.scrambleBox}>
        <div className={styles.scrambledWord}>{scrambled}</div>
        {showHint && <div className={styles.hint}>💡 {WORDS[idx].hint}</div>}

        {status === 'correct' ? (
          <div className={styles.scrambleCorrect}>
            ✅ <strong>{WORDS[idx].word}</strong> — nailed it!
            <button className={styles.startBtn} style={{ marginTop: 12 }} onClick={() => nextWord()}>Next word</button>
          </div>
        ) : status === 'wrong' ? (
          <div className={styles.scrambleWrong}>
            ❌ Not quite! Answer: <strong>{WORDS[idx].word}</strong>
            <button className={styles.startBtn} style={{ marginTop: 12 }} onClick={() => nextWord()}>Next word</button>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              className={styles.scrambleInput}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && check()}
              placeholder="Your answer…"
              autoComplete="off"
            />
            <div className={styles.scrambleBtns}>
              <button className={styles.startBtn} onClick={check}>Check</button>
              <button className={styles.linkBtn} onClick={() => setShowHint(h => !h)}>
                {showHint ? 'Hide hint' : 'Hint'}
              </button>
              <button className={styles.linkBtn} onClick={() => nextWord()}>Skip</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */
const BREAK_QUOTES = [
  "Your brain just ran a marathon. Let it stretch. 🧘",
  "Rest is not lazy. Rest is maintenance. 🔧",
  "You've been staring at text for hours. Here, have some dopamine. 🎮",
  "Science says breaks make you smarter. We're scientists now. 🧪",
  "Your brain cells called. They said 'please.' 📱",
  "Even Chrome needs to close tabs sometimes. 🌐",
];

export default function BrainBreakPage() {
  const quote = BREAK_QUOTES[new Date().getMinutes() % BREAK_QUOTES.length];

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>🎮 Brain Break</h1>
        <p className={styles.subtitle}>{quote}</p>
      </div>

      <div className={styles.grid}>
        <ReactionGame />
        <MemoryGame />
        <WordScramble />
      </div>
    </div>
  );
}
