import { useMemo, useState } from 'react';
import { ChevronRight, Save, Sparkles, Sword, Shield, Footprints } from 'lucide-react';

type Faction = 'Wei'|'Shu'|'Wu'|'Warlords'|'Yellow Turbans'|'Heavenly Mandate';
type General = { id:string; name:string; title:string; faction:Faction; role:string; hp:number; atk:number; range:number; move:number; skill:string; skillPower:number };
type Unit = General & { team:'player'|'enemy'; x:number; y:number; currentHp:number; acted:boolean; buff:number; debuff:number };
type Pos = {x:number;y:number};

const generals:General[] = [
 ['liu-bei','유비','인덕의 군주','Shu','지원',120,22,2,3,'인덕의 격려',0],
 ['guan-yu','관우','미염공','Shu','전사',150,38,1,3,'청룡참',28],
 ['zhang-fei','장비','만인지적','Shu','수호',190,28,1,2,'호통',0],
 ['zhao-yun','조운','상산의 용','Shu','기병',135,34,1,4,'용진',18],
 ['zhuge-liang','제갈량','와룡','Shu','책사',95,30,3,2,'천뢰',24],
 ['cao-cao','조조','위무제','Wei','책사',125,29,2,3,'간웅의 명령',0],
 ['xiahou-dun','하후돈','독안의 맹장','Wei','전사',160,35,1,3,'맹격',20],
 ['sun-quan','손권','강동의 호랑이','Wu','지원',130,27,2,3,'강동의 결의',0],
 ['lu-bu','여포','천하무쌍','Warlords','기병',180,48,1,4,'천하무쌍',42],
 ['diao-chan','초선','경국지색','Warlords','지원',90,24,2,3,'매혹',0],
].map(([id,name,title,faction,role,hp,atk,range,move,skill,skillPower])=>({id,name,title,faction:faction as Faction,role,hp:Number(hp),atk:Number(atk),range:Number(range),move:Number(move),skill,skillPower:Number(skillPower)}));

const key='infinite-three-kingdoms-save';
const W=7,H=6;
const dist=(a:Pos,b:Pos)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

function App(){
 const [screen,setScreen]=useState<'home'|'tower'|'battle'|'generals'>('home');
 const [floor,setFloor]=useState(()=>Number(localStorage.getItem(key)||'1'));
 const [selected,setSelected]=useState('guan-yu');
 const [units,setUnits]=useState<Unit[]>([]);
 const [turn,setTurn]=useState<'player'|'enemy'>('player');
 const [mode,setMode]=useState<'move'|'attack'|'skill'>('move');
 const [log,setLog]=useState<string[]>(['천탑 제1층 전투 준비 완료.']);
 const [round,setRound]=useState(1);
 const team=useMemo(()=>generals.slice(0,5),[]);
 const addLog=(text:string)=>setLog(l=>[text,...l].slice(0,7));
 const startBattle=()=>{const ps=team.map((g,i)=>({...g,team:'player' as const,x:i%3,y:5-Math.floor(i/3),currentHp:g.hp,acted:false,buff:0,debuff:0}));const es=[generals[6],generals[2],generals[7]].map((g,i)=>({...g,team:'enemy' as const,x:4+(i%2),y:i+1,currentHp:g.hp+floor*4,acted:false,buff:0,debuff:0}));setUnits([...ps,...es]);setSelected('guan-yu');setTurn('player');setMode('move');setRound(1);setLog([`천탑 ${floor}층: 적 장수 ${es.length}명이 등장했다.`]);setScreen('battle');};
 const save=()=>{localStorage.setItem(key,String(floor));addLog('진행 상황을 저장했습니다.');};
 const alive=(u:Unit)=>u.currentHp>0;
 const selectedUnit=units.find(u=>u.id===selected);
 const reachable=selectedUnit&&selectedUnit.team==='player'&&turn==='player'&&!selectedUnit.acted?Array.from({length:W*H},(_,i)=>({x:i%W,y:Math.floor(i/W)})).filter(p=>dist(selectedUnit,p)<=selectedUnit.move&&(!units.some(u=>alive(u)&&u.x===p.x&&u.y===p.y))):[];
 const moveTo=(p:Pos)=>{if(!selectedUnit||mode!=='move'||!reachable.some(r=>r.x===p.x&&r.y===p.y))return;setUnits(us=>us.map(u=>u.id===selected?{...u,x:p.x,y:p.y}:u));setMode('attack');addLog(`${selectedUnit.name}이(가) 이동했다.`);};
 const damage=(attacker:Unit,target:Unit,bonus=0)=>Math.max(1,attacker.atk+attacker.buff-attacker.debuff+bonus-Math.floor(target.hp*.08));
 const attack=()=>{if(!selectedUnit||selectedUnit.team!=='player'||selectedUnit.acted||turn!=='player')return;const targets=units.filter(u=>u.team==='enemy'&&alive(u)&&dist(selectedUnit,u)<=selectedUnit.range);const target=targets[0];if(!target){addLog('공격 범위 안에 적이 없습니다.');return;}const d=damage(selectedUnit,target);setUnits(us=>us.map(u=>u.id===selected?{...u,acted:true}:u.id===target.id?{...u,currentHp:Math.max(0,u.currentHp-d)}:u));addLog(`${selectedUnit.name}의 공격 → ${target.name} ${d} 피해`);setMode('move');};
 const useSkill=()=>{if(!selectedUnit||selectedUnit.team!=='player'||selectedUnit.acted||turn!=='player')return;const targets=units.filter(u=>u.team==='enemy'&&alive(u)&&dist(selectedUnit,u)<=selectedUnit.range+(selectedUnit.skill==='천뢰'?1:0));if(selectedUnit.skill==='인덕의 격려'){const ally=units.find(u=>u.team==='player'&&u.id!==selectedUnit.id&&alive(u));if(!ally)return;setUnits(us=>us.map(u=>u.id===ally.id?{...u,buff:u.buff+8}:u.id===selected?{...u,acted:true}:u));addLog(`${selectedUnit.name}이(가) ${ally.name}에게 공격력 +8`);return;}if(selectedUnit.skill==='강동의 결의'){setUnits(us=>us.map(u=>u.team==='player'&&alive(u)?{...u,buff:u.buff+3}:u.id===selected?{...u,acted:true}:u));addLog('아군 전체 공격 준비가 강화되었다.');return;}if(selectedUnit.skill==='호통'){setUnits(us=>us.map(u=>u.id===selected?{...u,acted:true}:u));addLog(`${selectedUnit.name}의 호통! 적의 주의를 끌었다.`);return;}if(selectedUnit.skill==='간웅의 명령'){setUnits(us=>us.map(u=>u.id===selected?{...u,acted:true}:u.team==='enemy'&&alive(u)?{...u,debuff:u.debuff+6}:u));addLog('적 전체 공격력이 감소했다.');return;}if(selectedUnit.skill==='매혹'){const target=targets[0];if(!target)return;setUnits(us=>us.map(u=>u.id===selected?{...u,acted:true}:u.id===target.id?{...u,acted:true}:u));addLog(`${target.name}이(가) 매혹되어 다음 행동을 잃었다.`);return;}if(!targets.length){addLog('스킬 범위 안에 적이 없습니다.');return;}const hit=selectedUnit.skill==='천뢰'?targets:targets.slice(0,1);setUnits(us=>us.map(u=>u.id===selected?{...u,acted:true}:hit.some(t=>t.id===u.id)?{...u,currentHp:Math.max(0,u.currentHp-damage(selectedUnit,u,selectedUnit.skillPower))}:u));addLog(`${selectedUnit.name}의 ${selectedUnit.skill}! ${hit.length}명에게 피해`);setMode('move');};
 const endTurn=()=>{if(turn!=='player')return;setTurn('enemy');setMode('move');setTimeout(()=>{setUnits(prev=>{let next=prev.map(u=>u.team==='player'?{...u,acted:false}:u);const targets=next.filter(u=>u.team==='player'&&alive(u));next=next.map(e=>{if(e.team!=='enemy'||!alive(e)||e.acted)return e;const t=targets.slice().sort((a,b)=>dist(a,e)-dist(b,e))[0];if(!t)return e;if(dist(e,t)<=e.range){const d=damage(e,t);const idx=next.findIndex(u=>u.id===t.id);if(idx>=0)next[idx]={...next[idx],currentHp:Math.max(0,next[idx].currentHp-d)};addLog(`${e.name}의 공격 → ${t.name} ${d} 피해`);}return {...e,acted:true};});return next});setTurn('player');setRound(r=>r+1);},450);};
 const victory=units.length>0&&units.filter(u=>u.team==='enemy'&&alive(u)).length===0;
 const defeat=units.length>0&&units.filter(u=>u.team==='player'&&alive(u)).length===0;
 const nextFloor=()=>{const n=floor+1;setFloor(n);localStorage.setItem(key,String(n));setScreen('tower');};
 if(screen==='home')return <main className="app"><header><div><small>INFINITE THREE KINGDOMS</small><h1>무한삼국지: 천탑전기</h1><p>삼국지 SRPG · 무한 천탑 · 장수 수집</p></div><button onClick={save}><Save size={16}/> 저장</button></header><section className="hero"><div><span className="badge">MVP BUILD 0.2</span><h2>천탑에 도전하라.</h2><p>이제 직접 이동하고, 공격하고, 장수의 고유 스킬을 사용할 수 있습니다.</p><button className="primary" onClick={()=>setScreen('tower')}>천탑 입장 <ChevronRight/></button></div><div className="orb">∞</div></section><nav className="cards"><button onClick={()=>setScreen('tower')}><Sword/><b>천탑</b><span>{floor}층 진행 중</span></button><button onClick={()=>setScreen('generals')}><Shield/><b>장수</b><span>{generals.length}명 보유</span></button><button><Sparkles/><b>소환</b><span>다음 업데이트</span></button></nav></main>;
 if(screen==='tower')return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>천탑</h1><button onClick={save}><Save size={16}/></button></header><section className="tower"><div className="tower-info"><span>현재 진행</span><strong>{floor}층</strong><p>10층마다 보스 · 100층마다 대사건</p><button className="primary" onClick={startBattle}>전투 시작</button></div><div className="floors">{Array.from({length:20},(_,i)=>{const n=floor+i;return <div className={n===floor?'floor active':'floor'} key={n}><small>{n%10===0?'BOSS':''}</small>{n}</div>})}</div></section></main>;
 if(screen==='generals')return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>장수</h1><span/></header><div className="roster">{generals.map(g=><article className="general" key={g.id}><div className="portrait">{g.name[0]}</div><div><h3>{g.name} <em>★5</em></h3><p>{g.title} · {g.faction}</p><span>{g.role} · HP {g.hp} · ATK {g.atk} · 이동 {g.move}</span><small>{g.skill} · 전용 장비 슬롯 준비</small></div></article>)}</div></main>;
 return <main className="app battle"><header><button className="back" onClick={()=>setScreen('tower')}>← 천탑</button><div><small>천탑 {floor}층 · ROUND {round}</small><h1>전투</h1></div><span className={turn==='player'?'turn':'turn enemy'}>{turn==='player'?'아군 턴':'적 턴'}</span></header><div className="battle-layout"><section><div className="grid">{Array.from({length:W*H},(_,i)=>{const x=i%W,y=Math.floor(i/W),u=units.find(a=>a.x===x&&a.y===y&&alive(a));const canMove=reachable.some(p=>p.x===x&&p.y===y);const enemy=units.find(a=>a.team==='enemy'&&alive(a)&&a.x===x&&a.y===y);const inRange=selectedUnit&&enemy?dist(selectedUnit,enemy)<=selectedUnit.range:false;return <button className={`cell ${u?.team||''} ${u?.id===selected?'selected':''} ${canMove?'moveable':''} ${inRange?'targetable':''}`} key={i} onClick={()=>u?.team==='player'?setSelected(u.id):canMove&&moveTo({x,y})}>{u&&<><b>{u.name[0]}</b><small>{Math.max(0,u.currentHp)}</small></>}</button>})}</div><div className="controls"><b>{selectedUnit?.name||'장수 선택'}</b><button className={mode==='move'?'active-control':''} onClick={()=>setMode('move')}><Footprints/> 이동</button><button onClick={attack}><Sword/> 공격</button><button onClick={useSkill}><Sparkles/> {selectedUnit?.skill||'스킬'}</button><button onClick={endTurn}>턴 종료</button></div><div className="unit-info">{selectedUnit&&<><strong>{selectedUnit.name}</strong><span>HP {Math.max(0,selectedUnit.currentHp)}/{selectedUnit.hp}</span><span>ATK {selectedUnit.atk+selectedUnit.buff-selectedUnit.debuff}</span><span>사거리 {selectedUnit.range}</span><span>이동 {selectedUnit.move}</span></>}</div></section><aside><h3>전투 기록</h3>{log.map((x,i)=><p key={i}>{x}</p>)}<hr/><p>적 HP: {units.filter(u=>u.team==='enemy').reduce((s,u)=>s+Math.max(0,u.currentHp),0)}</p>{victory&&<div className="victory"><h2>승리!</h2><p>천탑 {floor}층 돌파</p><button className="primary" onClick={nextFloor}>다음 층</button></div>}{defeat&&<div className="victory"><h2>패배</h2><p>다시 도전할 수 있습니다.</p><button className="primary" onClick={startBattle}>재도전</button></div>}</aside></div></main>;
}
export default App;
