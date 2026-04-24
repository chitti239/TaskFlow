import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import styles from '../styles/PomodoroPage.module.css';

const BASE = 'http://localhost:5000/api';
const WORK=25*60, BREAK=5*60;

/* ── Ambient Sound Player ─────────────────────────────── */
const VIBES = [
  { id:'rain',    label:'🌧️ Rain',       color:'#3b82f6', desc:'Steady downpour' },
  { id:'cafe',    label:'☕ Café',        color:'#b45309', desc:'Chatter & cups' },
  { id:'forest',  label:'🌲 Forest',      color:'#22c55e', desc:'Birds & breeze' },
  { id:'waves',   label:'🌊 Waves',       color:'#0891b2', desc:'Ocean rhythm' },
  { id:'fire',    label:'🔥 Fireplace',   color:'#ef4444', desc:'Crackling warmth' },
  { id:'space',   label:'🌌 Space Hum',  color:'#8b5cf6', desc:'Deep focus drone' },
];

function makeRainNode(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1200;
  src.connect(lp); return { src, out: lp };
}

function makeCafeNode(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 0.5;
  src.connect(bp); return { src, out: bp };
}

function makeForestNode(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2000;
  src.connect(hp); return { src, out: hp };
}

function makeWavesNode(ctx) {
  const bufLen = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    const wave = Math.sin(i / ctx.sampleRate * 0.3) * 0.5 + 0.5;
    data[i] = (Math.random() * 2 - 1) * wave * 0.7;
  }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  src.connect(lp); return { src, out: lp };
}

function makeFireNode(ctx) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  const gain = ctx.createGain(); gain.gain.value = 0.9;
  src.connect(lp); lp.connect(gain); return { src, out: gain };
}

function makeSpaceNode(ctx) {
  const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 40;
  const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 43;
  const merge = ctx.createGain(); merge.gain.value = 0.4;
  osc.connect(merge); osc2.connect(merge);
  return { src: osc, src2: osc2, out: merge };
}

const MAKERS = { rain: makeRainNode, cafe: makeCafeNode, forest: makeForestNode, waves: makeWavesNode, fire: makeFireNode, space: makeSpaceNode };

function AmbientPlayer() {
  const [active, setActive] = useState(null);
  const [vol, setVol] = useState(0.4);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const nodeRef = useRef(null);

  const stop = () => {
    if (nodeRef.current) {
      try { nodeRef.current.src?.stop(); nodeRef.current.src2?.stop(); } catch {}
      nodeRef.current = null;
    }
    setActive(null);
  };

  const play = (id) => {
    if (active === id) { stop(); return; }
    // Stop current
    if (nodeRef.current) { try { nodeRef.current.src?.stop(); nodeRef.current.src2?.stop(); } catch {} }
    // Init context
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterRef.current = ctxRef.current.createGain();
      masterRef.current.gain.value = vol;
      masterRef.current.connect(ctxRef.current.destination);
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    const node = MAKERS[id](ctxRef.current);
    node.out.connect(masterRef.current);
    node.src.start();
    if (node.src2) node.src2.start();
    nodeRef.current = node;
    setActive(id);
  };

  const changeVol = (v) => {
    setVol(v);
    if (masterRef.current) masterRef.current.gain.value = v;
  };

  useEffect(() => () => stop(), []);

  return (
    <div className={styles.vibeCard}>
      <div className={styles.vibeTitle}>🎧 Ambient Sounds</div>
      <p className={styles.vibeSub}>Pick a vibe to study to.</p>
      <div className={styles.vibeGrid}>
        {VIBES.map(v => (
          <button key={v.id}
            className={`${styles.vibeBtn} ${active === v.id ? styles.vibeBtnActive : ''}`}
            style={active === v.id ? { borderColor: v.color, background: v.color + '18' } : {}}
            onClick={() => play(v.id)}>
            <span className={styles.vibeLabel}>{v.label}</span>
            <span className={styles.vibeDesc}>{v.desc}</span>
            {active === v.id && <span className={styles.vibeOn}>▶ Playing</span>}
          </button>
        ))}
      </div>
      {active && (
        <div className={styles.volRow}>
          <span className={styles.volIcon}>{vol < 0.2 ? '🔈' : vol < 0.6 ? '🔉' : '🔊'}</span>
          <input type="range" min="0" max="1" step="0.01" value={vol}
            onChange={e => changeVol(Number(e.target.value))} className={styles.volSlider} />
        </div>
      )}
    </div>
  );
}

/* ── Heatmap ─────────────────────────────────────────────── */
function Heatmap({ sessions }) {
  const weeks = 18;
  const days  = weeks * 7;
  const today = new Date(); today.setHours(0,0,0,0);
  const cells = [];
  for(let i=days-1;i>=0;i--){
    const d=new Date(today); d.setDate(d.getDate()-i);
    const key=d.toDateString();
    const s=sessions.find(s=>new Date(s.date).toDateString()===key);
    cells.push({date:d,count:s?s.count:0,key});
  }
  const max=Math.max(...cells.map(c=>c.count),1);
  const getColor=(c)=>{
    if(c===0) return 'var(--border)';
    const intensity=c/max;
    if(intensity<0.25) return '#bdd5f8';
    if(intensity<0.5)  return '#7ab0f0';
    if(intensity<0.75) return '#3a80e0';
    return '#1a50b0';
  };
  return (
    <div className={styles.heatmap}>
      <div className={styles.heatmapGrid} style={{gridTemplateRows:`repeat(7,1fr)`,gridTemplateColumns:`repeat(${weeks},1fr)`}}>
        {cells.map((c,i)=>(
          <div key={i} className={styles.cell} style={{background:getColor(c.count)}} title={`${c.date.toDateString()}: ${c.count} session${c.count!==1?'s':''}`}/>
        ))}
      </div>
      <div className={styles.heatmapLegend}>
        <span>Less</span>
        {['var(--border)','#bdd5f8','#7ab0f0','#3a80e0','#1a50b0'].map((c,i)=>(
          <div key={i} style={{width:12,height:12,background:c,borderRadius:2}}/>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(WORK);
  const [running, setRunning]   = useState(false);
  const [isBreak, setIsBreak]   = useState(false);
  const [sessions, setSessions] = useState(0);
  const [history, setHistory]   = useState([]);
  const intervalRef = useRef(null);
  const token = localStorage.getItem('tf_token');
  const headers = { Authorization:`Bearer ${token}` };

  useEffect(() => {
    axios.get(`${BASE}/pomodoro`,{headers}).then(r=>setHistory(r.data)).catch(()=>{});
  }, [sessions]);

  useEffect(() => {
    if(running){
      intervalRef.current=setInterval(()=>{
        setTimeLeft(t=>{
          if(t<=1){
            clearInterval(intervalRef.current); setRunning(false);
            if(!isBreak){ setSessions(s=>s+1); setIsBreak(true); setTimeLeft(BREAK); axios.post(`${BASE}/pomodoro`,{},{headers}).catch(()=>{}); }
            else{ setIsBreak(false); setTimeLeft(WORK); }
            return 0;
          }
          return t-1;
        });
      },1000);
    }
    return ()=>clearInterval(intervalRef.current);
  },[running,isBreak]);

  const reset=()=>{ setRunning(false); setTimeLeft(isBreak?BREAK:WORK); };
  const skip=()=>{ setRunning(false); if(!isBreak){setSessions(s=>s+1);setIsBreak(true);setTimeLeft(BREAK);}else{setIsBreak(false);setTimeLeft(WORK);}};

  const mins=String(Math.floor(timeLeft/60)).padStart(2,'0');
  const secs=String(timeLeft%60).padStart(2,'0');
  const pct=isBreak?((BREAK-timeLeft)/BREAK)*100:((WORK-timeLeft)/WORK)*100;
  const totalToday=history.find(s=>new Date(s.date).toDateString()===new Date().toDateString())?.count||0;

  return (
    <div>
      <h1 className={styles.title}>⏱ Pomodoro</h1>
      <p className={styles.sub}>Stay focused. 25 minutes work, 5 minutes break.</p>

      <div className={styles.layout}>
        <div className={styles.timerCard}>
          <div className={styles.modeLabel}>{isBreak?'☕ Break time':'🎯 Focus session'}</div>
          <div className={styles.ring}>
            <svg viewBox="0 0 160 160" className={styles.svg}>
              <circle cx="80" cy="80" r="68" fill="none" stroke="var(--border)" strokeWidth="8"/>
              <circle cx="80" cy="80" r="68" fill="none" stroke={isBreak?'#27a05a':'var(--accent)'} strokeWidth="8"
                strokeDasharray={`${2*Math.PI*68}`} strokeDashoffset={`${2*Math.PI*68*(1-pct/100)}`}
                strokeLinecap="round" transform="rotate(-90 80 80)" style={{transition:'stroke-dashoffset 0.9s linear'}}/>
            </svg>
            <div className={styles.timerText}>{mins}:{secs}</div>
          </div>
          <div className={styles.controls}>
            <button className={styles.mainBtn} onClick={()=>setRunning(r=>!r)}>{running?'Pause':'Start'}</button>
            <button className={styles.smBtn} onClick={reset}>Reset</button>
            <button className={styles.smBtn} onClick={skip}>Skip</button>
          </div>
          <div className={styles.sessionInfo}>
            <span>Today: <strong>{totalToday+sessions} sessions</strong></span>
            <span>This run: <strong>{sessions}</strong></span>
          </div>
        </div>

        <div className={styles.rightCol}>
          <AmbientPlayer />
          <div className={styles.heatmapCard}>
            <div className={styles.heatmapTitle}>Session History</div>
            <Heatmap sessions={history} />
            <p className={styles.heatmapSub}>Each square = one day. Darker = more sessions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
