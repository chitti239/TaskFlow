import { useState, useRef, useEffect } from 'react';
import styles from '../styles/StudyBuddy.module.css';

const SYSTEM = `You are Buddy, a chill AI study companion for a student productivity app called TaskFlow. 
Your vibe: helpful, friendly, slightly funny — like a smart friend who actually did the readings. 
Keep replies SHORT (2-4 sentences max). Be direct and useful. 
You can help with: explaining concepts, quick quizzes, motivation, study tips, or just a quick chat.
If someone seems stressed, be warm and human about it.
Never be preachy. Never use bullet points unless they explicitly ask for a list.
Start responses naturally — no "Great question!" or "Certainly!".`;

const STARTERS = [
  "Explain recursion like I'm 5 🍕",
  "Give me a study tip for tonight",
  "Quiz me on a random CS concept",
  "I'm burnt out, help 😩",
  "What's the Pomodoro technique?",
];

export default function StudyBuddy() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "hey! I'm Buddy 👋 need help with something, or just want a distraction?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setLoading(true);

    try {
      const token = localStorage.getItem('tf_token');
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || "hmm, something went wrong on my end 😅";
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "wifi acting up? try again in a sec 📡" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "fresh start! what's up?" }]);
  };

  return (
    <>
      {/* FAB */}
      <button className={`${styles.fab} ${open ? styles.fabOpen : ''}`} onClick={() => setOpen(o => !o)}
        title="Study Buddy">
        {open ? '✕' : '🤖'}
      </button>

      {/* Drawer */}
      {open && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <div>
              <div className={styles.drawerTitle}>🤖 Buddy</div>
              <div className={styles.drawerSub}>Your AI study companion</div>
            </div>
            <button className={styles.clearBtn} onClick={clearChat} title="Clear chat">🗑️</button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgBuddy}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className={`${styles.msg} ${styles.msgBuddy}`}>
                <span className={styles.typing}><span/><span/><span/></span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick starters (only at the beginning) */}
          {messages.length <= 1 && (
            <div className={styles.starters}>
              {STARTERS.map(s => (
                <button key={s} className={styles.starterBtn} onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          <div className={styles.inputRow}>
            <input
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything…"
              disabled={loading}
            />
            <button className={styles.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}
