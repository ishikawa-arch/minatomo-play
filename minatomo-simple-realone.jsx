import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】ほんものどこ？ ==========
const TARGETS = ['⭐','🍎','❤️','🌸','🎈','🐱'];
const DECOYS = ['✨','🍊','🧡','🌺','🎁','🐶','⚡','🍇','💙','🌻','🎵','🐸'];

const ROUNDS = [
  { time:12, label:'12びょう' },
  { time:10, label:'10びょう' },
  { time:8, label:'8びょう' },
];

function randomPos(existing, minDist) {
  let tries = 0;
  while (tries < 50) {
    const x = 8 + Math.random() * 76;
    const y = 6 + Math.random() * 76;
    let ok = true;
    for (const p of existing) {
      if (Math.sqrt((x-p.x)**2 + (y-p.y)**2) < minDist) { ok = false; break; }
    }
    if (ok) return { x, y };
    tries++;
  }
  return { x: 8 + Math.random() * 76, y: 6 + Math.random() * 76 };
}

export default function SimpleRealOne() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    roundIdx:0, phase:'idle',
    hits:0, falseAlarms:0, score:0, timeLeft:0,
    roundResults:[],
    countdownNum:0,
    targetEmoji:'⭐',
    items:[], // { emoji, x, y, isTarget, id, tapped }
    nextId:0, spawnCount:0,
    numDecoys:1,
  }).current;

  const intervalRef = useRef(null);
  const timerRef = useRef(null);
  const spawnRef = useRef(null);
  useEffect(() => () => { clearInterval(intervalRef.current); clearTimeout(timerRef.current); clearTimeout(spawnRef.current); }, []);

  const startGame = () => {
    g.roundIdx = 0; g.roundResults = [];
    g.targetEmoji = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    g.score = 0;
    setScreen('play'); rerender();
    startCountdown(0);
  };

  const startCountdown = (rIdx) => {
    g.roundIdx = rIdx;
    g.hits = 0; g.falseAlarms = 0; g.spawnCount = 0;
    g.items = []; g.nextId = 0;
    g.numDecoys = rIdx === 0 ? 1 : rIdx === 1 ? 2 : 3;
    g.countdownNum = 3;
    g.phase = 'countdown';
    rerender();

    const tick = () => {
      g.countdownNum--;
      if (g.countdownNum <= 0) {
        g.phase = 'tapping';
        g.timeLeft = ROUNDS[rIdx].time * 1000;
        rerender();
        spawnSet();

        intervalRef.current = setInterval(() => {
          g.timeLeft -= 100;
          if (g.timeLeft <= 0) {
            g.timeLeft = 0;
            clearInterval(intervalRef.current);
            clearTimeout(spawnRef.current);
            finishRound();
          }
          rerender();
        }, 100);
      } else {
        rerender();
        timerRef.current = setTimeout(tick, 700);
      }
    };
    timerRef.current = setTimeout(tick, 700);
  };

  const spawnSet = () => {
    if (g.phase !== 'tapping') return;

    // Clear old items
    g.items = [];
    const positions = [];

    // Place target
    const tPos = randomPos(positions, 0);
    positions.push(tPos);
    g.items.push({ emoji:g.targetEmoji, x:tPos.x, y:tPos.y, isTarget:true, id:g.nextId++, tapped:false });

    // Place decoys
    const usedDecoys = [];
    for (let d = 0; d < g.numDecoys; d++) {
      let decoy;
      do { decoy = DECOYS[Math.floor(Math.random() * DECOYS.length)]; } while (usedDecoys.includes(decoy));
      usedDecoys.push(decoy);
      const dPos = randomPos(positions, 18);
      positions.push(dPos);
      g.items.push({ emoji:decoy, x:dPos.x, y:dPos.y, isTarget:false, id:g.nextId++, tapped:false });
    }

    g.spawnCount++;
    rerender();
  };

  const handleTap = (item) => {
    if (g.phase !== 'tapping' || item.tapped) return;
    item.tapped = true;

    if (item.isTarget) {
      g.hits++;
      g.score += 10;
      rerender();
      // Spawn new set after brief pause
      spawnRef.current = setTimeout(spawnSet, 300);
    } else {
      g.falseAlarms++;
      g.score = Math.max(0, g.score - 5);
      rerender();
    }
  };

  const finishRound = () => {
    g.roundResults.push({ hits:g.hits, falseAlarms:g.falseAlarms, time:ROUNDS[g.roundIdx].time });
    g.phase = 'roundEnd';
    rerender();

    timerRef.current = setTimeout(() => {
      if (g.roundIdx + 1 >= ROUNDS.length) {
        setScreen('done'); rerender();
      } else {
        startCountdown(g.roundIdx + 1);
      }
    }, 1800);
  };

  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.1s' };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes countPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.3);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes itemPop{0%{transform:translate(-50%,-50%) scale(0)}60%{transform:translate(-50%,-50%) scale(1.1)}100%{transform:translate(-50%,-50%) scale(1)}}
        @keyframes wrongShake{0%,100%{transform:translate(-50%,-50%)}25%{transform:translate(calc(-50% - 6px),-50%)}75%{transform:translate(calc(-50% + 6px),-50%)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:17, fontWeight:900, color:'#E8652E', letterSpacing:'0.06em' }}>🔍 ほんものどこ？</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>
            ラウンド {g.roundIdx + 1} / {ROUNDS.length}
          </span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'50px 20px', textAlign:'center', minHeight:'70vh' }}>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:12 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
              <span style={{ fontSize:48 }}>⭐</span>
              <span style={{ fontSize:12, fontWeight:900, color:'#43A047' }}>ほんもの</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', opacity:0.6 }}>
              <span style={{ fontSize:48 }}>✨</span>
              <span style={{ fontSize:12, fontWeight:900, color:'#C62828' }}>ニセモノ</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', opacity:0.6 }}>
              <span style={{ fontSize:48 }}>🍊</span>
              <span style={{ fontSize:12, fontWeight:900, color:'#C62828' }}>ニセモノ</span>
            </div>
          </div>

          <div style={{ fontSize:24, fontWeight:900, color:'#333', marginBottom:6, letterSpacing:'0.06em' }}>
            ほんものだけタップ！
          </div>
          <div style={{ fontSize:15, color:'#9E9E9E', marginBottom:4 }}>
            ニセモノにさわると −5てん！
          </div>
          <div style={{ display:'flex', gap:8, marginBottom:32 }}>
            {['ニセ1こ','ニセ2こ','ニセ3こ'].map((t, i) => (
              <div key={i} style={{
                padding:'6px 10px', borderRadius:50,
                background: i === 0 ? '#E8F5E9' : i === 1 ? '#FFF3E0' : '#FFF5F5',
                fontSize:12, fontWeight:900,
                color: i === 0 ? '#2E7D32' : i === 1 ? '#E8652E' : '#C62828',
              }}>{t}</div>
            ))}
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
        <div style={{ padding:'12px 16px', maxWidth:580, margin:'0 auto' }}>

          {/* COUNTDOWN */}
          {g.phase === 'countdown' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#9E9E9E', marginBottom:4 }}>
                ラウンド {g.roundIdx + 1}（{ROUNDS[g.roundIdx].label}）
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#C62828', marginBottom:8 }}>
                ニセモノが{g.numDecoys}こ でるよ！
              </div>
              <div key={g.countdownNum} style={{
                fontFamily:'Outfit,sans-serif',
                fontSize:120, fontWeight:900, color:'#E8652E',
                animation:'countPop 0.5s ease-out',
              }}>
                {g.countdownNum}
              </div>
            </div>
          )}

          {/* TAPPING */}
          {g.phase === 'tapping' && (() => {
            const round = ROUNDS[g.roundIdx];
            const pct = g.timeLeft / (round.time * 1000);
            const isUrgent = pct < 0.25;
            return (
              <div>
                {/* Timer bar */}
                <div style={{ width:'100%', height:10, background:'#E8E8E8', borderRadius:5, marginBottom:6, overflow:'hidden' }}>
                  <div style={{
                    width:`${pct * 100}%`, height:'100%', borderRadius:5,
                    background: isUrgent ? '#C62828' : '#E8652E',
                    transition:'width 0.1s linear',
                  }} />
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <span style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:900, color:isUrgent?'#C62828':'#555' }}>
                    {(g.timeLeft / 1000).toFixed(1)}
                  </span>
                  <div style={{ display:'flex', gap:10 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#2E7D32' }}>🎯{g.hits}</span>
                    {g.falseAlarms > 0 && <span style={{ fontSize:14, fontWeight:700, color:'#C62828' }}>❌{g.falseAlarms}</span>}
                    <span style={{ fontFamily:'Outfit', fontSize:16, fontWeight:900, color:'#E8652E' }}>{g.score}pt</span>
                  </div>
                </div>

                {/* Target reminder */}
                <div style={{ textAlign:'center', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#9E9E9E' }}>さがせ→</span>
                  <span style={{ fontSize:28, verticalAlign:'middle', marginLeft:4 }}>{g.targetEmoji}</span>
                </div>

                {/* Game field */}
                <div style={{
                  position:'relative', width:'100%', height:340,
                  background:'white', borderRadius:24,
                  border:'2px solid #E8E8E8',
                  overflow:'hidden',
                  userSelect:'none', WebkitUserSelect:'none',
                }}>
                  {g.items.map((item) => {
                    if (item.tapped && item.isTarget) return null;
                    const wasTappedWrong = item.tapped && !item.isTarget;
                    return (
                      <div key={item.id}
                        onClick={() => handleTap(item)}
                        style={{
                          position:'absolute',
                          left:item.x+'%', top:item.y+'%',
                          transform:'translate(-50%,-50%)',
                          cursor:'pointer',
                          padding:12,
                          animation: wasTappedWrong ? 'wrongShake 0.3s' : 'itemPop 0.2s ease-out',
                          opacity: wasTappedWrong ? 0.3 : 1,
                          pointerEvents: item.tapped ? 'none' : 'auto',
                        }}>
                        <span style={{ fontSize:48, lineHeight:1, pointerEvents:'none' }}>{item.emoji}</span>
                        {wasTappedWrong && (
                          <div style={{ position:'absolute', top:-4, right:-4, fontSize:16, fontWeight:900, color:'#C62828' }}>-5</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ROUND END */}
          {g.phase === 'roundEnd' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'50vh', animation:'fadeUp 0.3s' }}>
              <div style={{ fontSize:56, marginBottom:12 }}>
                {g.falseAlarms === 0 && g.hits >= 10 ? '🔥' : g.hits >= 6 ? '⭐' : '👍'}
              </div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900, color:'#E8652E' }}>
                {g.hits}<span style={{ fontSize:20, color:'#9E9E9E' }}>かい</span>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <span style={{ fontSize:16, fontWeight:700, color:'#2E7D32' }}>🎯 {g.hits}ヒット</span>
                {g.falseAlarms > 0 && <span style={{ fontSize:16, fontWeight:700, color:'#C62828' }}>❌ {g.falseAlarms}おてつき</span>}
              </div>
              {g.roundIdx + 1 < ROUNDS.length && (
                <div style={{ fontSize:14, fontWeight:700, color:'#C62828', marginTop:12 }}>
                  つぎは ニセモノが{g.roundIdx + 1 === 1 ? 2 : 3}こに！
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DONE */}
      {screen === 'done' && (() => {
        const totalHits = g.roundResults.reduce((a, r) => a + r.hits, 0);
        const totalFalse = g.roundResults.reduce((a, r) => a + r.falseAlarms, 0);
        const emoji = totalHits >= 25 && totalFalse <= 2 ? '🔥' : totalHits >= 15 ? '⭐' : '👍';
        const msg = totalHits >= 25 && totalFalse <= 2 ? 'かんぺき！' : totalHits >= 15 ? 'いいね！' : 'またやろう！';
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'50px 20px', textAlign:'center', minHeight:'70vh' }}>
            <div style={{ fontSize:80, marginBottom:12, animation:'pop 0.6s ease-out' }}>{emoji}</div>
            <div style={{ fontSize:32, fontWeight:900, color:'#E8652E', marginBottom:16 }}>{msg}</div>

            <div style={{ background:'white', borderRadius:24, padding:'20px 40px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#9E9E9E', marginBottom:4 }}>スコア</div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900, color:'#E8652E' }}>
                {g.score}<span style={{ fontSize:20, color:'#9E9E9E' }}>てん</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'#2E7D32' }}>🎯 {totalHits}ヒット</div>
              <div style={{ fontSize:16, fontWeight:700, color:'#C62828' }}>❌ {totalFalse}おてつき</div>
            </div>

            <div style={{ display:'flex', gap:10, marginBottom:20 }}>
              {g.roundResults.map((r, i) => (
                <div key={i} style={{
                  background:'white', borderRadius:16, padding:'12px 14px',
                  boxShadow:'0 2px 8px rgba(0,0,0,0.05)', textAlign:'center', minWidth:75,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'#9E9E9E' }}>ニセ{i+1}こ</div>
                  <div style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, color:'#333' }}>{r.hits}</div>
                  {r.falseAlarms > 0 && <div style={{ fontSize:11, fontWeight:700, color:'#C62828' }}>❌{r.falseAlarms}</div>}
                </div>
              ))}
            </div>

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
