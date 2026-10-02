import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpDown, Check, Lightbulb, RotateCcw, Sparkles, Timer, Trophy, Zap } from 'lucide-react';

type Game = 'tic' | 'wend';

const emptyBoard = Array.from({ length: 9 }, () => null as 'X' | 'O' | null);

function storedNumber(key:string, fallback=0){
  if(typeof window==='undefined') return fallback;
  return Number(window.localStorage.getItem(key) || fallback);
}

const WIN_LINES=[[0,1,2],[3,4,5],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function winner(board:(string|null)[]){
  for(const [a,b,c] of WIN_LINES){
    if(board[a]&&board[a]===board[b]&&board[a]===board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

function winningCells(board:(string|null)[]){
  for(const line of WIN_LINES){
    const [a,b,c]=line;
    if(board[a]&&board[a]===board[b]&&board[a]===board[c]) return line;
  }
  return [];
}

function minimax(board:(string|null)[], maximizing:boolean):number{
  const w=winner(board);
  if(w==='O') return 1;
  if(w==='X') return -1;
  if(w==='draw') return 0;

  const moves=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null);
  const scores=moves.map(i=>{
    const next=[...board];
    next[i]=maximizing?'O':'X';
    return minimax(next,!maximizing);
  });
  return maximizing?Math.max(...scores):Math.min(...scores);
}

function aiMove(board:(string|null)[]){
  const moves=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null);
  let best=-Infinity;
  let pick=moves[0]??0;

  for(const i of moves){
    const next=[...board];
    next[i]='O';
    const score=minimax(next,false);
    if(score>best){
      best=score;
      pick=i;
    }
  }
  return pick;
}

type TicMode='casual'|'perfect';

function Tic(){
  type Result='win'|'loss'|'draw';
  const [board,setBoard]=useState<(string|null)[]>([...emptyBoard]);
  const [thinking,setThinking]=useState(false);
  const [mode,setMode]=useState<TicMode>('perfect');
  const [stats,setStats]=useState(()=>{
    if(typeof window==='undefined') return {wins:0,losses:0,draws:0,streak:0};
    return {
      wins:storedNumber('brain-tic-wins'),
      losses:storedNumber('brain-tic-losses'),
      draws:storedNumber('brain-tic-draws'),
      streak:storedNumber('brain-tic-streak')
    };
  });
  const [last,setLast]=useState('');
  const w=winner(board);
  const winCells=winningCells(board);

  const record=(result:Result)=>{
    setStats(prev=>{
      const next={
        wins:prev.wins+(result==='win'?1:0),
        losses:prev.losses+(result==='loss'?1:0),
        draws:prev.draws+(result==='draw'?1:0),
        streak:result==='win'?prev.streak+1:0
      };
      if(typeof window!=='undefined'){
        window.localStorage.setItem('brain-tic-wins',String(next.wins));
        window.localStorage.setItem('brain-tic-losses',String(next.losses));
        window.localStorage.setItem('brain-tic-draws',String(next.draws));
        window.localStorage.setItem('brain-tic-streak',String(next.streak));
      }
      return next;
    });
  };

  const chooseCasualMove=(board:(string|null)[])=>{
    const moves=board.map((v,i)=>v?null:i).filter((v):v is number=>v!==null);
    if(moves.length===0) return 0;
    const winNow=moves.find(i=>{
      const next=[...board];
      next[i]='O';
      return winner(next)==='O';
    });
    if(winNow!==undefined) return winNow;
    const blockNow=moves.find(i=>{
      const next=[...board];
      next[i]='X';
      return winner(next)==='X';
    });
    if(blockNow!==undefined) return blockNow;
    if(Math.random()<0.45) return moves[Math.floor(Math.random()*moves.length)];
    return aiMove(board);
  };

  const move=(i:number)=>{
    if(board[i]||w||thinking) return;

    const next=[...board];
    next[i]='X';
    const humanResult=winner(next);
    setBoard(next);

    if(humanResult){
      const result=humanResult==='X'?'win':'draw';
      setLast(result==='win'?'You cracked the board! 🔥':'Draw — rematch?');
      record(result);
      return;
    }

    setThinking(true);
    window.setTimeout(()=>{
      const pick=mode==='perfect'?aiMove(next):chooseCasualMove(next);
      const out=[...next];
      out[pick]='O';
      const result=winner(out);
      setBoard(out);
      setThinking(false);

      if(result){
        setLast(result==='O'?'AI found the line. Run it back.':'Draw — rematch?');
        record(result==='O'?'loss':'draw');
      }
    },mode==='perfect'?240:320);
  };

  const reset=()=>{
    setBoard([...emptyBoard]);
    setThinking(false);
    setLast('');
  };

  return <div className="game-panel">
    <div className="game-topline">
      <div><span>Wins</span><strong>{stats.wins}</strong></div>
      <div><span>Losses</span><strong>{stats.losses}</strong></div>
      <div><span>Streak</span><strong>{stats.streak} 🔥</strong></div>
      <div><span>Mode</span><strong>{mode==='perfect'?'Perfect':'Casual'}</strong></div>
    </div>

    <div className="tic-toolbar">
      <div className="tic-mode-label"><Zap size={13}/> Choose your opponent</div>
      <div className="tic-mode-switch" role="group" aria-label="Tic-Tac-Toe difficulty">
        <button className={mode==='casual'?'selected':''} onClick={()=>{setMode('casual');reset();}}>Casual</button>
        <button className={mode==='perfect'?'selected':''} onClick={()=>{setMode('perfect');reset();}}>Perfect</button>
      </div>
    </div>

    <div className="tic-board" aria-label="Tic-Tac-Toe board">
      {board.map((v,i)=><motion.button
        whileHover={{backgroundColor:'rgba(255,255,255,.055)',scale:winCells.includes(i)?1.04:1.02}}
        whileTap={{scale:.94}}
        className={'tic-cell '+(v||'')+(winCells.includes(i)?' winner':'')}
        onClick={()=>move(i)}
        key={i}
        aria-label={'Tic-Tac-Toe cell '+(i+1)}
        disabled={Boolean(v)||Boolean(w)||thinking}
      >
        {v||''}
      </motion.button>)}
    </div>

    <div className="tic-underboard">
      <span>{last||(w==='draw'?'Board locked — clean draw.':w?w+' wins.':thinking?'AI is thinking…':'Your move — try to build a streak.')}</span>
      <span className="tic-engine">{mode==='perfect'?'Minimax engine':'Adaptive opponent'}</span>
    </div>

    <div className="game-actions">
      <span className="game-status">{stats.wins+stats.losses+stats.draws} rounds played</span>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> Rematch</button>
    </div>
  </div>;
}

type WendPuzzle={
  size:number;
  grid:string[];
  words:string[];
  lengths:number[];
  paths:number[][];
};

type RandomSource=()=>number;

function seededRandom(seed:number):RandomSource{
  let value=(seed|0)>>>0;
  return ()=>{
    value+=0x6D2B79F5;
    let t=value;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function shuffle<T>(items:T[],random:RandomSource){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}

function snakeTour(size:number,reverseRows=false,reverseColumns=false){
  const tour:number[]=[];
  for(let r=0;r<size;r++){
    const row=reverseRows?size-1-r:r;
    const leftToRight=r%2===0;
    for(let offset=0;offset<size;offset++){
      const c=reverseColumns
        ? (leftToRight?size-1-offset:offset)
        : (leftToRight?offset:size-1-offset);
      tour.push(row*size+c);
    }
  }
  return tour;
}

function columnTour(size:number,reverseRows=false,reverseColumns=false){
  const tour:number[]=[];
  for(let c=0;c<size;c++){
    const col=reverseColumns?size-1-c:c;
    const topToBottom=c%2===0;
    for(let offset=0;offset<size;offset++){
      const r=reverseRows
        ? (topToBottom?size-1-offset:offset)
        : (topToBottom?offset:size-1-offset);
      tour.push(r*size+col);
    }
  }
  return tour;
}

function transformTour(tour:number[],size:number,transform:number){
  const map=(index:number)=>{
    const r=Math.floor(index/size);
    const c=index%size;
    switch(transform){
      case 1:return c*size+(size-1-r);
      case 2:return (size-1-r)*size+(size-1-c);
      case 3:return (size-1-c)*size+r;
      case 4:return r*size+(size-1-c);
      case 5:return (size-1-r)*size+c;
      case 6:return c*size+r;
      default:return r*size+c;
    }
  };
  return tour.map(map);
}

function buildWendPuzzle(
  tour:number[],
  words:string[]
):WendPuzzle{
  const size=Math.sqrt(tour.length);
  const lengths=words.map(word=>word.length);
  const grid=Array<string>(tour.length).fill('');
  const paths:number[][]=[];
  let cursor=0;

  for(const word of words){
    const segment=tour.slice(cursor,cursor+word.length);
    paths.push(segment);
    segment.forEach((cell,i)=>{grid[cell]=word[i];});
    cursor+=word.length;
  }

  return {size,grid,words,lengths,paths};
}

const WEND_WORD_BANKS=[
  ['ARCHITECTURE','DATABASE','LATENCY','THREAD','KERNEL','CACHE','QUEUE'],
  ['MICROSERVICE','RESILIENCE','ROUTING','MUTEX','INDEX','ASYNC','CLOUD'],
  ['OBSERVABILITY','THROUGHPUT','CACHING','EVENTS','QUERY','PROXY','IO'],
  ['DEPLOYMENT','RELIABILITY','LATENCY','MUTEX','REDIS','QUEUE','KAFKA']
];

function makeWendPuzzle(seed:number):WendPuzzle{
  const random=seededRandom(seed);
  const bank=WEND_WORD_BANKS[Math.floor(random()*WEND_WORD_BANKS.length)];
  const words=shuffle(bank,random);
  const size=7;
  const baseTour=Math.floor(random()*2)===0
    ? snakeTour(size,random()>.5,random()>.5)
    : columnTour(size,random()>.5,random()>.5);
  const tour=transformTour(baseTour,size,Math.floor(random()*7));
  return buildWendPuzzle(tour,words);
}

function Wend(){
  const [puzzleSeed,setPuzzleSeed]=useState(20261002);
  const puzzle=useMemo(()=>makeWendPuzzle(puzzleSeed),[puzzleSeed]);
  const [path,setPath]=useState<number[]>([]);
  const [found,setFound]=useState<string[]>([]);
  const [history,setHistory]=useState<number[][]>([]);
  const [message,setMessage]=useState('');
  const [hints,setHints]=useState(0);
  const [elapsed,setElapsed]=useState(0);
  const [started,setStarted]=useState<number|null>(null);
  const [complete,setComplete]=useState(false);
  const [score,setScore]=useState(0);
  const [streak,setStreak]=useState(()=>storedNumber('brain-wend-streak'));
  const [best,setBest]=useState(()=>storedNumber('brain-wend-best'));
  const [mistakes,setMistakes]=useState(0);
  const [usedHint,setUsedHint]=useState<number|null>(null);
  const [dragging,setDragging]=useState(false);
  const usedCells=new Set(history.flat());

  useEffect(()=>{
    setElapsed(0);
    setStarted(null);
    setComplete(false);
    setPath([]);
    setFound([]);
    setHistory([]);
    setMessage('');
    setHints(0);
    setUsedHint(null);
    setScore(0);
    setMistakes(0);
    setDragging(false);
    setStreak(0);
    window.localStorage.setItem('brain-wend-streak','0');
  },[puzzleSeed]);

  useEffect(()=>{
    if(!started||complete) return;
    const id=window.setInterval(()=>setElapsed(performance.now()-started),100);
    return()=>window.clearInterval(id);
  },[started,complete]);

  const formatTime=(ms:number)=>
    String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');
  const elapsedSeconds=Math.floor(elapsed/1000);
  const nextWordIndex=puzzle.words.findIndex(item=>!found.includes(item));

  const row=(i:number)=>Math.floor(i/puzzle.size);
  const col=(i:number)=>i%puzzle.size;
  const adjacent=(a:number,b:number)=>
    Math.abs(row(a)-row(b))+Math.abs(col(a)-col(b))===1;
  const word=(ids:number[])=>ids.map(i=>puzzle.grid[i]).join('');

  const begin=(i:number)=>{
    if(complete||found.length===puzzle.words.length||usedCells.has(i)) return;
    if(!started) setStarted(performance.now());
    setMessage('');
    setUsedHint(null);
    setDragging(true);
    setPath([i]);
  };

  const extend=(i:number)=>{
    if(!dragging||complete||path.length===0) return;
    const last=path[path.length-1];
    if(i===last||path.includes(i)||usedCells.has(i)||!adjacent(last,i)) return;
    setPath(prev=>[...prev,i]);
  };

  const finish=()=>{
    if(!dragging) return;
    setDragging(false);

    if(path.length<2){
      setPath([]);
      return;
    }

    const formed=word(path);
    const targetIndex=puzzle.words.indexOf(formed);

    if(targetIndex>=0&&!found.includes(formed)){
      setHistory(prev=>[...prev,path]);
      setFound(prev=>{
        const next=[...prev,formed];
        const gained=formed.length*100+Math.max(0,100-hints*12);
        const nextScore=score+gained;

        setScore(nextScore);
        setStreak(prevStreak=>{
          const nextStreak=prevStreak+1;
          window.localStorage.setItem('brain-wend-streak',String(nextStreak));
          return nextStreak;
        });

        if(next.length===puzzle.words.length){
          setComplete(true);
          setElapsed(performance.now()-(started??performance.now()));
          setBest(prevBest=>{
            const nextBest=Math.max(prevBest,nextScore);
            window.localStorage.setItem('brain-wend-best',String(nextBest));
            return nextBest;
          });
        }
        return next;
      });
      setMessage('Nice find — keep the streak alive.');
      if(typeof navigator!=='undefined' && 'vibrate' in navigator) navigator.vibrate?.(18);
      setPath([]);
      return;
    }

    setStreak(0);
    setMistakes(prev=>prev+1);
    if(typeof navigator!=='undefined' && 'vibrate' in navigator) navigator.vibrate?.(35);
    if(typeof window!=='undefined') window.localStorage.setItem('brain-wend-streak','0');
    setMessage(formed+' is not one of the hidden words.');
    setPath([]);
  };

  useEffect(()=>{
    const onPointerUp=()=>{if(dragging) finish();};
    window.addEventListener('pointerup',onPointerUp);
    return()=>window.removeEventListener('pointerup',onPointerUp);
  },[dragging,path,found,hints,started,score]);

  const undo=()=>{
    setPath([]);
    setMessage('');
    setDragging(false);
    if(history.length===0) return;

    const removedPath=history[history.length-1];
    const removedWord=word(removedPath);
    setHistory(prev=>prev.slice(0,-1));
    setFound(prev=>prev.filter(item=>item!==removedWord));
    setComplete(false);
  };

  const reset=()=>{
    setPath([]);
    setFound([]);
    setHistory([]);
    setMessage('');
    setHints(0);
    setUsedHint(null);
    setComplete(false);
    setElapsed(0);
    setStarted(null);
    setDragging(false);
    setScore(0);
    setMistakes(0);
    setStreak(0);
    if(typeof window!=='undefined') window.localStorage.setItem('brain-wend-streak','0');
  };

  const hint=()=>{
    if(complete||found.length===puzzle.words.length) return;
    if(!started) setStarted(performance.now());

    const targetIndex=puzzle.words.findIndex(item=>!found.includes(item));
    const targetPath=puzzle.paths[targetIndex];
    if(!targetPath) return;

    const reveal=Math.min(hints,targetPath.length-1);
    setHints(hints+1);
    setUsedHint(targetPath[reveal]);
    setMessage('Hint: the highlighted tile is part of the next word.');
  };

  const newPuzzle=()=>setPuzzleSeed(seed=>seed+1);
  const formed=word(path);
  const points=(ids:number[])=>
    ids.map(i=>((col(i)+0.5)/puzzle.size*500)+','+((row(i)+0.5)/puzzle.size*500)).join(' ');

  return <div className="game-panel wend-panel">
    <div className="game-topline">
      <div><span>Difficulty</span><strong>Hard</strong></div>
      <div><span>Time</span><strong>{formatTime(elapsed)}</strong></div>
      <div><span>Score</span><strong>{score}</strong></div>
      <div><span>Streak</span><strong>{streak} 🔥</strong></div>
      <div><span>Best</span><strong>{best}</strong></div>
      <div><span>Found</span><strong>{found.length}/{puzzle.words.length}</strong></div>
      <div><span>Mistakes</span><strong>{mistakes}</strong></div>
    </div>

    <div className="wend-progress">
      <div className="wend-progress-track"><span style={{width:(found.length/puzzle.words.length*100)+'%'}} /></div>
      <span>{found.length === puzzle.words.length ? 'Complete' : Math.round(found.length/puzzle.words.length*100)+'% solved'}</span>
      <span className="wend-puzzle-id">Puzzle #{String(puzzleSeed).slice(-4)}</span>
    </div>

    <div className="wend-help">
      <span>7 × 7 board</span>
      <span>Drag through adjacent letters</span>
      <span>No diagonals</span>
      <span>Use every tile exactly once</span>
      <span>New puzzle every run</span>
    </div>

    <div className="wend-layout">
      <div className="wend-board-wrap">
        <svg className="wend-lines" viewBox="0 0 500 500" aria-hidden="true">
          {history.map((ids,index)=><polyline key={'found-'+index} points={points(ids)} />)}
          {path.length>1&&<polyline className="active-path" points={points(path)} />}
        </svg>

        <div
          className="wend-grid"
          onPointerUp={finish}
          onPointerCancel={finish}
          onPointerMove={event=>{
            if(!dragging) return;
            const hit=document.elementFromPoint(event.clientX,event.clientY);
            const cell=hit?.closest?.('[data-wend-index]') as HTMLElement|null;
            const index=cell?Number(cell.dataset.wendIndex):NaN;
            if(Number.isFinite(index)) extend(index);
          }}
        >
          {puzzle.grid.map((letter,index)=>{
            const isPath=path.includes(index);
            const isFound=usedCells.has(index);

            return <button
              key={index}
              type="button"
              data-wend-index={index}
              className={'wend-cell '+(isPath?'current ':'')+(isFound?'found ':'')+(usedHint===index?'hinted ':'')}
              onPointerDown={event=>{event.preventDefault();begin(index);}}
              aria-label={'Letter '+letter+', tile '+(index+1)}
            >{letter}</button>;
          })}
        </div>
      </div>

      <aside className="wend-word-list" aria-live="polite">
        <div className="wend-list-title">Find these lengths</div>
        {puzzle.lengths.map((length,index)=>{
          const hit=puzzle.words[index]&&found.includes(puzzle.words[index])?puzzle.words[index]:undefined;
          return <div className={'wend-target '+(hit?'done':'')} key={index}>
            <span>{hit||Array.from({length},()=>'_').join(' ')}</span>
            {hit&&<Check size={14}/>}
          </div>;
        })}
        {dragging&&<div className="wend-live"><Timer size={12}/> Selecting <b>{formed||'…'}</b> · {path.length} tile{path.length===1?'':'s'}</div>}
        {!dragging&&formed&&<div className="wend-live">Current: <b>{formed}</b></div>}
        {message&&<div className="wend-error">{message}</div>}
        {complete&&<div className="wend-complete"><Sparkles size={13}/> Puzzle complete · {formatTime(elapsed)} · {score} points</div>}
        {!complete&&nextWordIndex>=0&&<div className="wend-next">Next target: <b>{puzzle.lengths[nextWordIndex]} letters</b> · {Math.max(0,60-elapsedSeconds)}s speed bonus window</div>}
      </aside>
    </div>

    <div className="game-actions">
      <button className="lab-button primary" onClick={hint} disabled={complete}><Lightbulb size={13}/> Hint</button>
      <button className="lab-button" onClick={undo} disabled={history.length===0}><RotateCcw size={13}/> Undo</button>
      <button className="lab-button" onClick={reset}><RotateCcw size={13}/> Reset</button>
      <button className="lab-button" onClick={newPuzzle}>New puzzle</button>
    </div>

    <div className="cross-note">Original hard grid-word challenge · score + streaks saved locally · no backend.</div>
  </div>;
}

export default function BrainLab(){
  const [game,setGame]=useState<Game>('wend');
  const tabs=useMemo(()=>[
    {id:'tic' as const,label:'Tic-Tac-Toe',note:'Minimax AI',icon:Trophy},
    {id:'wend' as const,label:'Grid Word',note:'Drag to make words',icon:ArrowUpDown}
  ],[]);

  return <div className="brain-lab">
    <div className="lab-tabs">
      {tabs.map(({id,label,note,icon:Icon})=>
        <button className={game===id?'active':''} onClick={()=>setGame(id)} key={id}>
          <Icon size={14}/>
          <span>{label}</span>
          <small>{note}</small>
        </button>
      )}
    </div>

    <div className="lab-caption">
      <span>client-side experiments</span><span>•</span><span>scores stored locally</span><span>•</span><span>no backend</span>
    </div>

    <AnimatePresence mode="wait">
      <motion.div
        key={game}
        initial={{opacity:0,y:10}}
        animate={{opacity:1,y:0}}
        exit={{opacity:0,y:-8}}
        transition={{duration:.22}}
      >
        {game==='tic'&&<Tic/>}
        {game==='wend'&&<Wend/>}
      </motion.div>
    </AnimatePresence>
  </div>;
}
