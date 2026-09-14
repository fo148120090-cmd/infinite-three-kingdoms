import { useMemo, useState } from 'react';
import { ChevronRight, Save, Sparkles, Sword, Shield, RotateCcw, Footprints } from 'lucide-react';

type Faction = 'Wei' | 'Shu' | 'Wu' | 'Warlords';
type General = {
  id: string; name: string; title: string; faction: Faction; role: string;
  hp: number; atk: number; range: number; move: number;
  skill: string; skillPower: number; ultimate: string; ultimatePower: number; equipment: string;
};
type Unit = General & { team: 'player' | 'enemy'; x: number; y: number; currentHp: number; acted: boolean; rage: number; buff: number; stunned: boolean; movePoints: number };
type Terrain = 'plain' | 'forest' | 'hill' | 'water' | 'fort';
type SaveData = { floor: number; gold: number; gems: number; level: number; equipLevel: number; owned: string[] };

const saveKey = 'infinite-three-kingdoms-save-v2';
const W = 7, H = 6;
const terrain: Terrain[] = Array.from({ length: W * H }, (_, i) => i === 17 || i === 18 || i === 24 ? 'forest' : i === 11 || i === 12 ? 'hill' : i === 26 || i === 27 ? 'water' : i === 32 ? 'fort' : 'plain');
const terrainName: Record<Terrain, string> = { plain: '평지', forest: '숲', hill: '고지', water: '수로', fort: '진지' };
const terrainCost: Record<Terrain, number> = { plain: 1, forest: 2, hill: 1, water: 99, fort: 1 };

const generals: General[] = [
  { id:'liu-bei', name:'유비', title:'인덕의 군주', faction:'Shu', role:'지원', hp:120, atk:22, range:2, move:3, skill:'인덕의 격려', skillPower:0, ultimate:'인덕의 대의', ultimatePower:0, equipment:'쌍검' },
  { id:'guan-yu', name:'관우', title:'미염공', faction:'Shu', role:'전사', hp:150, atk:38, range:1, move:3, skill:'청룡참', skillPower:28, ultimate:'청룡언월도', ultimatePower:55, equipment:'청룡언월도' },
  { id:'zhang-fei', name:'장비', title:'만인지적', faction:'Shu', role:'수호', hp:190, atk:28, range:1, move:2, skill:'호통', skillPower:0, ultimate:'장판교 포효', ultimatePower:34, equipment:'장팔사모' },
  { id:'zhao-yun', name:'조운', title:'상산의 용', faction:'Shu', role:'기병', hp:135, atk:34, range:1, move:4, skill:'용진', skillPower:18, ultimate:'칠진칠출', ultimatePower:48, equipment:'용담창' },
  { id:'zhuge-liang', name:'제갈량', title:'와룡', faction:'Shu', role:'책사', hp:95, atk:30, range:3, move:2, skill:'천뢰', skillPower:24, ultimate:'공성계', ultimatePower:42, equipment:'백우선' },
  { id:'cao-cao', name:'조조', title:'위무제', faction:'Wei', role:'책사', hp:125, atk:29, range:2, move:3, skill:'간웅의 명령', skillPower:0, ultimate:'위무의 천명', ultimatePower:36, equipment:'의천검' },
  { id:'xiahou-dun', name:'하후돈', title:'독안의 맹장', faction:'Wei', role:'전사', hp:160, atk:35, range:1, move:3, skill:'맹격', skillPower:20, ultimate:'독안참', ultimatePower:45, equipment:'칠성도' },
  { id:'sun-quan', name:'손권', title:'강동의 호랑이', faction:'Wu', role:'지원', hp:130, atk:27, range:2, move:3, skill:'강동의 결의', skillPower:0, ultimate:'강동패왕', ultimatePower:30, equipment:'벽옥검' },
  { id:'lu-bu', name:'여포', title:'천하무쌍', faction:'Warlords', role:'기병', hp:180, atk:48, range:1, move:4, skill:'천하무쌍', skillPower:42, ultimate:'신마난무', ultimatePower:70, equipment:'방천화극' },
  { id:'diao-chan', name:'초선', title:'경국지색', faction:'Warlords', role:'지원', hp:90, atk:24, range:2, move:3, skill:'매혹', skillPower:0, ultimate:'폐월의 춤', ultimatePower:32, equipment:'금선연' },
];

const defaultSave: SaveData = { floor:1, gold:5000, gems:300, level:1, equipLevel:0, owned:generals.slice(0,5).map(g=>g.id) };
const loadSave = (): SaveData => { try { return { ...defaultSave, ...JSON.parse(localStorage.getItem(saveKey) || '{}') }; } catch { return defaultSave; } };
const dist = (a:{x:number;y:number}, b:{x:number;y:number}) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
const stat = (g: General, s: SaveData) => ({ hp:g.hp + (s.level-1)*12, atk:g.atk + (s.level-1)*3 + s.equipLevel*4 });

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<'home'|'tower'|'generals'|'summon'|'battle'>('home');
  const [selected, setSelected] = useState('guan-yu');
  const [target, setTarget] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [turn, setTurn] = useState<'player'|'enemy'>('player');
  const [log, setLog] = useState<string[]>(['천탑 전투 준비 완료.']);
  const [mode, setMode] = useState<'move'|'attack'|'skill'>('move');
  const selectedUnit = units.find(u => u.id === selected);
  const addLog = (s:string) => setLog(v => [s, ...v].slice(0,7));
  const persist = (next: SaveData) => { setSaveData(next); localStorage.setItem(saveKey, JSON.stringify(next)); };
  const team = useMemo(() => generals.filter(g => saveData.owned.includes(g.id)).slice(0,5), [saveData.owned]);

  const startBattle = () => {
    const ps = team.map((g,i) => { const st=stat(g,saveData); return { ...g, ...st, team:'player' as const, x:i%3, y:5-Math.floor(i/3), currentHp:st.hp, acted:false, rage:0, buff:0, stunned:false, movePoints:g.move }; });
    const ids = saveData.floor % 10 === 0 ? ['lu-bu','xiahou-dun','cao-cao'] : ['xiahou-dun','zhang-fei','sun-quan'];
    const es = ids.map((id,i) => { const g=generals.find(x=>x.id===id)!; const st=stat(g,saveData); return { ...g, ...st, team:'enemy' as const, x:4+(i%2), y:i+1, currentHp:st.hp+saveData.floor*5, acted:false, rage:0, buff:0, stunned:false, movePoints:g.move }; });
    setUnits([...ps,...es]); setSelected(team[1]?.id || team[0]?.id || 'liu-bei'); setTarget(null); setTurn('player'); setMode('move'); setLog([`천탑 ${saveData.floor}층 ${saveData.floor%10===0?'보스전! ':''}전투 시작.`]); setScreen('battle');
  };

  const damage = (a:Unit,b:Unit,bonus=0) => {
    const t=terrain[b.y*W+b.x]; const terrainBonus=t==='fort'?8:t==='hill'?4:0;
    return Math.max(1,a.atk+a.buff+bonus+terrainBonus-Math.floor(b.hp*.08));
  };

  const moveUnit = (x:number,y:number) => {
    if(!selectedUnit || selectedUnit.team!=='player' || selectedUnit.acted || turn!=='player') return;
    const occupied = units.some(u=>u.currentHp>0 && u.x===x && u.y===y);
    if(occupied){ addLog('다른 장수가 있는 칸은 이동할 수 없습니다.'); return; }
    const cell=terrain[y*W+x], cost=terrainCost[cell], d=dist(selectedUnit,{x,y});
    if(cost>=99){ addLog('수로에는 이동할 수 없습니다.'); return; }
    if(d===0){ return; }
    if(d>selectedUnit.movePoints || d>selectedUnit.move){ addLog(`이동력 부족: ${selectedUnit.movePoints}칸 남음`); return; }
    setUnits(us=>us.map(u=>u.id===selectedUnit.id?{...u,x,y,movePoints:u.movePoints-cost,acted:false}:u));
    addLog(`${selectedUnit.name}이(가) ${terrainName[cell]}으로 이동 (${cost} 이동력)`);
    setMode('attack');
  };

  const attack = () => {
    if(!selectedUnit || selectedUnit.team!=='player' || selectedUnit.acted || turn!=='player') return;
    const t=units.find(u=>u.id===target && u.team==='enemy' && u.currentHp>0);
    if(!t || dist(selectedUnit,t)>selectedUnit.range){addLog('공격 범위 안의 적을 선택하세요.');return;}
    const d=damage(selectedUnit,t);
    setUnits(us=>us.map(u=>u.id===selectedUnit.id?{...u,acted:true,rage:Math.min(100,u.rage+25)}:u.id===t.id?{...u,currentHp:Math.max(0,u.currentHp-d),rage:Math.min(100,u.rage+15)}:u));
    addLog(`${selectedUnit.name} → ${t.name} ${d} 피해`); setTarget(null); setMode('move');
  };

  const skill = () => {
    if(!selectedUnit || selectedUnit.acted || turn!=='player') return;
    const enemies=units.filter(u=>u.team==='enemy'&&u.currentHp>0&&dist(selectedUnit,u)<=selectedUnit.range+(selectedUnit.skill==='천뢰'?1:0));
    if(selectedUnit.skill==='인덕의 격려'){const ally=units.find(u=>u.team==='player'&&u.id!==selectedUnit.id&&u.currentHp>0);if(!ally)return;setUnits(us=>us.map(u=>u.id===ally.id?{...u,buff:u.buff+8}:u.id===selectedUnit.id?{...u,acted:true}:u));addLog(`${ally.name} 공격력 +8`);return;}
    if(selectedUnit.skill==='강동의 결의'){setUnits(us=>us.map(u=>u.team==='player'&&u.currentHp>0?{...u,buff:u.buff+3}:u.id===selectedUnit.id?{...u,acted:true}:u));addLog('아군 전체 공격력 +3');return;}
    if(selectedUnit.skill==='간웅의 명령'){setUnits(us=>us.map(u=>u.team==='enemy'&&u.currentHp>0?{...u,atk:Math.max(1,u.atk-6)}:u.id===selectedUnit.id?{...u,acted:true}:u));addLog('적 전체 공격력 -6');return;}
    const t=enemies.find(u=>u.id===target)||enemies[0]; if(!t){addLog('스킬 범위 안에 적이 없습니다.');return;}
    setUnits(us=>us.map(u=>u.id===selectedUnit.id?{...u,acted:true,rage:Math.min(100,u.rage+20)}:u.id===t.id?{...u,currentHp:Math.max(0,u.currentHp-damage(selectedUnit,t,selectedUnit.skillPower))}:u));
    addLog(`${selectedUnit.name}의 ${selectedUnit.skill}!`); setTarget(null); setMode('move');
  };

  const endTurn = () => {
    if(turn!=='player')return;
    setTurn('enemy');
    setTimeout(()=>{
      setUnits(prev=>{
        let next=prev.map(u=>u.team==='player'?{...u,acted:false,movePoints:u.move}:u);
        const targets=next.filter(u=>u.team==='player'&&u.currentHp>0);
        for(const e of next.filter(u=>u.team==='enemy'&&u.currentHp>0)){
          const t=targets.slice().sort((a,b)=>dist(a,e)-dist(b,e))[0];
          if(t&&dist(e,t)<=e.range){const d=damage(e,t);const idx=next.findIndex(x=>x.id===t.id);if(idx>=0)next[idx]={...next[idx],currentHp:Math.max(0,next[idx].currentHp-d)};addLog(`${e.name} → ${t.name} ${d} 피해`);}
          else {
            const step=[{x:e.x-1,y:e.y},{x:e.x,y:e.y-1},{x:e.x,y:e.y+1},{x:e.x+1,y:e.y}].filter(p=>p.x>=0&&p.x<W&&p.y>=0&&p.y<H&&terrain[p.y*W+p.x]!=='water'&&!next.some(u=>u.currentHp>0&&u.x===p.x&&u.y===p.y));
            const stepTo=step.sort((a,b)=>dist(a,t)-dist(b,t))[0];
            if(stepTo){const idx=next.findIndex(x=>x.id===e.id);if(idx>=0)next[idx]={...next[idx],x:stepTo.x,y:stepTo.y,movePoints:Math.max(0,e.movePoints-1)};addLog(`${e.name}이(가) 전진했습니다.`);}
          }
        }
        return next;
      });
      setTarget(null);setMode('move');setTurn('player');
    },350);
  };

  const victory=units.length>0 && !units.some(u=>u.team==='enemy'&&u.currentHp>0);
  const defeat=units.length>0 && !units.some(u=>u.team==='player'&&u.currentHp>0);
  const clearFloor=()=>{const reward=500+(saveData.floor%10===0?1000:0);persist({...saveData,floor:saveData.floor+1,gold:saveData.gold+reward,gems:saveData.gems+(saveData.floor%10===0?30:5)});setScreen('tower');setUnits([]);addLog(`천탑 클리어! 골드 +${reward}`);};
  const levelUp=()=>{const cost=saveData.level*300;if(saveData.gold<cost){addLog('골드가 부족합니다.');return;}persist({...saveData,level:saveData.level+1,gold:saveData.gold-cost});};
  const equipUp=()=>{const cost=(saveData.equipLevel+1)*500;if(saveData.gold<cost){addLog('골드가 부족합니다.');return;}persist({...saveData,equipLevel:saveData.equipLevel+1,gold:saveData.gold-cost});};
  const summon=()=>{if(saveData.gems<30){addLog('보석이 부족합니다.');return;}const pool=generals[Math.floor(Math.random()*generals.length)];const owned=saveData.owned.includes(pool.id);persist({...saveData,gems:saveData.gems-30,owned:owned?saveData.owned:[...saveData.owned,pool.id]});addLog(owned?`${pool.name} 중복 획득!`:`${pool.name} 획득!`);};

  if(screen==='home') return <main className="app"><header><div><small>INFINITE THREE KINGDOMS</small><h1>무한삼국지: 천탑전기</h1><p>삼국지 SRPG · 무한 천탑 · 장수 수집</p></div><button onClick={()=>persist(saveData)}><Save size={16}/> 저장</button></header><section className="hero"><div><span className="badge">MVP BUILD 0.6</span><h2>전장을 지배하라.</h2><p>이제 7×6 전장에서 실제 이동력으로 장수를 움직일 수 있습니다.</p><button className="primary" onClick={()=>setScreen('tower')}>천탑 입장 <ChevronRight/></button></div><div className="orb">∞</div></section><nav className="cards"><button onClick={()=>setScreen('tower')}><Sword/><b>천탑</b><span>{saveData.floor}층 · 10층 보스</span></button><button onClick={()=>setScreen('generals')}><Shield/><b>장수</b><span>{saveData.owned.length}/{generals.length}명 · Lv.{saveData.level}</span></button><button onClick={()=>setScreen('summon')}><Sparkles/><b>소환</b><span>{saveData.gems} 보석</span></button></nav></main>;

  if(screen==='tower') return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>천탑</h1><button onClick={()=>persist(saveData)}><Save size={16}/></button></header><section className="tower"><div className="tower-info"><span>현재 진행</span><strong>{saveData.floor}층</strong><p>10층마다 보스 · 50층 대보스 · 100층 스토리 이벤트</p><button className="primary" onClick={startBattle}>전투 시작 <ChevronRight/></button></div><div className="reward"><b>클리어 보상</b><span>골드 +500 · 보석 +5</span><span>보스층 보석 +30</span><span>전투 이동력: 장수별 기본 이동력 / 턴마다 회복</span></div></section></main>;

  if(screen==='generals') return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>장수</h1><span>골드 {saveData.gold}</span></header><section className="panel"><div className="upgrade"><b>계정 성장 Lv.{saveData.level}</b><button onClick={levelUp}>레벨업 ({saveData.level*300}G)</button><b>전용장비 강화 +{saveData.equipLevel}</b><button onClick={equipUp}>장비 강화 ({(saveData.equipLevel+1)*500}G)</button></div>{generals.map(g=>{const st=stat(g,saveData);return <article className="general" key={g.id}><div><b>{g.name}</b><small>{g.title} · {g.role}</small></div><span>HP {st.hp} · ATK {st.atk} · 이동 {g.move}</span><em>{g.equipment}</em></article>})}</section></main>;

  if(screen==='summon') return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>장수 소환</h1><span>💎 {saveData.gems}</span></header><section className="summon"><Sparkles size={52}/><h2>천탑의 부름</h2><p>10명의 장수 중 무작위로 1명을 소환합니다.</p><button className="primary" onClick={summon}>1회 소환 · 30 보석</button><div className="owned">보유 장수: {saveData.owned.map(id=>generals.find(g=>g.id===id)?.name).join(' · ')}</div></section></main>;

  return <main className="app"><header><button className="back" onClick={()=>setScreen('tower')}>← 천탑</button><h1>{saveData.floor}층 전투</h1><span className={`turn ${turn==='enemy'?'enemy':''}`}>{turn==='player'?'아군 턴':'적 턴'}</span></header><section className="battle-layout"><div><div className="grid">{Array.from({length:W*H},(_,i)=>{const x=i%W,y=Math.floor(i/W),u=units.find(v=>v.x===x&&v.y===y&&v.currentHp>0);const t=terrain[i];const moveable=!!selectedUnit&&mode==='move'&&selectedUnit.team==='player'&&!selectedUnit.acted&&selectedUnit.movePoints>0&&!u&&t!=='water'&&dist(selectedUnit,{x,y})<=selectedUnit.movePoints;const targetable=!!selectedUnit&&mode!=='move'&&u?.team==='enemy'&&u.currentHp>0&&dist(selectedUnit,{x,y})<=selectedUnit.range;return <button key={i} className={`cell terrain-${t} ${u?.team||''} ${u?.id===selected?'selected':''} ${moveable?'moveable':''} ${targetable?'targetable':''} ${u?.id===target?'chosen-target':''}`} onClick={()=>{if(u?.team==='player'){setSelected(u.id);setTarget(null);setMode('move');return;}if(u?.team==='enemy'){setTarget(u.id);setMode('attack');return;}if(mode==='move')moveUnit(x,y);}}>{<span className="terrain-mark">{terrainName[t]}</span>}{u?<><b>{u.name}</b><small>HP {Math.max(0,u.currentHp)}/{u.hp} · 이동 {u.movePoints}</small></>:null}</button>})}</div><div className="controls"><b>{selectedUnit?.name || '장수 선택'} · 이동력 {selectedUnit?.movePoints ?? 0}/{selectedUnit?.move ?? 0}</b><button className={mode==='move'?'active-control':''} onClick={()=>setMode('move')}><Footprints/> 이동</button><button className={mode==='attack'?'active-control':''} onClick={()=>setMode('attack')}><Sword/> 공격</button><button className={mode==='skill'?'active-control':''} onClick={()=>setMode('skill')}><Sparkles/> 스킬</button><button onClick={endTurn}><RotateCcw/> 턴 종료</button></div><div className="unit-info"><strong>전투 규칙</strong><span>이동 후 같은 턴에 공격 가능 · 숲 이동 2 · 수로 이동 불가 · 턴 종료 시 이동력 회복</span></div></div><aside><h3>아군 장수</h3><div className="unit-list">{units.filter(u=>u.team==='player').map(u=><button className={u.id===selected?'selected':''} onClick={()=>{setSelected(u.id);setMode('move')}} key={u.id}>{u.name} <span>{Math.max(0,u.currentHp)} HP · {u.movePoints} MP</span></button>)}</div><div className="actions"><button onClick={attack}><Sword/> 공격</button><button onClick={skill}><Sparkles/> 스킬</button><button onClick={endTurn}><RotateCcw/> 턴 종료</button></div><div className="log">{log.map((x,i)=><p key={i}>{x}</p>)}</div>{victory&&<button className="primary" onClick={clearFloor}>승리 · 보상 받기</button>}{defeat&&<button className="primary" onClick={startBattle}>패배 · 재도전</button>}</aside></section></main>;
}
