import { useMemo, useState } from 'react';
import { Sword, Shield, Sparkles, ChevronRight, RotateCcw, Save } from 'lucide-react';

type Faction='Wei'|'Shu'|'Wu'|'Warlords'|'Yellow Turbans'|'Heavenly Mandate';
type General={id:string;name:string;title:string;faction:Faction;role:string;hp:number;atk:number;range:number;move:number;skill:string};
type Unit=General & {team:'player'|'enemy';x:number;y:number;currentHp:number;acted:boolean};

const generals:General[]=[
{id:'liu-bei',name:'유비',title:'인덕의 군주',faction:'Shu',role:'지원',hp:120,atk:22,range:1,move:3,skill:'인덕의 격려: 아군 1명의 공격력 +8'},
{id:'guan-yu',name:'관우',title:'미염공',faction:'Shu',role:'전사',hp:150,atk:38,range:1,move:3,skill:'청룡참: 강력한 단일 공격'},
{id:'zhang-fei',name:'장비',title:'만인지적',faction:'Shu',role:'수호',hp:190,atk:28,range:1,move:2,skill:'호통: 인접 적을 도발'},
{id:'zhao-yun',name:'조운',title:'상산의 용',faction:'Shu',role:'기병',hp:135,atk:34,range:1,move:4,skill:'용진: 이동 후 추가 피해'},
{id:'zhuge-liang',name:'제갈량',title:'와룡',faction:'Shu',role:'책사',hp:95,atk:30,range:3,move:2,skill:'천뢰: 범위 마법 공격'},
{id:'cao-cao',name:'조조',title:'위무제',faction:'Wei',role:'책사',hp:125,atk:29,range:2,move:3,skill:'간웅의 명령: 적 공격력 감소'},
{id:'xiahou-dun',name:'하후돈',title:'독안의 맹장',faction:'Wei',role:'전사',hp:160,atk:35,range:1,move:3,skill:'맹격: 공격력 비례 피해'},
{id:'sun-quan',name:'손권',title:'강동의 호랑이',faction:'Wu',role:'지원',hp:130,atk:27,range:2,move:3,skill:'강동의 결의: 아군 방어력 증가'},
{id:'lu-bu',name:'여포',title:'천하무쌍',faction:'Warlords',role:'기병',hp:180,atk:48,range:1,move:4,skill:'천하무쌍: 큰 단일 피해'},
{id:'diao-chan',name:'초선',title:'경국지색',faction:'Warlords',role:'지원',hp:90,atk:24,range:2,move:3,skill:'매혹: 적 행동 게이지 감소'},
];

const enemies=[generals[6],generals[2],generals[7]];
const key='infinite-three-kingdoms-save';

function App(){
 const [screen,setScreen]=useState<'home'|'tower'|'battle'|'generals'>('home');
 const [floor,setFloor]=useState(()=>Number(localStorage.getItem(key)||'1'));
 const [selected,setSelected]=useState<string>('guan-yu');
 const [units,setUnits]=useState<Unit[]>([]);
 const [turn,setTurn]=useState<'player'|'enemy'>('player');
 const [log,setLog]=useState<string[]>(['천탑 제1층 전투 준비 완료.']);
 const [reward,setReward]=useState(0);
 const team=useMemo(()=>generals.slice(0,5),[]);
 const startBattle=()=>{
   const ps=team.map((g,i)=>({...g,team:'player' as const,x:i%3,y:5-Math.floor(i/3),currentHp:g.hp,acted:false}));
   const es=enemies.map((g,i)=>({...g,team:'enemy' as const,x:4-(i%2),y:i+1,currentHp:g.hp+floor*4,acted:false}));
   setUnits([...ps,...es]);setTurn('player');setLog([`천탑 ${floor}층: 적 장수 ${es.length}명이 등장했다.`]);setReward(0);setScreen('battle');
 };
 const save=()=>{localStorage.setItem(key,String(floor));setLog(l=>['진행 상황을 저장했습니다.',...l].slice(0,5));};
 const attack=(id:string)=>setUnits(prev=>{
   const actor=prev.find(u=>u.id===id); if(!actor||actor.team!=='player'||actor.acted||turn!=='player') return prev;
   const target=prev.filter(u=>u.team==='enemy'&&u.currentHp>0).sort((a,b)=>Math.abs(a.x-actor.x)+Math.abs(a.y-actor.y)-(Math.abs(b.x-actor.x)+Math.abs(b.y-actor.y)))[0];
   if(!target)return prev;
   const dist=Math.abs(actor.x-target.x)+Math.abs(actor.y-target.y); if(dist>actor.range)return prev;
   const dmg=actor.atk+Math.floor(Math.random()*8); const next=prev.map(u=>u.id===id?{...u,acted:true}:u.id===target.id?{...u,currentHp:Math.max(0,u.currentHp-dmg)}:u);
   setLog(l=>[`${actor.name} → ${target.name} ${dmg} 피해`,...l].slice(0,5));
   return next;
 });
 const endTurn=()=>{
   if(turn!=='player')return;
   setTurn('enemy');
   setTimeout(()=>setUnits(prev=>{let next=prev.map(u=>u.team==='player'?{...u,acted:false}:u); const alive=next.filter(u=>u.team==='player'&&u.currentHp>0); const targets=alive.length?alive:[]; next=next.map(e=>{if(e.team!=='enemy'||e.currentHp<=0)return e;const t=targets.slice().sort((a,b)=>Math.abs(a.x-e.x)+Math.abs(a.y-e.y)-(Math.abs(b.x-e.x)+Math.abs(b.y-e.y)))[0]; if(!t)return e;const d=Math.abs(t.x-e.x)+Math.abs(t.y-e.y);if(d<=e.range){const dmg=e.atk; const idx=next.findIndex(u=>u.id===t.id);if(idx>=0)next[idx]={...next[idx],currentHp:Math.max(0,next[idx].currentHp-dmg)};setLog(l=>[`${e.name}의 반격: ${t.name} ${dmg} 피해`,...l].slice(0,5));}return e}); setTurn('player');return next}),500);
 };
 const victory=units.length>0&&units.filter(u=>u.team==='enemy'&&u.currentHp>0).length===0;
 if(screen==='home')return <main className="app"><header><div><small>INFINITE THREE KINGDOMS</small><h1>무한삼국지: 천탑전기</h1><p>삼국지 SRPG · 무한 천탑 · 장수 수집</p></div><button onClick={save}><Save size={16}/> 저장</button></header><section className="hero"><div><span className="badge">MVP BUILD 0.1</span><h2>천탑에 도전하라.</h2><p>장수를 모으고, 전술을 지휘하며 끝없는 층을 돌파하세요.</p><button className="primary" onClick={()=>setScreen('tower')}>천탑 입장 <ChevronRight/></button></div><div className="orb">∞</div></section><nav className="cards"><button onClick={()=>setScreen('tower')}><Sword/><b>천탑</b><span>{floor}층 진행 중</span></button><button onClick={()=>setScreen('generals')}><Shield/><b>장수</b><span>{generals.length}명 보유</span></button><button><Sparkles/><b>소환</b><span>다음 업데이트</span></button></nav></main>;
 if(screen==='tower')return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>천탑</h1><button onClick={save}><Save size={16}/></button></header><section className="tower"><div className="tower-info"><span>현재 진행</span><strong>{floor}층</strong><p>10층마다 보스 · 100층마다 대사건</p><button className="primary" onClick={startBattle}>전투 시작</button></div><div className="floors">{Array.from({length:20},(_,i)=>{const n=floor+i;return <div className={n===floor?'floor active':'floor'} key={n}><small>{n%10===0?'BOSS':''}</small>{n}</div>})}</div></section></main>;
 if(screen==='generals')return <main className="app"><header><button className="back" onClick={()=>setScreen('home')}>← 메인</button><h1>장수</h1><span/></header><div className="roster">{generals.map(g=><article className="general" key={g.id}><div className="portrait">{g.name[0]}</div><div><h3>{g.name} <em>★5</em></h3><p>{g.title} · {g.faction}</p><span>{g.role} · HP {g.hp} · ATK {g.atk}</span><small>전용 장비 슬롯 준비</small></div></article>)}</div></main>;
 return <main className="app battle"><header><button className="back" onClick={()=>setScreen('tower')}>← 천탑</button><div><small>천탑 {floor}층</small><h1>전투</h1></div><span className={turn==='player'?'turn':'turn enemy'}>{turn==='player'?'아군 턴':'적 턴'}</span></header><div className="battle-layout"><section><div className="grid">{Array.from({length:42},(_,i)=>{const x=i%7,y=Math.floor(i/7),u=units.find(a=>a.x===x&&a.y===y&&a.currentHp>0);return <button className={`cell ${u?.team||''} ${u?.id===selected?'selected':''}`} key={i} onClick={()=>u?.team==='player'&&setSelected(u.id)}>{u&&<><b>{u.name[0]}</b><small>{Math.max(0,u.currentHp)}</small></>}</button>})}</div><div className="controls"><b>{units.find(u=>u.id===selected)?.name||'장수 선택'}</b><button onClick={()=>attack(selected)}>공격</button><button onClick={endTurn}>턴 종료</button></div></section><aside><h3>전투 기록</h3>{log.map((x,i)=><p key={i}>{x}</p>)}<hr/><p>적 HP: {units.filter(u=>u.team==='enemy').reduce((s,u)=>s+Math.max(0,u.currentHp),0)}</p>{victory&&<div className="victory"><h2>승리!</h2><p>천탑 {floor}층 돌파</p><button className="primary" onClick={()=>{setFloor(floor+1);localStorage.setItem(key,String(floor+1));setScreen('tower')}}>다음 층</button></div>}</aside></div></main>
}
export default App;
