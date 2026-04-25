import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】みどりでタップ！ ==========
const COLORS = [
  { color:'#43A047', name:'みどり', isGo:true },
  { color:'#E53935', name:'あか', isGo:false },
  { color:'#1E88E5', name:'あお', isGo:false },
  { color:'#FDD835', name:'きいろ', isGo:false },
];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    // ~40% green (Go), ~60% others (NoGo)
    let pool;
    if (i < 5) {
      // Easy: only green and red
      pool = Math.random() < 0.45 ? COLORS[0] : COLORS[1];
    } else {
      // Hard: all 4 colors
      pool = Math.random() < 0.4 ? COLORS[0] : COLORS[1 + Math.floor(Math.random() * 3)];
    }
    // Display time gets shorter
    const displayTime = Math.max(1200, 2200 - i * 70);
    rounds.push({ ...pool, displayTime });
  }
  return rounds;
}

export default function SimpleGreenTap() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0,
    hits:0, misses:0, falseAlarms:0, correct:0,
    phase:'idle', // blank, showing, feedback
    feedback:null, tapped:false,
    rts:[],
    startTime:0,
  }).current;

  const timerRef = useRef(null);
  const autoRef = useRef(null);
  useEffect(() => () => { clearTimeout(timerRef.current); clearTimeout(autoRef.current); }, []);

  const startGame = () => {
    g.rounds = genRounds(15);
    g.currentR = 0; g.score = 0;
    g.hits = 0; g.misses = 0; g.falseAlarms = 0; g.correct = 0;
    g.feedback = null; g.tapped = false; g.rts = [];
    setScreen('play'); rerender();
    timerRef.current = setTimeout(() => showNext(0), 600);
  };

  const showNext = (idx) => {
    if (idx >= g.rounds.length) {
      setScreen('done'); rerender();
      return;
    }
    g.currentR = idx;
    g.phase = 'showing';
    g.tapped = false;
    g.feedback = null;
    g.startTime = Date.now();
    rerender();

    // Auto-advance after displayTime
    autoRef.current = setTimeout(() => {
      if (!g.tapped) {
        const round = g.rounds[idx];
        if (round.isGo) {
          // Missed a green!
          g.misses++;
          g.feedback = 'miss';
        } else {
          // Correctly didn't tap
          g.correct++;
          g.score += 5;
          g.feedback = 'good-nogo';
        }
        g.phase = 'feedback'; rerender();
        timerRef.current = setTimeout(() => {
          g.phase = 'blank'; rerender();
          timerRef.current = setTimeout(() => showNext(idx + 1), 300);
        }, round.isGo ? 800 : 400);
      }
    }, g.rounds[idx].displayTime);
  };

  const handleTap = () => {
    if (g.phase !== 'showing' || g.tapped) return;
    g.tapped = true;
    clearTimeout(autoRef.current);
    const round = g.rounds[g.currentR];
    const rt = Date.now() - g.startTime;

    if (round.isGo) {
      // Correct tap on green
      g.hits++;
      g.correct++;
      g.rts.push(rt);
      g.score += 10 + Math.max(0, Math.round((800 - rt) / 50));
      g.feedback = 'hit';
    } else {
      // Tapped on wrong color!
      g.falseAlarms++;
      g.feedback = 'false-alarm';
    }
    g.phase = 'feedback'; rerender();

    timerRef.current = setTimeout(() => {
      g.phase = 'blank'; rerender();
      timerRef.current = setTimeout(() => showNext(g.currentR + 1), 300);
    }, round.isGo ? 500 : 800);
  };

  const round = g.currentR < g.rounds.length ? g.rounds[g.currentR] : null;
  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.15s' };
  const avgRT = g.rts.length > 0 ? Math.round(g.rts.reduce((a,b) => a+b, 0) / g.rts.length) : 0;

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.5)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes colorPop{0%{transform:scale(0)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>🟢 みどりでタップ！</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:8 }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'#43A047', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:22, color:'white', fontWeight:900 }}>⭕</span>
            </div>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'#E53935', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:22, color:'white', fontWeight:900 }}>✕</span>
            </div>
          </div>
          <div style={{ fontSize:14, color:'#9E9E9E', marginBottom:28 }}>みどり→タップ！　あか→がまん！</div>

          <div style={{ fontSize:26, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            みどりだけタップ！
          </div>
          <div style={{ fontSize:16, color:'#9E9E9E', marginBottom:40 }}>
            ほかの色はがまんしよう
          </div>

          <button onClick={startGame} style={{
            ...bs, fontSize:28, fontWeight:900, color:'white',
            background:'#E8652E', border:'none',
            padding:'24px 64px', borderRadius:60,
            boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
          }}>はじめる</button>
        </div>
      )}

      {/* PLAY */}
      {screen === 'play' && (
        <div style={{ padding:'16px', maxWidth:580, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:3, justifyContent:'center', marginBottom:12 }}>
            {g.rounds.map((_, i) => (
              <div key={i} style={{
                width: i === g.currentR ? 10 : 6, height:6, borderRadius:3,
                background: i < g.currentR ? '#8BC34A' : i === g.currentR ? '#E8652E' : '#E0E0E0',
              }} />
            ))}
          </div>

          <div style={{ textAlign:'center', marginBottom:16 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, color:'#E8652E' }}>{g.score}</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#9E9E9E', marginLeft:4 }}>てん</span>
            {g.falseAlarms > 0 && (
              <span style={{ fontSize:14, fontWeight:700, color:'#C62828', marginLeft:12 }}>おてつき {g.falseAlarms}</span>
            )}
          </div>

          {/* Big circle area */}
          <div
            onClick={handleTap}
            style={{
              width:'100%', height:320, borderRadius:24,
              background:'white', border:'2px solid #E8E8E8',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              cursor: g.phase === 'showing' ? 'pointer' : 'default',
              userSelect:'none', WebkitUserSelect:'none',
            }}>

            {/* Blank state */}
            {g.phase === 'blank' && (
              <span style={{ fontSize:24, color:'#E0E0E0', fontWeight:700 }}>・・・</span>
            )}
            {g.phase === 'idle' && (
              <span style={{ fontSize:24, color:'#E0E0E0', fontWeight:700 }}>・・・</span>
            )}

            {/* Color showing */}
            {g.phase === 'showing' && round && (
              <div style={{ animation:'colorPop 0.2s ease-out' }}>
                <div style={{
                  width:160, height:160, borderRadius:'50%',
                  background:round.color,
                  boxShadow:`0 8px 32px ${round.color}44`,
                }} />
              </div>
            )}

            {/* Feedback */}
            {g.phase === 'feedback' && (
              <div style={{ textAlign:'center', animation:'fadeUp 0.2s ease-out' }}>
                {g.feedback === 'hit' && (
                  <div>
                    <span style={{ fontSize:56 }}>⭕</span>
                    <div style={{ fontFamily:'Outfit', fontSize:18, fontWeight:800, color:'#555', marginTop:4 }}>{g.rts[g.rts.length-1]}ms</div>
                  </div>
                )}
                {g.feedback === 'false-alarm' && (
                  <div style={{ animation:'shake 0.3s' }}>
                    <span style={{ fontSize:56 }}>❌</span>
                    <div style={{ fontSize:18, fontWeight:900, color:'#C62828', marginTop:4 }}>おてつき！</div>
                  </div>
                )}
                {g.feedback === 'miss' && (
                  <div>
                    <span style={{ fontSize:56 }}>⏰</span>
                    <div style={{ fontSize:18, fontWeight:900, color:'#999', marginTop:4 }}>みどりだったよ！</div>
                  </div>
                )}
                {g.feedback === 'good-nogo' && (
                  <div>
                    <span style={{ fontSize:40 }}>✋</span>
                    <div style={{ fontSize:16, fontWeight:700, color:'#555', marginTop:4 }}>がまんできた！</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reminder */}
          <div style={{ textAlign:'center', marginTop:10, fontSize:14, fontWeight:700, color:'#9E9E9E' }}>
            🟢 みどり → タップ！　　ほかの色 → がまん！
          </div>
        </div>
      )}

      {/* DONE */}
      {screen === 'done' && (() => {
        const total = g.rounds.length;
        const pct = g.correct / total;
        const emoji = pct >= 0.8 ? '🎉' : pct >= 0.5 ? '👍' : '😊';
        const msg = pct >= 0.8 ? 'すごい！' : pct >= 0.5 ? 'いいね！' : 'またやろう！';
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
            <div style={{ fontSize:80, marginBottom:16, animation:'pop 0.6s ease-out' }}>{emoji}</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#E8652E', marginBottom:12 }}>{msg}</div>
            <div style={{ background:'white', borderRadius:24, padding:'20px 40px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:8 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900, color:'#E8652E' }}>
                {g.score}<span style={{ fontSize:20, color:'#9E9E9E' }}>てん</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:8 }}>
              {avgRT > 0 && <div style={{ fontSize:15, fontWeight:700, color:'#555' }}>はやさ <span style={{ fontFamily:'Outfit', fontWeight:900 }}>{avgRT}ms</span></div>}
              {g.falseAlarms > 0 && <div style={{ fontSize:15, fontWeight:700, color:'#C62828' }}>おてつき <span style={{ fontFamily:'Outfit', fontWeight:900 }}>{g.falseAlarms}</span>かい</div>}
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:'#6B6B6B', marginBottom:40 }}>{g.correct}もん せいかい / {total}もん</div>
            <button onClick={startGame} style={{
              ...bs, fontSize:24, fontWeight:900, color:'white',
              background:'#E8652E', border:'none',
              padding:'22px 48px', borderRadius:60,
              boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
            }}>もういちど</button>
          </div>
        );
      })()}
    </div>
  );
}
