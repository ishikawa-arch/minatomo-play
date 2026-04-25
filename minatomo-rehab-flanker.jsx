import { useState, useRef, useEffect } from "react";

// ========== 【リハビリ脳トレ】まんなかのむき ==========
// Flanker Task - 選択的注意・抑制

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// Types: congruent (all same direction), incongruent (center opposite), neutral (center + diamonds)
function genTrial(trialIdx) {
  // Early: mix of congruent and incongruent, 50/50
  // Later: more incongruent (harder)
  const congruentProb = trialIdx < 4 ? 0.5 : 0.3;

  const isCongruent = Math.random() < congruentProb;
  const centerDir = Math.random() < 0.5 ? 'left' : 'right';
  const flankerDir = isCongruent ? centerDir : (centerDir === 'left' ? 'right' : 'left');

  return { centerDir, flankerDir, isCongruent };
}

const TOTAL_TRIALS = 20;
const DISPLAY_TIME = 3000;

const Arrow = ({ dir, size = 56, color = '#333', faded = false }) => {
  return (
    <span style={{
      fontSize:size,
      color,
      opacity: faded ? 0.7 : 1,
      display:'inline-block',
      lineHeight:1,
      transform: dir === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
      userSelect:'none',
    }}>➤</span>
  );
};

export default function Flanker() {
  const [screen, setScreen] = useState('start');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    trialIdx:0, phase:'idle', // showing, feedback
    current:null, selected:null, feedback:null,
    correct:0, errors:0, score:0,
    startTime:0, rts:[],
    timeLeft:0,
    congruentCorrect:0, incongruentCorrect:0,
    congruentTotal:0, incongruentTotal:0,
    congruentRTs:[], incongruentRTs:[],
  }).current;

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  useEffect(() => () => { clearTimeout(timerRef.current); clearInterval(intervalRef.current); }, []);

  const startGame = () => {
    g.trialIdx = 0; g.correct = 0; g.errors = 0; g.score = 0;
    g.rts = [];
    g.congruentCorrect = 0; g.incongruentCorrect = 0;
    g.congruentTotal = 0; g.incongruentTotal = 0;
    g.congruentRTs = []; g.incongruentRTs = [];
    setScreen('play');
    showTrial(0);
  };

  const showTrial = (idx) => {
    g.trialIdx = idx;
    g.current = genTrial(idx);
    if (g.current.isCongruent) g.congruentTotal++;
    else g.incongruentTotal++;
    g.selected = null;
    g.feedback = null;
    g.phase = 'showing';
    g.startTime = Date.now();
    g.timeLeft = DISPLAY_TIME;
    rerender();

    intervalRef.current = setInterval(() => {
      g.timeLeft -= 100;
      if (g.timeLeft <= 0) {
        clearInterval(intervalRef.current);
        if (g.phase === 'showing') {
          g.feedback = 'timeout';
          g.phase = 'feedback';
          rerender();
          timerRef.current = setTimeout(advance, 900);
        }
      } else {
        rerender();
      }
    }, 100);
  };

  const handleTap = (dir) => {
    if (g.phase !== 'showing' || g.feedback) return;
    clearInterval(intervalRef.current);
    const rt = Date.now() - g.startTime;
    const isCorrect = dir === g.current.centerDir;
    g.selected = dir;
    g.feedback = isCorrect ? 'correct' : 'wrong';
    g.phase = 'feedback';
    if (isCorrect) {
      g.correct++;
      g.rts.push(rt);
      g.score += 10 + Math.max(0, Math.round((1000 - rt) / 50));
      if (g.current.isCongruent) {
        g.congruentCorrect++;
        g.congruentRTs.push(rt);
      } else {
        g.incongruentCorrect++;
        g.incongruentRTs.push(rt);
      }
    } else {
      g.errors++;
    }
    rerender();
    timerRef.current = setTimeout(advance, isCorrect ? 400 : 1000);
  };

  const advance = () => {
    if (g.trialIdx + 1 >= TOTAL_TRIALS) {
      setScreen('done'); rerender();
    } else {
      showTrial(g.trialIdx + 1);
    }
  };

  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.15s' };

  const avgCongruentRT = g.congruentRTs.length > 0 ? Math.round(g.congruentRTs.reduce((a,b) => a+b, 0) / g.congruentRTs.length) : 0;
  const avgIncongruentRT = g.incongruentRTs.length > 0 ? Math.round(g.incongruentRTs.reduce((a,b) => a+b, 0) / g.incongruentRTs.length) : 0;
  const flankerEffect = avgCongruentRT > 0 && avgIncongruentRT > 0 ? avgIncongruentRT - avgCongruentRT : 0;

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.7)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
        @keyframes arrowPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)' }}>
        <span style={{ fontSize:18, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>🎯 まんなかのむき</span>
        {screen === 'play' && (
          <span style={{ fontSize:14, fontWeight:800, color:'white', background:'#888', padding:'4px 12px', borderRadius:50 }}>
            {g.trialIdx + 1} / {TOTAL_TRIALS}
          </span>
        )}
      </div>

      {/* START */}
      {screen === 'start' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'30px 20px', textAlign:'center', minHeight:'70vh' }}>
          {/* Demo */}
          <div style={{ background:'white', borderRadius:20, padding:'24px 16px', marginBottom:12, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display:'flex', gap:4, alignItems:'center', justifyContent:'center', marginBottom:6 }}>
              <Arrow dir="right" size={32} color="#BDBDBD" />
              <Arrow dir="right" size={32} color="#BDBDBD" />
              <div style={{ padding:'2px 6px', background:'#FFF3E0', borderRadius:8, border:'3px solid #E8652E' }}>
                <Arrow dir="left" size={36} color="#E8652E" />
              </div>
              <Arrow dir="right" size={32} color="#BDBDBD" />
              <Arrow dir="right" size={32} color="#BDBDBD" />
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#9E9E9E', marginBottom:4 }}>まわりは ➤ でも…</div>
            <div style={{ fontSize:16, fontWeight:900, color:'#E8652E' }}>まんなかは ◀ ！</div>
          </div>
          <div style={{ fontSize:13, color:'#C62828', fontWeight:700, background:'#FFF5F5', padding:'8px 14px', borderRadius:12, marginBottom:20 }}>
            💡 まわりに まどわされないで！
          </div>

          <div style={{ fontSize:24, fontWeight:900, color:'#333', marginBottom:4 }}>
            まんなかだけ みて！
          </div>
          <div style={{ fontSize:13, color:'#E8652E', fontWeight:700, marginBottom:4 }}>
            むいてるむきをタップ
          </div>
          <div style={{ fontSize:12, color:'#9E9E9E', marginBottom:24 }}>
            選択的注意・抑制
          </div>

          <button onClick={startGame} style={{
            ...bs, fontSize:26, fontWeight:900, color:'white',
            background:'#E8652E', border:'none',
            padding:'22px 56px', borderRadius:60,
            boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
          }}>はじめる</button>
        </div>
      )}

      {/* PLAY */}
      {screen === 'play' && g.current && (
        <div style={{ padding:'12px 16px', maxWidth:520, margin:'0 auto' }}>
          {/* Progress */}
          <div style={{ width:'100%', height:4, background:'#E8E8E8', borderRadius:2, marginBottom:8, overflow:'hidden' }}>
            <div style={{ width:`${(g.trialIdx / TOTAL_TRIALS) * 100}%`, height:'100%', background:'#8BC34A', transition:'width 0.3s' }} />
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:900, color:'#E8652E' }}>{g.score}<span style={{ fontSize:12, color:'#9E9E9E' }}>pt</span></span>
            {g.phase === 'showing' && (
              <div style={{ width:100, height:6, background:'#E8E8E8', borderRadius:3, overflow:'hidden' }}>
                <div style={{
                  width:`${(g.timeLeft / DISPLAY_TIME) * 100}%`, height:'100%',
                  background: g.timeLeft < DISPLAY_TIME * 0.3 ? '#C62828' : '#E8652E',
                  transition:'width 0.1s linear',
                }} />
              </div>
            )}
          </div>

          {/* Question prompt */}
          <div style={{ textAlign:'center', marginBottom:8 }}>
            <span style={{ fontSize:14, fontWeight:700, color:'#9E9E9E' }}>
              <span style={{ color:'#E8652E', fontWeight:900 }}>まんなか</span>のむきは？
            </span>
          </div>

          {/* Arrow display */}
          <div style={{
            background:'white', borderRadius:24, padding:'50px 16px',
            boxShadow:'0 4px 16px rgba(0,0,0,0.06)',
            textAlign:'center', marginBottom:16, minHeight:160,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {g.phase === 'showing' && (
              <div key={g.trialIdx} style={{ animation:'arrowPop 0.2s ease-out' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
                  <Arrow dir={g.current.flankerDir} size={52} color="#888" faded />
                  <Arrow dir={g.current.flankerDir} size={52} color="#888" faded />
                  <div style={{
                    padding:'4px 10px',
                    background:'#FFF3E0',
                    borderRadius:14,
                    border:'3px solid #E8652E',
                    boxShadow:'0 2px 10px rgba(232,101,46,0.2)',
                  }}>
                    <Arrow dir={g.current.centerDir} size={60} color="#E8652E" />
                  </div>
                  <Arrow dir={g.current.flankerDir} size={52} color="#888" faded />
                  <Arrow dir={g.current.flankerDir} size={52} color="#888" faded />
                </div>
              </div>
            )}
            {g.phase === 'feedback' && (
              <div style={{ textAlign:'center', animation:'fadeUp 0.2s ease-out' }}>
                <span style={{ fontSize:52 }}>
                  {g.feedback === 'correct' ? '⭕' : g.feedback === 'timeout' ? '⏰' : '❌'}
                </span>
                {g.feedback === 'correct' && g.rts.length > 0 && (
                  <div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:800, color:'#555', marginTop:4 }}>
                    {g.rts[g.rts.length - 1]}ms
                  </div>
                )}
                {g.feedback === 'wrong' && (
                  <div style={{ fontSize:14, fontWeight:900, color:'#C62828', marginTop:4 }}>
                    まんなかは {g.current.centerDir === 'left' ? '◀ ひだり' : '▶ みぎ'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Choice buttons */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
            {['left','right'].map(dir => {
              const isSelected = g.selected === dir;
              const isAnswer = dir === g.current.centerDir;
              const showCorrect = g.feedback && isAnswer;
              const showWrong = g.feedback === 'wrong' && isSelected;
              return (
                <button key={dir} onClick={() => handleTap(dir)}
                  disabled={g.phase !== 'showing' || g.feedback !== null}
                  style={{
                    ...bs, height:80, borderRadius:16,
                    background: showCorrect ? '#F1F8E9' : showWrong ? '#FFF5F5' : 'white',
                    border: `4px solid ${showCorrect ? '#66BB6A' : showWrong ? '#EF5350' : '#E8E8E8'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    animation: showWrong ? 'shake 0.3s' : showCorrect ? 'pop 0.3s' : undefined,
                    opacity: g.feedback && !showCorrect && !showWrong ? 0.3 : 1,
                    boxShadow:'0 3px 10px rgba(0,0,0,0.05)',
                  }}>
                  <Arrow dir={dir} size={40} color={showCorrect ? '#2E7D32' : showWrong ? '#C62828' : '#555'} />
                  <span style={{ fontSize:16, fontWeight:900, color: showCorrect ? '#2E7D32' : showWrong ? '#C62828' : '#555' }}>
                    {dir === 'left' ? 'ひだり' : 'みぎ'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* DONE */}
      {screen === 'done' && (() => {
        const total = TOTAL_TRIALS;
        const pct = g.correct / total;
        const emoji = pct >= 0.85 ? '🎉' : pct >= 0.6 ? '👍' : '😊';
        const msg = pct >= 0.85 ? 'すばらしい！' : pct >= 0.6 ? 'いいね！' : 'またやろう！';
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', textAlign:'center', minHeight:'70vh' }}>
            <div style={{ fontSize:64, marginBottom:8, animation:'pop 0.6s ease-out' }}>{emoji}</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#E8652E', marginBottom:14 }}>{msg}</div>

            <div style={{ background:'white', borderRadius:24, padding:'18px 36px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', marginBottom:10 }}>
              <div style={{ fontFamily:'Outfit,sans-serif', fontSize:40, fontWeight:900, color:'#E8652E' }}>
                {g.score}<span style={{ fontSize:18, color:'#9E9E9E' }}>てん</span>
              </div>
            </div>

            <div style={{ fontSize:16, fontWeight:700, color:'#555', marginBottom:16 }}>
              {g.correct}もん せいかい / {total}もん
            </div>

            {/* Flanker effect */}
            <div style={{ background:'white', borderRadius:16, padding:'14px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', marginBottom:20, minWidth:280 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#9E9E9E', marginBottom:8 }}>認知機能レポート</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#555' }}>おなじむき（かんたん）</span>
                <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:900, color:'#2E7D32' }}>
                  {g.congruentCorrect}/{g.congruentTotal} {avgCongruentRT > 0 && <span style={{ marginLeft:6, color:'#888' }}>{avgCongruentRT}ms</span>}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'#555' }}>ぎゃくむき（むずかしい）</span>
                <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:900, color:'#E8652E' }}>
                  {g.incongruentCorrect}/{g.incongruentTotal} {avgIncongruentRT > 0 && <span style={{ marginLeft:6, color:'#888' }}>{avgIncongruentRT}ms</span>}
                </span>
              </div>
              {flankerEffect > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:'1px solid #F0F0F0' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#555' }}>抑制にかかった時間</span>
                  <span style={{ fontFamily:'Outfit', fontSize:14, fontWeight:900, color:'#C62828' }}>+{flankerEffect}ms</span>
                </div>
              )}
            </div>

            <button onClick={startGame} style={{
              ...bs, fontSize:22, fontWeight:900, color:'white',
              background:'#E8652E', border:'none',
              padding:'20px 44px', borderRadius:60,
              boxShadow:'0 6px 20px rgba(232,101,46,0.3)',
            }}>もういちど</button>
          </div>
        );
      })()}
    </div>
  );
}
