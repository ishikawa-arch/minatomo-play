import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】ペアをさがそう ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

const ALL_EMOJIS = ['🍎','🐱','⭐','🌸','🚗','🎈','🐟','🍰','☀️','🐸','❤️','🍊','🎵','🐧','🌻'];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    let numPairs;
    if (i < 3) numPairs = 2;       // 4 cards
    else if (i < 6) numPairs = 3;   // 6 cards
    else if (i < 9) numPairs = 4;   // 8 cards
    else numPairs = 5;              // 10 cards

    const pool = shuffle([...ALL_EMOJIS]).slice(0, numPairs);
    const cards = shuffle([...pool, ...pool]).map((emoji, idx) => ({ id: idx, emoji, matched: false }));
    rounds.push({ cards, numPairs });
  }
  return rounds;
}

export default function SimplePairMatch() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0, roundsCleared:0,
    cards:[], flipped:[], matched:new Set(),
    moves:0, busy:false,
  }).current;

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    g.rounds = genRounds(10);
    g.currentR = 0; g.score = 0; g.roundsCleared = 0;
    setScreen('play');
    startRound(0);
  };

  const startRound = (idx) => {
    g.currentR = idx;
    const round = g.rounds[idx];
    g.cards = round.cards.map(c => ({ ...c, matched: false }));
    g.flipped = [];
    g.matched = new Set();
    g.moves = 0;
    g.busy = false;
    rerender();
  };

  const handleFlip = (cardIdx) => {
    if (g.busy) return;
    if (g.flipped.includes(cardIdx)) return;
    if (g.matched.has(g.cards[cardIdx].emoji)) return;

    g.flipped.push(cardIdx);
    rerender();

    if (g.flipped.length === 2) {
      g.moves++;
      g.busy = true;
      const [a, b] = g.flipped;
      const cardA = g.cards[a];
      const cardB = g.cards[b];

      if (cardA.emoji === cardB.emoji) {
        // Match!
        timerRef.current = setTimeout(() => {
          g.matched.add(cardA.emoji);
          g.flipped = [];
          g.busy = false;
          g.score += 10;
          rerender();

          // Check if round complete
          if (g.matched.size >= g.rounds[g.currentR].numPairs) {
            g.roundsCleared++;
            timerRef.current = setTimeout(() => {
              if (g.currentR + 1 >= g.rounds.length) {
                setScreen('done'); rerender();
              } else {
                startRound(g.currentR + 1);
              }
            }, 600);
          }
        }, 500);
      } else {
        // No match - flip back
        timerRef.current = setTimeout(() => {
          g.flipped = [];
          g.busy = false;
          rerender();
        }, 800);
      }
    }
  };

  const round = g.currentR < g.rounds.length ? g.rounds[g.currentR] : null;
  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.15s' };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes matchPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>🃏 ペアをさがそう</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:24 }}>
            {['❓','🍎','🍎','❓'].map((e, i) => (
              <div key={i} style={{
                width:64, height:64, borderRadius:16,
                background: e === '❓' ? '#E8652E' : '#F1F8E9',
                border: `3px solid ${e === '❓' ? '#D4551E' : '#66BB6A'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:32,
              }}>{e === '❓' ? '？' : e}</div>
            ))}
          </div>

          <div style={{ fontSize:26, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            おなじものをみつけよう！
          </div>
          <div style={{ fontSize:16, color:'#9E9E9E', marginBottom:40 }}>
            2まいめくってペアをさがそう
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
        <div style={{ padding:'16px', maxWidth:580, margin:'0 auto' }}>
          <div style={{ display:'flex', gap:3, justifyContent:'center', marginBottom:12 }}>
            {g.rounds.map((_, i) => (
              <div key={i} style={{
                width: i === g.currentR ? 12 : 8, height:8, borderRadius:4,
                background: i < g.currentR ? '#8BC34A' : i === g.currentR ? '#E8652E' : '#E0E0E0',
              }} />
            ))}
          </div>

          <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:14 }}>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:900, color:'#E8652E' }}>{g.score}</span>
              <span style={{ fontSize:14, fontWeight:700, color:'#9E9E9E', marginLeft:4 }}>てん</span>
            </div>
            <div style={{ textAlign:'center' }}>
              <span style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:800, color:'#555' }}>{g.matched.size}/{round.numPairs}</span>
              <span style={{ fontSize:12, fontWeight:700, color:'#9E9E9E', marginLeft:4 }}>ペア</span>
            </div>
          </div>

          {/* Card grid */}
          <div style={{
            display:'grid',
            gridTemplateColumns: g.cards.length <= 4 ? 'repeat(2,1fr)' : g.cards.length <= 6 ? 'repeat(3,1fr)' : g.cards.length <= 8 ? 'repeat(4,1fr)' : 'repeat(5,1fr)',
            gap:10,
            maxWidth: g.cards.length <= 6 ? 280 : 400,
            margin:'0 auto',
            animation:'fadeUp 0.3s ease-out',
          }} key={g.currentR}>
            {g.cards.map((card, i) => {
              const isFlipped = g.flipped.includes(i);
              const isMatched = g.matched.has(card.emoji);

              if (isMatched) {
                return (
                  <div key={i} style={{
                    height: g.cards.length <= 6 ? 80 : 70,
                    borderRadius:16,
                    background:'#F1F8E9',
                    border:'3px solid #C8E6C9',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation:'matchPop 0.4s ease-out',
                  }}>
                    <span style={{ fontSize: g.cards.length <= 6 ? 36 : 28, opacity:0.5 }}>{card.emoji}</span>
                  </div>
                );
              }

              return (
                <button key={i} onClick={() => handleFlip(i)}
                  style={{
                    ...bs,
                    height: g.cards.length <= 6 ? 80 : 70,
                    borderRadius:16,
                    background: isFlipped ? 'white' : '#E8652E',
                    border: `3px solid ${isFlipped ? '#E8E8E8' : '#D4551E'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow: isFlipped ? '0 2px 8px rgba(0,0,0,0.06)' : '0 3px 8px rgba(232,101,46,0.2)',
                    pointerEvents: g.busy || isFlipped ? 'none' : 'auto',
                  }}>
                  {isFlipped ? (
                    <span style={{ fontSize: g.cards.length <= 6 ? 36 : 28, animation:'pop 0.2s ease-out' }}>{card.emoji}</span>
                  ) : (
                    <span style={{ fontSize: g.cards.length <= 6 ? 24 : 20, color:'white', fontWeight:900 }}>？</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DONE */}
      {screen === 'done' && (() => {
        const total = g.rounds.length;
        const pct = g.roundsCleared / total;
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
            <div style={{ fontSize:20, fontWeight:700, color:'#6B6B6B', marginBottom:40 }}>{g.roundsCleared}ステージ クリア / {total}</div>
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
