import { useState, useRef, useEffect } from "react";

// ========== ブロックたおし - 積み木パターン記憶 ==========
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

const COLORS = [
  { name:'あか', bg:'#E53935', light:'#EF9A9A' },
  { name:'あお', bg:'#1E88E5', light:'#90CAF9' },
  { name:'きいろ', bg:'#FDD835', light:'#FFF59D' },
  { name:'みどり', bg:'#43A047', light:'#A5D6A7' },
  { name:'むらさき', bg:'#8E24AA', light:'#CE93D8' },
  { name:'オレンジ', bg:'#FB8C00', light:'#FFCC80' },
];

const DIFF = {
  easy:  { label:'かんたん', emoji:'🌱', desc:'3〜4段・長め記憶', rounds:6, minBlocks:3, maxBlocks:4, showTime:4000, modes:['tower','color_seq'] },
  normal:{ label:'ふつう', emoji:'🌿', desc:'4〜5段・パターンも', rounds:8, minBlocks:4, maxBlocks:5, showTime:3000, modes:['tower','color_seq','pattern'] },
  hard:  { label:'むずかしい', emoji:'🌳', desc:'5〜6段・短い記憶', rounds:10, minBlocks:5, maxBlocks:6, showTime:2000, modes:['tower','color_seq','pattern','reverse'] },
};

function genRound(diff) {
  const cfg = DIFF[diff];
  const mode = cfg.modes[Math.floor(Math.random() * cfg.modes.length)];
  const blockCount = cfg.minBlocks + Math.floor(Math.random() * (cfg.maxBlocks - cfg.minBlocks + 1));

  // Generate unique-ish color sequence
  const colors = [];
  const available = shuffle([...COLORS]);
  for (let i = 0; i < blockCount; i++) {
    colors.push(available[i % available.length]);
  }

  if (mode === 'tower') {
    return { mode, colors, blockCount, title:'おぼえてつもう', desc:'見本と同じ順番で積もう', showTime:cfg.showTime };
  }
  if (mode === 'color_seq') {
    return { mode, colors, blockCount, title:'色の順番', desc:'色の順番を覚えて再現しよう', showTime:cfg.showTime };
  }
  if (mode === 'pattern') {
    // 2xN grid pattern
    const width = 2;
    const height = Math.ceil(blockCount / 2);
    const grid = [];
    const gridColors = shuffle([...COLORS]);
    for (let i = 0; i < width * height; i++) {
      grid.push(gridColors[i % gridColors.length]);
    }
    return { mode, grid, width, height, blockCount:width*height, title:'ブロックパターン', desc:'模様を覚えて再現しよう', showTime:cfg.showTime };
  }
  if (mode === 'reverse') {
    return { mode, colors, blockCount, title:'さかさまに積もう', desc:'見本を逆の順番で積もう！', showTime:cfg.showTime };
  }
  return genRound(diff);
}

export default function BlockStack() {
  const [screen, setScreen] = useState('menu');
  const [difficulty, setDifficulty] = useState('normal');
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(x => x + 1);

  const g = useRef({
    rounds:[], currentR:0, score:0, correct:0, results:[],
    phase:'idle', // showing, building, feedback
    // Building state
    placed:[], currentIdx:0, wrongCount:0,
    // Pattern mode
    gridPlaced:[], gridIdx:0,
    history:[],
  }).current;

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const startGame = (diff) => {
    setDifficulty(diff);
    const cfg = DIFF[diff];
    const rounds = [];
    for (let i = 0; i < cfg.rounds; i++) rounds.push(genRound(diff));
    g.rounds = rounds; g.currentR = 0; g.score = 0; g.correct = 0; g.results = [];
    setScreen('game');
    startRound(0);
  };

  const startRound = (idx) => {
    g.currentR = idx;
    const round = g.rounds[idx];
    g.placed = []; g.currentIdx = 0; g.wrongCount = 0;
    g.gridPlaced = []; g.gridIdx = 0;
    g.phase = 'showing';
    rerender();
    timerRef.current = setTimeout(() => {
      g.phase = 'building';
      rerender();
    }, round.showTime);
  };

  const handleColorPick = (colorObj) => {
    if (g.phase !== 'building') return;
    const round = g.rounds[g.currentR];

    if (round.mode === 'pattern') {
      const expected = round.grid[g.gridIdx];
      if (colorObj.name === expected.name) {
        g.gridPlaced.push(colorObj);
        g.gridIdx++;
        if (g.gridIdx >= round.grid.length) finishRound(true);
        else rerender();
      } else {
        g.wrongCount++;
        rerender();
        if (g.wrongCount >= 3) finishRound(false);
      }
      return;
    }

    // Tower / color_seq / reverse
    let expected;
    if (round.mode === 'reverse') {
      expected = round.colors[round.blockCount - 1 - g.currentIdx];
    } else {
      expected = round.colors[g.currentIdx];
    }

    if (colorObj.name === expected.name) {
      g.placed.push(colorObj);
      g.currentIdx++;
      if (g.currentIdx >= round.blockCount) finishRound(true);
      else rerender();
    } else {
      g.wrongCount++;
      rerender();
      if (g.wrongCount >= 3) finishRound(false);
    }
  };

  const finishRound = (success) => {
    g.phase = 'feedback';
    const round = g.rounds[g.currentR];
    let result;
    if (success && g.wrongCount === 0) { result = 'perfect'; g.correct++; g.score += 20; }
    else if (success) { result = 'good'; g.correct++; g.score += 10; }
    else { result = 'miss'; g.score += 2; }
    g.results.push({ mode:round.mode, result, wrong:g.wrongCount, title:round.title });
    rerender();
    timerRef.current = setTimeout(() => {
      if (g.currentR + 1 >= g.rounds.length) {
        setScreen('result');
        g.history = [{ diff:difficulty, correct:g.correct, total:g.rounds.length, score:g.score, date:new Date().toISOString() }, ...g.history].slice(0,20);
      } else startRound(g.currentR + 1);
      rerender();
    }, success ? 1200 : 2000);
  };

  const goMenu = () => { clearTimeout(timerRef.current); setScreen('menu'); rerender(); };
  const cfg = DIFF[difficulty];
  const bs = { fontFamily:"'Zen Maru Gothic',sans-serif", cursor:'pointer', transition:'all 0.2s' };

  // Block component
  const Block = ({ color, size, label, dim }) => (
    <div style={{
      width:size||60, height:size?size*0.7:42, borderRadius:8,
      background:color?.bg||'#E0E0E0',
      border:`3px solid ${color ? 'rgba(0,0,0,0.15)' : '#BDBDBD'}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      opacity:dim?0.3:1,
      boxShadow: color ? '0 3px 0 rgba(0,0,0,0.15)' : 'none',
    }}>
      {label && <span style={{ fontSize:11, fontWeight:700, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>{label}</span>}
    </div>
  );

  // Tower display (vertical stack)
  const Tower = ({ colors, placed, showAll, reverse }) => {
    const display = showAll ? colors : (reverse ? [...placed].reverse() : placed);
    const total = colors.length;
    return (
      <div style={{ display:'flex', flexDirection:'column-reverse', alignItems:'center', gap:2, minHeight:total*46 }}>
        {Array.from({length:total}).map((_, i) => {
          const color = display[i] || null;
          return <Block key={i} color={color} size={70 + (total-i)*8} />;
        })}
      </div>
    );
  };

  // Grid display (2xN)
  const Grid = ({ grid, width, height, placed, showAll }) => {
    const display = showAll ? grid : placed;
    return (
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${width},1fr)`, gap:4, maxWidth:180, margin:'0 auto' }}>
        {Array.from({length:width*height}).map((_, i) => {
          const color = display[i] || null;
          return <Block key={i} color={color} size={80} />;
        })}
      </div>
    );
  };

  // Color picker buttons
  const ColorPicker = ({ round }) => {
    // Show all colors that appear in this round as choices + 1-2 distractors
    let choices;
    if (round.mode === 'pattern') {
      const unique = [...new Map(round.grid.map(c => [c.name, c])).values()];
      const extras = COLORS.filter(c => !unique.find(u => u.name === c.name)).slice(0, 1);
      choices = shuffle([...unique, ...extras]);
    } else {
      const unique = [...new Map(round.colors.map(c => [c.name, c])).values()];
      const extras = COLORS.filter(c => !unique.find(u => u.name === c.name)).slice(0, 1);
      choices = shuffle([...unique, ...extras]);
    }

    return (
      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
        {choices.map((c, i) => (
          <button key={i} onClick={() => handleColorPick(c)}
            style={{
              ...bs, width:60, height:60, borderRadius:14,
              background:c.bg, border:'3px solid rgba(0,0,0,0.1)',
              boxShadow:'0 4px 0 rgba(0,0,0,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
            <span style={{ fontSize:11, fontWeight:900, color:'white', textShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>{c.name}</span>
          </button>
        ))}
      </div>
    );
  };

  const MODE_LABELS = {
    tower:'🏗️ おぼえてつもう',
    color_seq:'🎨 色の順番',
    pattern:'🧩 ブロックパターン',
    reverse:'🔄 さかさまに積もう',
  };

  return (
    <div style={{ fontFamily:"'Zen Maru Gothic','Hiragino Maru Gothic ProN',sans-serif", background:'#FAFAF8', minHeight:'100vh', color:'#333' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700;900&family=Outfit:wght@300;400;600;700;800&display=swap');
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blockPlace{0%{transform:scale(0.5) translateY(-20px);opacity:0}60%{transform:scale(1.1) translateY(0)}100%{transform:scale(1) translateY(0)}}
        @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
        @media(min-width:768px){#root{zoom:1.25}}@media(min-width:1200px){#root{zoom:1.8}}@media(min-width:1920px){#root{zoom:2.4}}
      `}</style>

      <div style={{ background:'white', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.03)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {screen !== 'menu' && <button onClick={goMenu} style={{...bs, fontSize:20, background:'none', border:'none', color:'#6B6B6B', padding:'4px 8px'}}>←</button>}
          <span style={{ fontSize:16, fontWeight:900, color:'#E8652E', letterSpacing:'0.08em' }}>🧩 ブロックたおし</span>
        </div>
        {screen === 'game' && <span style={{ fontSize:12, fontWeight:700, color:'white', background:'#888', padding:'3px 10px', borderRadius:50 }}>{g.currentR+1}/{g.rounds.length}</span>}
      </div>

      {/* MENU */}
      {screen === 'menu' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16, animation:'bounce 3s ease-in-out infinite' }}>🧩</div>
          <div style={{ fontSize:24, fontWeight:900, color:'#E8652E', letterSpacing:'0.1em', marginBottom:6 }}>ブロックたおし</div>
          <div style={{ fontSize:15, color:'#6B6B6B', marginBottom:8, lineHeight:1.9 }}>ブロックの並びを覚えて<br/>同じように積み上げよう！</div>
          <div style={{ fontSize:13, color:'#9E9E9E', marginBottom:28, background:'#F5F5F0', padding:'10px 18px', borderRadius:12 }}>🧠 視覚記憶・順序記憶・空間認識のトレーニングです</div>

          <div style={{ width:'100%', maxWidth:480, marginBottom:24, background:'white', borderRadius:16, padding:'20px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', textAlign:'left' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>🎯 4つのモード</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { icon:'🏗️', name:'おぼえてつもう', desc:'見本のタワーを覚えて同じ順番で積む' },
                { icon:'🎨', name:'色の順番', desc:'色の並びを覚えて再現する' },
                { icon:'🧩', name:'ブロックパターン', desc:'2列の模様を覚えて再現する' },
                { icon:'🔄', name:'さかさまに積もう', desc:'見本を逆の順番で積む！' },
              ].map((m,i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:18 }}>{m.icon}</span>
                  <div><span style={{ fontSize:13, fontWeight:700 }}>{m.name}</span><span style={{ fontSize:11, color:'#9E9E9E', marginLeft:6 }}>{m.desc}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ width:'100%', maxWidth:480 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#6B6B6B', marginBottom:10, textAlign:'left' }}>📊 難易度を選んでスタート</div>
            {Object.entries(DIFF).map(([k,d]) => (
              <button key={k} onClick={() => startGame(k)} style={{...bs, width:'100%', fontSize:15, fontWeight:700, padding:'18px 20px', borderRadius:16, border:'2px solid #E8E8E8', background:'white', display:'flex', alignItems:'center', gap:14, textAlign:'left', marginBottom:10}}>
                <span style={{ fontSize:26 }}>{d.emoji}</span>
                <div><div style={{ fontWeight:700 }}>{d.label}</div><div style={{ fontSize:12, color:'#6B6B6B', marginTop:2 }}>{d.desc}</div></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GAME */}
      {screen === 'game' && g.rounds[g.currentR] && (() => {
        const round = g.rounds[g.currentR];
        return (
          <div style={{ padding:'0 16px', maxWidth:580, margin:'0 auto' }}>
            {/* Status */}
            <div style={{ display:'flex', justifyContent:'center', gap:16, padding:'8px 14px', background:'white', borderRadius:'0 0 12px 12px', marginBottom:6 }}>
              <div style={{ textAlign:'center' }}><div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:800, color:'#555' }}>{g.score}pt</div><div style={{ fontSize:9, color:'#9E9E9E' }}>スコア</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:800, color:'#555' }}>{g.correct}/{g.currentR+(g.phase==='feedback'?1:0)}</div><div style={{ fontSize:9, color:'#9E9E9E' }}>正解</div></div>
              <div style={{ textAlign:'center' }}><div style={{ fontFamily:'Outfit', fontSize:16, fontWeight:800, color:'#C62828' }}>✕{g.wrongCount}</div><div style={{ fontSize:9, color:'#9E9E9E' }}>ミス</div></div>
            </div>

            <div style={{ display:'flex', gap:2, marginBottom:8 }}>
              {g.rounds.map((_,i) => (<div key={i} style={{ flex:1, height:4, borderRadius:2, background:i<g.results.length?(g.results[i].result==='perfect'?'#8BC34A':g.results[i].result==='good'?'#FFB74D':'#EF9A9A'):i===g.currentR?'#FFB74D':'#E8E8E8' }} />))}
            </div>

            <div style={{ animation:'fadeUp 0.3s ease-out' }} key={g.currentR}>
              {/* Mode badge */}
              <div style={{ textAlign:'center', marginBottom:6 }}>
                <span style={{ fontSize:12, fontWeight:900, color:'#E8652E', background:'#FFF3E0', padding:'4px 12px', borderRadius:50 }}>{MODE_LABELS[round.mode]}</span>
              </div>

              {/* SHOWING phase */}
              {g.phase === 'showing' && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:'#E8652E', marginBottom:12 }}>おぼえてね！</div>
                  <div style={{ background:'white', borderRadius:18, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', display:'inline-block' }}>
                    {round.mode === 'pattern' ? (
                      <Grid grid={round.grid} width={round.width} height={round.height} placed={round.grid} showAll={true} />
                    ) : (
                      <Tower colors={round.colors} placed={round.colors} showAll={true} />
                    )}
                  </div>
                  <div style={{ fontSize:13, color:'#9E9E9E', marginTop:10 }}>
                    {round.mode === 'reverse' ? '⚠️ これを逆の順番で積みます！' : 'この順番をおぼえてね'}
                  </div>
                </div>
              )}

              {/* BUILDING phase */}
              {g.phase === 'building' && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:900, color:'#333', marginBottom:8 }}>
                    {round.desc}
                  </div>

                  {/* Current state */}
                  <div style={{ background:'white', borderRadius:18, padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', display:'inline-block', marginBottom:12 }}>
                    {round.mode === 'pattern' ? (
                      <div>
                        <Grid grid={round.grid} width={round.width} height={round.height} placed={g.gridPlaced} showAll={false} />
                        <div style={{ fontSize:12, color:'#9E9E9E', marginTop:8 }}>{g.gridIdx+1}/{round.grid.length}番目</div>
                      </div>
                    ) : (
                      <div>
                        <Tower colors={round.colors} placed={g.placed} showAll={false} reverse={round.mode === 'reverse'} />
                        <div style={{ fontSize:12, color:'#9E9E9E', marginTop:8 }}>{g.currentIdx+1}/{round.blockCount}段目</div>
                      </div>
                    )}
                  </div>

                  {/* Wrong indicator */}
                  {g.wrongCount > 0 && (
                    <div style={{ fontSize:14, color:'#C62828', fontWeight:700, marginBottom:6, animation:'shake 0.3s' }}>
                      ❌ ちがうよ！（あと{3-g.wrongCount}回）
                    </div>
                  )}

                  {/* Color picker */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:13, color:'#9E9E9E', marginBottom:6 }}>どの色？</div>
                    <ColorPicker round={round} />
                  </div>
                </div>
              )}

              {/* FEEDBACK phase */}
              {g.phase === 'feedback' && (() => {
                const r = g.results[g.results.length - 1];
                return (
                  <div style={{ textAlign:'center', padding:'20px', animation:'fadeUp 0.3s ease-out' }}>
                    <div style={{ fontSize:48, marginBottom:8 }}>
                      {r.result === 'perfect' ? '🎉' : r.result === 'good' ? '👍' : '🤔'}
                    </div>
                    <div style={{ fontSize:22, fontWeight:900, color:r.result==='perfect'?'#2E7D32':r.result==='good'?'#E8652E':'#999' }}>
                      {r.result === 'perfect' ? '完璧！' : r.result === 'good' ? 'クリア！' : '残念！'}
                    </div>
                    {r.result !== 'miss' && r.wrong > 0 && (
                      <div style={{ fontSize:13, color:'#9E9E9E', marginTop:4 }}>ミス{r.wrong}回</div>
                    )}
                    {r.result === 'miss' && (
                      <div style={{ marginTop:12 }}>
                        <div style={{ fontSize:14, color:'#6B6B6B', marginBottom:6 }}>正解はこれ：</div>
                        <div style={{ display:'inline-block', background:'white', borderRadius:14, padding:'12px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                          {round.mode === 'pattern' ? (
                            <Grid grid={round.grid} width={round.width} height={round.height} placed={round.grid} showAll={true} />
                          ) : (
                            <Tower colors={round.colors} placed={round.colors} showAll={true} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div style={{ height:20 }} />
          </div>
        );
      })()}

      {/* RESULT */}
      {screen === 'result' && (() => {
        const total = g.rounds.length;
        const perfects = g.results.filter(r => r.result === 'perfect').length;
        const pct = total > 0 ? g.correct / total : 0;
        const stars = pct >= 0.8 ? '⭐⭐⭐' : pct >= 0.5 ? '⭐⭐' : '⭐';
        const msg = pct >= 0.8 ? '記憶力バツグン！' : pct >= 0.5 ? 'いい調子！' : 'もっと練習！';
        return (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px', textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:16, animation:'fadeUp 0.6s ease-out' }}>{stars}</div>
            <div style={{ fontSize:24, fontWeight:900, color:'#E8652E', marginBottom:6, letterSpacing:'0.08em' }}>{msg}</div>
            <div style={{ fontSize:15, color:'#6B6B6B', marginBottom:24 }}>{cfg.label}モード</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, width:'100%', maxWidth:340, marginBottom:20 }}>
              {[{v:`🎉${perfects}`,l:'完璧',c:'#2E7D32'},{v:`${g.correct}/${total}`,l:'クリア',c:'#555'},{v:`${g.score}pt`,l:'スコア',c:'#E8652E'}].map((x,i) => (
                <div key={i} style={{ background:'white', borderRadius:16, padding:'14px 8px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', textAlign:'center' }}>
                  <div style={{ fontFamily:'Outfit', fontSize:22, fontWeight:800, color:x.c }}>{x.v}</div>
                  <div style={{ fontSize:10, color:'#9E9E9E', marginTop:4 }}>{x.l}</div>
                </div>
              ))}
            </div>

            <div style={{ width:'100%', maxWidth:480, marginBottom:24 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#6B6B6B', marginBottom:8, textAlign:'left' }}>📋 ラウンド別</div>
              {g.results.map((r,i) => (
                <div key={i} style={{ background:r.result==='perfect'?'#F1F8E9':r.result==='good'?'#FFF3E0':'#FAFAFA', borderRadius:12, padding:'8px 14px', marginBottom:4, borderLeft:`4px solid ${r.result==='perfect'?'#8BC34A':r.result==='good'?'#FFB74D':'#E0E0E0'}`, textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{r.result==='perfect'?'🎉':r.result==='good'?'👍':'🤔'} {r.title}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#555' }}>✕{r.wrong}</div>
                </div>
              ))}
            </div>

            <div style={{ width:'100%', maxWidth:480, marginBottom:24, padding:'14px 16px', background:'#FAFAF8', border:'1px solid #E8E8E8', borderRadius:12, textAlign:'left' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#6B6B6B', marginBottom:6 }}>💡 コツ</div>
              <div style={{ fontSize:12, color:'#9E9E9E', lineHeight:1.9 }}>
                色の順番を声に出して覚えると記憶に残りやすくなります。「あか・あお・きいろ」のようにリズムよく唱えてみましょう。
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
              <button onClick={() => startGame(difficulty)} style={{...bs, fontSize:16, fontWeight:700, color:'white', background:'#E8652E', border:'none', padding:'16px 32px', borderRadius:60}}>もう一度プレイ 🔄</button>
              <button onClick={goMenu} style={{...bs, fontSize:14, fontWeight:700, color:'#6B6B6B', background:'white', border:'2px solid #E0E0E0', padding:'14px 32px', borderRadius:60}}>設定を変える</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
