import { useState, useRef, useEffect } from "react";

// ========== 【シンプル】つぎはなに？ ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

const EMOJIS = ['🍎','🍊','⭐','🌸','🐱','🐟','❤️','🎈','🍇','☀️','🐸','🎵','🍰','🚗','🌻'];

function genRounds(count) {
  const rounds = [];
  for (let i = 0; i < count; i++) {
    const pool = shuffle([...EMOJIS]);
    let pattern, answer, display, choices;

    if (i < 4) {
      // Easy: AB AB AB ? → B
      const a = pool[0], b = pool[1];
      display = [a, b, a, b, a];
      answer = b;
      choices = shuffle([a, b, pool[2]]);
    } else if (i < 8) {
      // Medium: ABC ABC AB? → C
      const a = pool[0], b = pool[1], c = pool[2];
      display = [a, b, c, a, b];
      answer = c;
      choices = shuffle([a, b, c]);
    } else {
      // Hard: ABBA ABBA ABB? → A  or ABCD ABC? → D
      if (Math.random() < 0.5) {
        const a = pool[0], b = pool[1];
        display = [a, b, b, a, a, b, b];
        answer = a;
        choices = shuffle([a, b, pool[2]]);
      } else {
        const a = pool[0], b = pool[1], c = pool[2], d = pool[3];
        display = [a, b, c, d, a, b, c];
        answer = d;
        choices = shuffle([a, c, d]);
      }
    }

    rounds.push({ display, answer, choices });
  }
  return rounds;
}

export default function SimplePattern() {
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

  const handleTap = (emoji) => {
    if (g.feedback) return;
    const round = g.rounds[g.currentR];
    const isCorrect = emoji === round.answer;
    g.selected = emoji;
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

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.8)}60%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>🔮 つぎはなに？</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>{g.currentR + 1} / {g.rounds.length}</span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center', minHeight:'70vh' }}>
          {/* Visual demo */}
          <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:24 }}>
            {['🍎','🍊','🍎','🍊','🍎'].map((e, i) => (
              <span key={i} style={{ fontSize:36 }}>{e}</span>
            ))}
            <div style={{
              width:44, height:44, borderRadius:12,
              border:'3px dashed #E8652E',
              display:'flex', alignItems:'center', justifyContent:'center',
              animation:'blink 1.5s ease-in-out infinite',
            }}>
              <span style={{ fontSize:20, color:'#E8652E', fontWeight:900 }}>？</span>
            </div>
          </div>

          <div style={{ fontSize:26, fontWeight:900, color:'#333', marginBottom:8, letterSpacing:'0.06em' }}>
            つぎにくるのは？
          </div>
          <div style={{ fontSize:16, color:'#9E9E9E', marginBottom:40 }}>
            ならびかたをみてえらぼう
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

          {/* Pattern display */}
          <div style={{
            background:'white', borderRadius:20, padding:'20px 12px',
            boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
            marginBottom:16,
          }}>
            <div style={{ fontSize:16, fontWeight:700, color:'#9E9E9E', textAlign:'center', marginBottom:10 }}>
              つぎにくるのは？
            </div>
            <div style={{ display:'flex', gap:4, justifyContent:'center', alignItems:'center' }}>
              {round.display.map((emoji, i) => {
                const itemSize = round.display.length >= 7 ? 34 : round.display.length >= 5 ? 40 : 46;
                const fontSize = round.display.length >= 7 ? 22 : round.display.length >= 5 ? 26 : 30;
                return (
                  <div key={i} style={{
                    width:itemSize, height:itemSize, borderRadius:10,
                    background:'#F5F5F0', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <span style={{ fontSize, lineHeight:1 }}>{emoji}</span>
                  </div>
                );
              })}
              {/* The question mark / answer slot */}
              {(() => {
                const itemSize = round.display.length >= 7 ? 34 : round.display.length >= 5 ? 40 : 46;
                const fontSize = round.display.length >= 7 ? 22 : round.display.length >= 5 ? 26 : 30;
                return (
                  <div style={{
                    width:itemSize, height:itemSize, borderRadius:10, flexShrink:0,
                    border: g.feedback === 'correct' ? '3px solid #66BB6A' : '3px dashed #E8652E',
                    background: g.feedback === 'correct' ? '#F1F8E9' : 'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation: g.feedback ? undefined : 'blink 1.5s ease-in-out infinite',
                  }}>
                    {g.feedback === 'correct' ? (
                      <span style={{ fontSize, lineHeight:1, animation:'pop 0.3s ease-out' }}>{round.answer}</span>
                    ) : g.feedback === 'wrong' ? (
                      <span style={{ fontSize, lineHeight:1 }}>{round.answer}</span>
                    ) : (
                      <span style={{ fontSize:16, color:'#E8652E', fontWeight:900 }}>？</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Feedback */}
          {g.feedback && (
            <div style={{ textAlign:'center', marginBottom:10, animation:'fadeUp 0.2s ease-out' }}>
              <span style={{ fontSize:48 }}>{g.feedback === 'correct' ? '⭕' : '❌'}</span>
            </div>
          )}
          {!g.feedback && <div style={{ height:56 }} />}

          {/* Choices */}
          <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
            {round.choices.map((emoji, i) => {
              const isSelected = g.selected === emoji;
              const isCorrectAnswer = emoji === round.answer;
              const showCorrect = g.feedback && isCorrectAnswer;
              const showWrong = g.feedback === 'wrong' && isSelected;

              return (
                <button key={i} onClick={() => handleTap(emoji)}
                  style={{
                    ...bs,
                    width:90, height:90, borderRadius:20,
                    background: showCorrect ? '#F1F8E9' : showWrong ? '#FFF5F5' : 'white',
                    border: `4px solid ${showCorrect ? '#66BB6A' : showWrong ? '#EF5350' : '#E8E8E8'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation: showWrong ? 'shake 0.3s' : showCorrect ? 'pop 0.3s' : undefined,
                    opacity: g.feedback && !showCorrect && !showWrong ? 0.3 : 1,
                    boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
                    pointerEvents: g.feedback ? 'none' : 'auto',
                  }}>
                  <span style={{ fontSize:44, lineHeight:1 }}>{emoji}</span>
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
