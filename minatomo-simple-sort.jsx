import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】ちいさいじゅん ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

const EMOJIS = ['🍎','🐱','⭐','🌸','🚗','🎈','🐟','🍰','☀️','🐸','❤️','🍊','🐧','🌻'];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    let numItems;
    if (i < 4) numItems = 3;
    else if (i < 8) numItems = 4;
    else numItems = 5;

    // Generate distinct sizes that fit within buttons
    const sizes = [];
    let baseSize, step;
    if (numItems <= 3) { baseSize = 24; step = 16; }      // 24, 40, 56 → max 56 in 100px btn
    else if (numItems <= 4) { baseSize = 22; step = 10; }  // 22, 32, 42, 52 → max 52 in 80px btn
    else { baseSize = 20; step = 8; }                      // 20, 28, 36, 44, 52 → max 52 in 68px btn
    for (let j = 0; j < numItems; j++) {
      sizes.push(baseSize + j * step);
    }
    // Correct order is sizes ascending (smallest first)
    const correctOrder = sizes.map((s, idx) => idx);
    // Shuffled display
    const displayOrder = shuffle(correctOrder.map(idx => ({ idx, size: sizes[idx] })));

    rounds.push({ emoji, sizes, displayOrder, numItems });
  }
  return rounds;
}

export default function SimpleSort() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0, correct:0,
    tapped:[], // indices tapped in order
    feedback:null,
  }).current;

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    g.rounds = genRounds(12);
    g.currentR = 0; g.score = 0; g.correct = 0;
    g.tapped = []; g.feedback = null;
    setScreen('play'); rerender();
  };

  const handleTap = (displayIdx) => {
    if (g.feedback) return;
    if (g.tapped.includes(displayIdx)) return;

    const round = g.rounds[g.currentR];
    const item = round.displayOrder[displayIdx];
    const expectedSizeIdx = g.tapped.length; // 0th tap should be smallest (idx 0), etc.

    if (item.idx === expectedSizeIdx) {
      // Correct order
      g.tapped.push(displayIdx);
      rerender();

      if (g.tapped.length >= round.numItems) {
        // All done!
        g.feedback = 'correct';
        g.correct++;
        g.score += 10 * round.numItems;
        rerender();
        timerRef.current = setTimeout(() => nextRound(), 800);
      }
    } else {
      // Wrong order
      g.feedback = 'wrong';
      rerender();
      timerRef.current = setTimeout(() => nextRound(), 1500);
    }
  };

  const nextRound = () => {
    g.tapped = []; g.feedback = null;
    g.currentR++;
    if (g.currentR >= g.rounds.length) { setScreen('done'); }
    rerender();
  };

  const round = g.currentR < g.rounds.length ? g.rounds[g.currentR] : null;
  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.15s' };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>📏 ちいさいじゅん</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginBottom:8 }}>
            <span style={{ fontSize:28 }}>🍎</span>
            <span style={{ fontSize:46 }}>🍎</span>
            <span style={{ fontSize:64 }}>🍎</span>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:24 }}>
            <span style={{ fontSize:16, fontWeight:900, color:'#66BB6A', background:'#F1F8E9', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>1</span>
            <span style={{ fontSize:16, fontWeight:900, color:'#66BB6A', background:'#F1F8E9', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>2</span>
            <span style={{ fontSize:16, fontWeight:900, color:'#66BB6A', background:'#F1F8E9', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>3</span>
          </div>

          <div style={{ fontSize:26, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            ちいさいものからタップ！
          </div>
          <div style={{ fontSize:16, color:'#9E9E9E', marginBottom:40 }}>
            ちいさい→おおきい のじゅんにえらぼう
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
      {screen === 'play' && round && (
        <div style={{ padding:'16px', maxWidth:580, margin:'0 auto', animation:'fadeUp 0.3s ease-out' }} key={g.currentR}>

          <div style={{ display:'flex', gap:3, justifyContent:'center', marginBottom:12 }}>
            {g.rounds.map((_, i) => (
              <div key={i} style={{
                width: i === g.currentR ? 12 : 8, height:8, borderRadius:4,
                background: i < g.currentR ? '#8BC34A' : i === g.currentR ? '#E8652E' : '#E0E0E0',
              }} />
            ))}
          </div>

          <div style={{ textAlign:'center', marginBottom:14 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, color:'#E8652E' }}>{g.score}</span>
            <span style={{ fontSize:14, fontWeight:700, color:'#9E9E9E', marginLeft:4 }}>てん</span>
          </div>

          <div style={{ fontSize:18, fontWeight:900, color:'#9E9E9E', textAlign:'center', marginBottom:8 }}>
            ちいさいものからタップ！
          </div>

          {/* Order progress */}
          <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:12 }}>
            {Array.from({ length: round.numItems }).map((_, i) => (
              <div key={i} style={{
                width:28, height:28, borderRadius:'50%',
                background: i < g.tapped.length ? '#66BB6A' : '#E0E0E0',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:14, fontWeight:900, color:'white',
                transition:'all 0.2s',
              }}>
                {i < g.tapped.length ? (i + 1) : ''}
              </div>
            ))}
          </div>

          {/* Feedback */}
          {g.feedback && (
            <div style={{ textAlign:'center', marginBottom:8, animation:'fadeUp 0.2s ease-out' }}>
              <span style={{ fontSize:48 }}>{g.feedback === 'correct' ? '⭕' : '❌'}</span>
            </div>
          )}
          {!g.feedback && <div style={{ height:56 }} />}

          {/* Items */}
          <div style={{
            display:'flex', gap:12, justifyContent:'center', alignItems:'center',
            flexWrap:'wrap',
          }}>
            {round.displayOrder.map((item, displayIdx) => {
              const isTapped = g.tapped.includes(displayIdx);
              const tapOrder = g.tapped.indexOf(displayIdx);
              const isCorrectAnswer = g.feedback === 'correct';

              return (
                <button key={displayIdx} onClick={() => handleTap(displayIdx)}
                  style={{
                    ...bs,
                    width: round.numItems <= 3 ? 100 : round.numItems <= 4 ? 80 : 68,
                    height: round.numItems <= 3 ? 100 : round.numItems <= 4 ? 80 : 68,
                    borderRadius:18,
                    background: isTapped ? '#F1F8E9' : 'white',
                    border: `4px solid ${isTapped ? '#66BB6A' : '#E8E8E8'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    position:'relative',
                    animation: g.feedback === 'wrong' && !isTapped ? 'shake 0.3s' : isTapped ? 'pop 0.2s ease-out' : undefined,
                    opacity: isTapped ? 0.5 : (g.feedback ? 0.4 : 1),
                    boxShadow: isTapped ? 'none' : '0 3px 10px rgba(0,0,0,0.06)',
                    pointerEvents: g.feedback || isTapped ? 'none' : 'auto',
                  }}>
                  <span style={{ fontSize:item.size, lineHeight:1 }}>{round.emoji}</span>
                  {isTapped && (
                    <div style={{
                      position:'absolute', top:-8, right:-8,
                      width:24, height:24, borderRadius:'50%',
                      background:'#66BB6A', color:'white',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:14, fontWeight:900,
                    }}>
                      {tapOrder + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Show correct order on wrong */}
          {g.feedback === 'wrong' && (
            <div style={{ textAlign:'center', marginTop:14, animation:'fadeUp 0.3s ease-out' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#9E9E9E', marginBottom:6 }}>こたえ：ちいさい→おおきい</div>
              <div style={{ display:'flex', gap:6, justifyContent:'center', alignItems:'flex-end' }}>
                {round.sizes.map((size, i) => (
                  <span key={i} style={{ fontSize:size * 0.7 }}>{round.emoji}</span>
                ))}
              </div>
            </div>
          )}
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
            <div style={{ background:'white', borderRadius:24, padding:'20px 40px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900, color:'#E8652E' }}>
                {g.score}<span style={{ fontSize:20, color:'#9E9E9E' }}>てん</span>
              </div>
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
