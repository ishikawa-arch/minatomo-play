import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】もっともっとまねして！ ==========
const BTNS = [
  { id:0, color:'#E53935', light:'#EF9A9A' },
  { id:1, color:'#1E88E5', light:'#90CAF9' },
  { id:2, color:'#FDD835', light:'#FFF59D' },
  { id:3, color:'#43A047', light:'#A5D6A7' },
  { id:4, color:'#FB8C00', light:'#FFCC80' },
  { id:5, color:'#8E24AA', light:'#CE93D8' },
  { id:6, color:'#00ACC1', light:'#80DEEA' },
  { id:7, color:'#F06292', light:'#F8BBD0' },
];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    let seqLen;
    if (i < 2) seqLen = 3;
    else if (i < 4) seqLen = 4;
    else if (i < 7) seqLen = 5;
    else if (i < 10) seqLen = 6;
    else seqLen = 7;

    const seq = [];
    for (let j = 0; j < seqLen; j++) {
      seq.push(Math.floor(Math.random() * 8));
    }
    const speed = Math.max(280, 480 - i * 16);
    rounds.push({ seq, speed });
  }
  return rounds;
}

export default function SimpleHardestSimon() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0, correct:0,
    phase:'idle', litBtn:null, inputIdx:0, feedback:null,
  }).current;

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    g.rounds = genRounds(12);
    g.currentR = 0; g.score = 0; g.correct = 0;
    g.phase = 'idle'; g.litBtn = null; g.inputIdx = 0; g.feedback = null;
    setScreen('play');
    rerender();
    timerRef.current = setTimeout(() => playSequence(0), 600);
  };

  const playSequence = (roundIdx) => {
    g.currentR = roundIdx;
    g.phase = 'showing';
    g.inputIdx = 0;
    g.feedback = null;
    g.litBtn = null;
    rerender();

    const round = g.rounds[roundIdx];
    const seq = round.seq;
    const speed = round.speed;
    let i = 0;

    const showNext = () => {
      if (i >= seq.length) {
        g.litBtn = null;
        g.phase = 'input';
        rerender();
        return;
      }
      g.litBtn = seq[i];
      rerender();
      timerRef.current = setTimeout(() => {
        g.litBtn = null;
        rerender();
        i++;
        timerRef.current = setTimeout(showNext, 180);
      }, speed);
    };

    timerRef.current = setTimeout(showNext, 400);
  };

  const handleTap = (btnId) => {
    if (g.phase !== 'input') return;
    const seq = g.rounds[g.currentR].seq;
    const expected = seq[g.inputIdx];

    if (btnId === expected) {
      g.litBtn = btnId;
      g.inputIdx++;
      rerender();

      timerRef.current = setTimeout(() => {
        g.litBtn = null;
        if (g.inputIdx >= seq.length) {
          g.feedback = 'correct';
          g.correct++;
          g.score += 10 * seq.length;
          g.phase = 'feedback';
          rerender();
          timerRef.current = setTimeout(() => nextRound(), 800);
        } else {
          rerender();
        }
      }, 180);
    } else {
      g.litBtn = btnId;
      g.feedback = 'wrong';
      g.phase = 'feedback';
      rerender();
      timerRef.current = setTimeout(() => nextRound(), 1200);
    }
  };

  const nextRound = () => {
    g.litBtn = null;
    g.feedback = null;
    if (g.currentR + 1 >= g.rounds.length) {
      setScreen('done');
      rerender();
    } else {
      playSequence(g.currentR + 1);
    }
  };

  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.12s' };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      {/* TOP BAR */}
      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:17, fontWeight:900, color:'#E8652E', letterSpacing:'0.06em' }}>🔥 もっともっとまねして！</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* ===== START ===== */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'50px 20px', textAlign:'center', minHeight:'70vh' }}>
          {/* Visual demo - 8 color buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:24 }}>
            {BTNS.map((b, i) => (
              <div key={i} style={{
                width:48, height:48, borderRadius:12,
                background: i === 2 ? b.light : b.color,
                border: `3px solid ${i === 2 ? 'white' : 'transparent'}`,
                boxShadow: i === 2 ? `0 0 14px ${b.light}` : 'none',
                opacity: i === 2 ? 1 : 0.6,
              }} />
            ))}
          </div>

          <div style={{ fontSize:24, fontWeight:900, color:'#E8652E', marginBottom:6, letterSpacing:'0.06em' }}>🔥 ちょうせん！</div>
          <div style={{ fontSize:22, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            8色でまねしよう！
          </div>
          <div style={{ fontSize:15, color:'#9E9E9E', marginBottom:36 }}>
            ひかった順にタップ！
          </div>

          <button onClick={startGame} style={{
            ...bs, fontSize:28, fontWeight:900, color:'white',
            background:'#E8652E', border:'none',
            padding:'24px 64px', borderRadius:60,
            letterSpacing:'0.1em',
            boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
          }}>
            はじめる
          </button>
        </div>
      )}

      {/* ===== PLAY ===== */}
      {screen === 'play' && (
        <div style={{ padding:'12px 16px', maxWidth:580, margin:'0 auto' }}>

          {/* Progress */}
          <div style={{ display:'flex', gap:3, justifyContent:'center', marginBottom:10 }}>
            {g.rounds.map((_, i) => (
              <div key={i} style={{
                width: i === g.currentR ? 12 : 8, height:8, borderRadius:4,
                background: i < g.currentR ? '#8BC34A' : i === g.currentR ? '#E8652E' : '#E0E0E0',
              }} />
            ))}
          </div>

          {/* Score */}
          <div style={{ textAlign:'center', marginBottom:8 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, color:'#E8652E' }}>{g.score}</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#9E9E9E', marginLeft:4 }}>てん</span>
          </div>

          {/* Phase indicator */}
          <div style={{ textAlign:'center', marginBottom:6, minHeight:48 }}>
            {g.phase === 'showing' && (
              <span style={{ fontSize:20, fontWeight:900, color:'#E8652E', animation:'fadeUp 0.3s ease-out' }}>みてね！</span>
            )}
            {g.phase === 'input' && (
              <span style={{ fontSize:20, fontWeight:900, color:'#333', animation:'fadeUp 0.3s ease-out' }}>おなじ順にタップ！</span>
            )}
            {g.phase === 'feedback' && g.feedback === 'correct' && (
              <span style={{ fontSize:44, animation:'pop 0.3s ease-out' }}>⭕</span>
            )}
            {g.phase === 'feedback' && g.feedback === 'wrong' && (
              <span style={{ fontSize:44, animation:'shake 0.3s' }}>❌</span>
            )}
          </div>

          {/* Input progress dots */}
          {g.phase === 'input' && g.rounds[g.currentR] && (
            <div style={{ display:'flex', justifyContent:'center', gap:5, marginBottom:8 }}>
              {g.rounds[g.currentR].seq.map((_, i) => (
                <div key={i} style={{
                  width:10, height:10, borderRadius:'50%',
                  background: i < g.inputIdx ? '#66BB6A' : '#E0E0E0',
                  border: i === g.inputIdx ? '2px solid #E8652E' : '2px solid transparent',
                  transition:'all 0.2s',
                }} />
              ))}
            </div>
          )}
          {g.phase !== 'input' && <div style={{ height:18, marginBottom:8 }} />}

          {/* 8 color buttons - 4x2 grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, maxWidth:360, margin:'0 auto' }}>
            {BTNS.map((b) => {
              const isLit = g.litBtn === b.id;
              return (
                <button key={b.id}
                  onClick={() => handleTap(b.id)}
                  style={{
                    ...bs,
                    height:80, borderRadius:16,
                    background: isLit ? b.light : b.color,
                    border: `4px solid ${isLit ? 'white' : 'rgba(0,0,0,0.1)'}`,
                    boxShadow: isLit ? `0 0 20px ${b.light}, 0 0 40px ${b.light}66` : `0 3px 0 rgba(0,0,0,0.15)`,
                    transform: isLit ? 'scale(1.08)' : 'scale(1)',
                    pointerEvents: g.phase === 'input' ? 'auto' : 'none',
                    userSelect:'none', WebkitUserSelect:'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ===== DONE ===== */}
      {screen === 'done' && (() => {
        const total = g.rounds.length;
        const pct = g.correct / total;
        const emoji = pct >= 0.8 ? '🔥' : pct >= 0.5 ? '🎉' : '👍';
        const msg = pct >= 0.8 ? 'てんさい！' : pct >= 0.5 ? 'すごい！' : 'またやろう！';

        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
            <div style={{ fontSize:80, marginBottom:16, animation:'pop 0.6s ease-out' }}>{emoji}</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#E8652E', marginBottom:12, letterSpacing:'0.08em' }}>{msg}</div>

            <div style={{ background:'white', borderRadius:24, padding:'20px 40px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900, color:'#E8652E' }}>
                {g.score}<span style={{ fontSize:20, color:'#9E9E9E' }}>てん</span>
              </div>
            </div>

            <div style={{ fontSize:20, fontWeight:700, color:'#6B6B6B', marginBottom:40 }}>
              {g.correct}もん せいかい / {total}もん
            </div>

            <button onClick={startGame} style={{
              ...bs, fontSize:24, fontWeight:900, color:'white',
              background:'#E8652E', border:'none',
              padding:'22px 48px', borderRadius:60,
              letterSpacing:'0.08em',
              boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
            }}>
              もういちど
            </button>
          </div>
        );
      })()}
    </div>
  );
}
