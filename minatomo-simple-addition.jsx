import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】あわせていくつ？ ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

const EMOJIS = ['🍎','⭐','❤️','🌸','🎈','🐱','🍊','🐟','🍰','🐸'];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    let left, right;

    if (i < 4) {
      // Easy: small numbers, sum ≤ 5
      left = 1 + Math.floor(Math.random() * 2);
      right = 1 + Math.floor(Math.random() * 2);
    } else if (i < 8) {
      // Medium: sum ≤ 8
      left = 1 + Math.floor(Math.random() * 4);
      right = 1 + Math.floor(Math.random() * 4);
    } else {
      // Hard: sum ≤ 12
      left = 2 + Math.floor(Math.random() * 5);
      right = 2 + Math.floor(Math.random() * 5);
    }

    const answer = left + right;

    // Generate 3 choices including the answer
    const wrongs = new Set();
    while (wrongs.size < 2) {
      const w = answer + [-2,-1,1,2,3][Math.floor(Math.random() * 5)];
      if (w > 0 && w !== answer) wrongs.add(w);
    }
    const choices = shuffle([answer, ...wrongs]);

    rounds.push({ emoji, left, right, answer, choices });
  }
  return rounds;
}

export default function SimpleAddition() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0, correct:0,
    feedback:null, selected:null,
  }).current;

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = () => {
    g.rounds = genRounds(12);
    g.currentR = 0; g.score = 0; g.correct = 0;
    g.feedback = null; g.selected = null;
    setScreen('play'); rerender();
  };

  const handleTap = (num) => {
    if (g.feedback) return;
    const round = g.rounds[g.currentR];
    const isCorrect = num === round.answer;
    g.selected = num;
    g.feedback = isCorrect ? 'correct' : 'wrong';
    if (isCorrect) { g.correct++; g.score += 10; }
    rerender();

    timerRef.current = setTimeout(() => {
      g.selected = null; g.feedback = null;
      g.currentR++;
      if (g.currentR >= g.rounds.length) setScreen('done');
      rerender();
    }, isCorrect ? 800 : 1500);
  };

  const round = g.currentR < g.rounds.length ? g.rounds[g.currentR] : null;
  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.15s' };

  const EmojiGroup = ({ emoji, count }) => {
    const size = count <= 3 ? 32 : count <= 5 ? 26 : 22;
    return (
      <div style={{
        display:'flex', flexWrap:'wrap', justifyContent:'center', gap:4,
        maxWidth: 90, minWidth:50,
      }}>
        {Array.from({ length:count }).map((_, i) => (
          <span key={i} style={{ fontSize:size, lineHeight:1.2 }}>{emoji}</span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>➕ あわせていくつ？</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
            <div style={{ display:'flex', gap:4 }}>
              <span style={{ fontSize:36 }}>🍎</span>
              <span style={{ fontSize:36 }}>🍎</span>
            </div>
            <span style={{ fontSize:32, fontWeight:900, color:'#E8652E' }}>＋</span>
            <div style={{ display:'flex', gap:4 }}>
              <span style={{ fontSize:36 }}>🍎</span>
              <span style={{ fontSize:36 }}>🍎</span>
              <span style={{ fontSize:36 }}>🍎</span>
            </div>
          </div>
          <div style={{ fontSize:20, fontWeight:900, color:'#E8652E', marginBottom:24 }}>＝ ？</div>

          <div style={{ fontSize:26, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            あわせていくつ？
          </div>
          <div style={{ fontSize:16, color:'#9E9E9E', marginBottom:40 }}>
            ぜんぶでいくつかかぞえよう！
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

          {/* Two groups with plus sign */}
          <div style={{
            background:'white', borderRadius:20, padding:'20px 12px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
            marginBottom:14,
          }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#9E9E9E', textAlign:'center', marginBottom:12 }}>
              あわせていくつ？
            </div>
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:14 }}>
              {/* Left group */}
              <div style={{
                flex:'0 0 auto', padding:'12px 16px', borderRadius:16,
                background:'#FFF8F5', border:'2px solid #FFE0CC',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <EmojiGroup emoji={round.emoji} count={round.left} />
              </div>

              {/* Plus */}
              <span style={{ fontSize:32, fontWeight:900, color:'#E8652E' }}>＋</span>

              {/* Right group */}
              <div style={{
                flex:'0 0 auto', padding:'12px 16px', borderRadius:16,
                background:'#F5F8FF', border:'2px solid #CCE0FF',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <EmojiGroup emoji={round.emoji} count={round.right} />
              </div>
            </div>

            {/* Equals */}
            <div style={{ textAlign:'center', marginTop:10 }}>
              <span style={{ fontSize:28, fontWeight:900, color:'#555' }}>＝ ？</span>
            </div>
          </div>

          {/* Feedback */}
          {g.feedback && (
            <div style={{ textAlign:'center', marginBottom:8, animation:'fadeUp 0.2s ease-out' }}>
              <span style={{ fontSize:48 }}>{g.feedback === 'correct' ? '⭕' : '❌'}</span>
              {g.feedback === 'wrong' && (
                <div style={{ fontSize:16, fontWeight:900, color:'#C62828', marginTop:2 }}>
                  {round.left} ＋ {round.right} ＝ {round.answer}
                </div>
              )}
            </div>
          )}
          {!g.feedback && <div style={{ height:56 }} />}

          {/* Number choices */}
          <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
            {round.choices.map((num, i) => {
              const isSelected = g.selected === num;
              const isCorrectAnswer = num === round.answer;
              const showCorrect = g.feedback && isCorrectAnswer;
              const showWrong = g.feedback === 'wrong' && isSelected;

              return (
                <button key={i} onClick={() => handleTap(num)}
                  style={{
                    ...bs,
                    width:80, height:80, borderRadius:20,
                    background: showCorrect ? '#F1F8E9' : showWrong ? '#FFF5F5' : 'white',
                    border: `4px solid ${showCorrect ? '#66BB6A' : showWrong ? '#EF5350' : '#E8E8E8'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation: showWrong ? 'shake 0.3s' : showCorrect ? 'pop 0.3s' : undefined,
                    opacity: g.feedback && !showCorrect && !showWrong ? 0.3 : 1,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                    pointerEvents: g.feedback ? 'none' : 'auto',
                  }}>
                  <span style={{ fontFamily:'Outfit,sans-serif', fontSize:36, fontWeight:900, color: showCorrect ? '#2E7D32' : showWrong ? '#C62828' : '#333' }}>
                    {num}
                  </span>
                </button>
              );
            })}
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
