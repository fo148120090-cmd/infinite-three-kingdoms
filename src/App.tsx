
import { useEffect, useMemo, useState } from "react";
import { Brain, ChevronRight, CirclePause, CirclePlay, Coins, Gem, Heart, Map, Package, RotateCcw, Shield, Sparkles, Swords, Trophy, UserRound, Zap } from "lucide-react";
import { cloneTendencies, createMonster, defaultTendencies, heroesSeed, randomGeneralItem, type BattleUnit, type Hero, type Item, type Job, type RoomKind, type Tendencies, uniqueItems } from "./dungeonData";

type Screen = "home" | "party" | "dungeon" | "battle" | "inventory";
type BattleMode = "dungeon" | "defense" | "raid";
type Save = { heroes: Hero[]; party: string[]; gold: number; materials: number; gems: number; floor: number; stage: number; items: Item[] };
type Decision = { action: string; target?: string; detail: string; score: number };

const KEY = "autonomous-dungeon-demo-v1";
const jobKo: Record<Job,string> = {Warrior:"전사",Guardian:"수호자",Archer:"궁수",Mage:"마법사",Cleric:"성직자"};
const jobIcon: Record<Job,string> = {Warrior:"⚔️",Guardian:"🛡️",Archer:"🏹",Mage:"🔮",Cleric:"✚"};
const roomIcon: Record<RoomKind,string> = {battle:"⚔",elite:"☠",treasure:"◆",rest:"🔥",boss:"👑"};
const roomKo: Record<RoomKind,string> = {battle:"일반 전투",elite:"정예 전투",treasure:"보물방",rest:"휴식처",boss:"심층 보스"};
const tendencyKo: Record<keyof Tendencies,string> = {aggression:"공격성",bravery:"용맹",caution:"신중함",survival:"생존본능",protect:"아군보호",pursuit:"추적성",focus:"집중력",greed:"탐욕",curiosity:"호기심",cooperation:"협동성"};

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      return {...s, heroes:s.heroes.map(h=>({...h,tendencies:{...defaultTendencies[h.job],...h.tendencies}})), items:s.items||[]};
    }
  } catch {}
  return {heroes:heroesSeed.map(h=>({...h,tendencies:cloneTendencies(h.tendencies)})),party:heroesSeed.slice(0,4).map(h=>h.id),gold:2500,materials:100,gems:100,floor:1,stage:0,items:[]};
}
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
const pct=(u:{hp:number;maxHp:number})=>u.maxHp?u.hp/u.maxHp:0;
const dist=(a:BattleUnit,b:BattleUnit)=>Math.abs(a.pos-b.pos);
const live=(u:BattleUnit[],team:"player"|"enemy")=>u.filter(x=>x.team===team&&x.alive);
const aiT=(t:Tendencies,item?:Item):Tendencies=>{
  const n={...t}; if(item) (Object.keys(item.aiMods) as (keyof Tendencies)[]).forEach(k=>n[k]=clamp(n[k]+(item.aiMods[k]||0))); return n;
};

function spawn(heroes:Hero[],party:string[],room:RoomKind,floor:number): BattleUnit[] {
  const ps: BattleUnit[] = heroes.filter(h=>party.includes(h.id)).map((h,i)=>({
    id:h.id,name:h.name,job:h.job,team:"player" as const,hp:h.hp,maxHp:h.hp,attack:h.attack,defense:h.defense,
    speed:h.speed,range:h.range,pos:1.1+i*.62,alive:true,tendencies:aiT(h.tendencies,h.item),item:h.item,
    actionText:"대기",cooldown:0,guard:0,xp:0
  }));
  const pool=floor<3?["Goblin","Kobold","Slime"]:floor<5?["Gnoll","Lizardman","Arachne"]:["Orc","Uruk","Ogre"];
  const count=room==="boss"?3:room==="elite"?4:3;
  const es=Array.from({length:count},(_,i)=>createMonster(pool[(i+floor)%pool.length],floor+2,room==="boss"?"Boss":room==="elite"?"Elite":"Normal",i));
  if(room==="boss") es[0]={...es[0],id:"uruk-boss",name:"우르크 전쟁대장",species:"Uruk",grade:"Boss",hp:420,maxHp:420,attack:53,defense:30,pos:8.8};
  return ps.concat(es.map(e=>({id:e.id,name:e.name,species:e.species,grade:e.grade,team:"enemy" as const,hp:e.hp,maxHp:e.maxHp,attack:e.attack,defense:e.defense,
    speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,actionText:"대기",cooldown:0,guard:0,xp:0})));
}

function asEnemy(e:ReturnType<typeof createMonster>,suffix=""):BattleUnit{
  return {id:e.id+suffix,name:e.name,species:e.species,grade:e.grade,team:"enemy" as const,hp:e.hp,maxHp:e.hp,attack:e.attack,defense:e.defense,speed:e.speed,range:e.range,pos:e.pos,alive:true,tendencies:e.tendencies,actionText:"대기",cooldown:0,guard:0,xp:0};
}

function decisions(a:BattleUnit,u:BattleUnit[]):Decision[] {
  const allies=live(u,a.team), enemies=live(u,a.team==="player"?"enemy":"player");
  const nearest=enemies.slice().sort((x,y)=>dist(a,x)-dist(a,y))[0];
  const weak=enemies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const ally=allies.slice().sort((x,y)=>pct(x)-pct(y))[0];
  const t=a.tendencies; const arr:Decision[]=[];
  const threat=nearest?Math.min(100,(1-pct(a))*100+60):0;
  const mod=a.item?.aiMods||{};
  if(nearest){
    let s=50+t.aggression*.35+t.bravery*.2+t.focus*.1+(1-pct(weak))*40;
    if(pct(weak)<.2)s+=25; if(dist(a,nearest)<=a.range)s+=30; s+=(mod.aggression||0)*.7;
    arr.push({action:"일반 공격",target:(a.job==="Archer"||a.job==="Mage"?weak.id:nearest.id),detail:"위협과 마무리 가능성을 계산",score:s});
  }
  if(a.job==="Warrior") arr.push({action:"추격",target:weak?.id,detail:"약해진 적을 끝까지 압박",score:25+t.pursuit*.5+t.aggression*.2+t.bravery*.15-threat*.2+(mod.pursuit||0)*.8});
  if(a.job==="Guardian"&&ally) arr.push({action:"아군 보호",target:ally.id,detail:"위험한 아군 쪽으로 접근해 피해를 줄임",score:20+t.protect*.5+t.cooperation*.25+(1-pct(ally))*55+(mod.protect||0)*.8});
  if(a.job==="Cleric"&&ally) arr.push({action:"회복",target:ally.id,detail:"가장 위험한 아군을 먼저 치료",score:30+t.protect*.35+t.cooperation*.25+(1-pct(ally))*75+(mod.protect||0)*.7-(pct(ally)>.78?35:0)});
  if(a.job==="Mage") arr.push({action:"광역 마법",detail:"사거리에 들어온 적 수를 계산",score:40+t.aggression*.2+t.focus*.2+enemies.filter(x=>dist(a,x)<=5).length*14+(mod.focus||0)*.8});
  if(a.team==="enemy"&&a.species==="Goblin") arr.push({action:"기습 후퇴",target:nearest?.id,detail:"위험해지면 생존을 위해 물러남",score:20+t.greed*.2+t.caution*.35+(1-pct(a))*60});
  if(a.team==="enemy"&&a.grade==="Boss"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    arr.push({action:"보스 패턴",detail:"페이즈 "+phase+" 패턴을 선택하고 전장을 압박",score:42+t.focus*.25+t.bravery*.25+(phase-1)*18});
  }
  arr.push({action:"후퇴",detail:"현재 HP와 적 위협을 기준으로 생존 판단",score:20+t.survival*.45+t.caution*.3+threat*.4-t.bravery*.25+(pct(a)<.12?20:0)-(a.item?.id==="berserker-heart"?35:0)});
  arr.push({action:"대기",detail:"즉시 행동의 가치가 낮다고 판단",score:16+t.caution*.05});
  return arr;
}

function weighted(ds:Decision[]):Decision {
  const list=ds.filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,4);
  const top=list.map((d,i)=>({...d,score:d.score*Math.pow(.82,i)}));
  const total=top.reduce((n,d)=>n+d.score,0); let r=Math.random()*total;
  for(const d of top){r-=d.score;if(r<=0)return d;} return top[0];
}

function hit(a:BattleUnit,b:BattleUnit,m=1){
  const crit=a.tendencies.focus>82&&Math.random()<.15?1.55:1;
  return Math.max(4,Math.round((a.attack*m-b.defense*.58)*crit*(.93+Math.random()*.14)));
}

function doAI(u:BattleUnit[],id:string):{units:BattleUnit[];decision:Decision;line:string}{
  const n=u.map(x=>({...x})); const a=n.find(x=>x.id===id)!; const d=weighted(decisions(a,n));
  const enemies=live(n,a.team==="player"?"enemy":"player"), allies=live(n,a.team);
  const by=(x?:string)=>n.find(q=>q.id===x&&q.alive);
  const move=(target:BattleUnit)=>{
    const step=(a.job==="Archer"||a.job==="Mage"||a.job==="Cleric") ? .65 : .9;
    a.pos+=(target.pos>a.pos?step:-step); a.pos=Math.max(.3,Math.min(9.7,a.pos));
  };
  let line="";
  if(d.action==="일반 공격"){
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range) move(t),a.actionText="접근 → "+t.name; else {const x=hit(a,t);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="일반 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="추격"){
    const t=by(d.target)||enemies[0]; if(t){if(dist(a,t)>a.range)move(t),a.actionText="추격 → "+t.name;else{const x=hit(a,t,1.18);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;a.actionText="추격 공격 → "+t.name+" (-"+x+")";line=a.actionText;}}
  } else if(d.action==="아군 보호"){
    const t=by(d.target)||allies[0]; if(t){a.pos += t.pos > a.pos ? .5 : -.5;a.guard=2;t.guard=Math.max(t.guard,1);a.actionText="아군 보호 → "+t.name;line=a.actionText;}
  } else if(d.action==="회복"){
    const t=by(d.target)||allies.slice().sort((x,y)=>pct(x)-pct(y))[0]; if(t){const x=Math.round(t.maxHp*(.18+a.tendencies.cooperation*.001));t.hp=Math.min(t.maxHp,t.hp+x);a.actionText="회복 → "+t.name+" (+"+x+")";line=a.actionText;}
  } else if(d.action==="광역 마법"){
    const ts=enemies.filter(x=>dist(a,x)<=5).slice(0,3); if(ts.length){const bits=ts.map(t=>{const x=hit(a,t,.72);t.hp=Math.max(0,t.hp-x);t.alive=t.hp>0;return t.name+" -"+x});a.actionText="광역 마법 → "+bits.join(", ");line=a.actionText;} else if(enemies[0])move(enemies[0]),a.actionText="광역 사거리 확보";
  } else if(d.action==="기습 후퇴"||d.action==="후퇴"){a.pos=Math.max(.3,a.pos-.95);a.actionText=d.action+" · 생존 우선";line=a.actionText;
  } else if(d.action==="보스 패턴"){
    const phase=pct(a)>0.65?1:pct(a)>0.35?2:3;
    const minions=live(n,"enemy").filter(x=>x.id!==a.id);
    const boost=phase===1?1.05:phase===2?1.16:1.3;
    minions.forEach(x=>{x.attack=Math.round(x.attack*boost);if(phase>=2)x.speed+=1;});
    a.guard=phase===3?1:0;
    a.actionText="보스 패턴 · PHASE "+phase;
    line=a.actionText+" · 부하 강화";
  } else {a.guard=1;a.actionText="대기 · 다음 판단 준비";line=a.actionText;}
  n.forEach(x=>{if(!x.alive)x.hp=0;if(x.guard>0&&x.id!==a.id)x.guard-=.2});
  return {units:n,decision:d,line:line||a.actionText};
}

function route(stage:number,floor:number){
  if(stage>=5)return [{kind:"boss" as RoomKind,title:"심층 관문",summary:"던전 최심부의 지휘관이 길을 막고 있다."}];
  const rows=[
    [{kind:"battle" as RoomKind,title:"정찰 통로",summary:"좁은 통로에서 정찰 무리가 다가온다."},{kind:"treasure" as RoomKind,title:"낡은 보급창",summary:"장비 상자와 자원이 남아 있다."},{kind:"rest" as RoomKind,title:"안전한 움푹한 곳",summary:"잠시 숨을 고를 수 있는 공간."}],
    [{kind:"battle" as RoomKind,title:"수정 동굴",summary:"슬라임과 코볼트가 길을 막는다."},{kind:"elite" as RoomKind,title:"거미 둥지",summary:"정예 아라크네가 통로를 봉쇄했다."},{kind:"treasure" as RoomKind,title:"봉인 상자",summary:"높은 등급 장비가 잠든 상자."}],
    [{kind:"rest" as RoomKind,title:"폐허 야영지",summary:"남은 모닥불로 상처를 추스를 수 있다."},{kind:"elite" as RoomKind,title:"전쟁 통로",summary:"규율 잡힌 우르크 부대가 기다린다."},{kind:"battle" as RoomKind,title:"검은 균열",summary:"오거의 발걸음이 벽을 흔든다."}]
  ];
  return rows[stage%3].map((x,i)=>({...x,title:x.title+" · "+floor+"F"}));
}

export default function App(){
  const [save,setSave]=useState<Save>(load);
  const [screen,setScreen]=useState<Screen>("home");
  const [mode,setMode]=useState<BattleMode>("dungeon");
  const [selectedHero,setSelectedHero]=useState(save.party[0]||save.heroes[0].id);
  const [battle,setBattle]=useState<{units:BattleUnit[];log:string[];room:RoomKind;round:number;tick:number;ended:boolean;result?:string;next?:string;mode:BattleMode;wave:number;deadline?:number;objectiveHp:number;phase:number}>({units:[],log:[],room:"battle",round:0,tick:0,ended:false,mode:"dungeon",wave:1,objectiveHp:100,phase:1});
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [decision,setDecision]=useState("상황 감지 → 행동 후보 생성 → 성향/장비 보정 → 확률 선택");
  const [toast,setToast]=useState("");
  const party=useMemo(()=>save.heroes.filter(h=>save.party.includes(h.id)),[save.heroes,save.party]);
  const hero=save.heroes.find(h=>h.id===selectedHero)||save.heroes[0];
  const active=battle.units.find(u=>u.id===battle.next&&u.alive);
  const notify=(s:string)=>{setToast(s);window.setTimeout(()=>setToast(""),1800);};

  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(save)),[save]);

  const start=(kind:RoomKind)=>{
    if(kind==="treasure"){const item=randomGeneralItem(save.floor+2);setSave(s=>({...s,items:[...s.items,item],gold:s.gold+180,stage:s.stage+1}));notify("보물: "+item.name+" 획득");return;}
    if(kind==="rest"){setSave(s=>({...s,heroes:s.heroes.map(h=>save.party.includes(h.id)?{...h,experience:h.experience+4}:h),stage:s.stage+1}));notify("휴식: 경험 기록 +4");return;}
    const units=spawn(save.heroes,save.party,kind,save.floor);
    setMode("dungeon");
    setBattle({units,log:[roomKo[kind]+" 시작 · 전투 명령은 AI가 전부 결정합니다."],room:kind,round:1,tick:0,ended:false,next:units[0].id,mode:"dungeon",wave:1,objectiveHp:100,phase:1});
    setPaused(false);setScreen("battle");setDecision("AI가 첫 행동을 분석 중...");
  };

  const startMode=(nextMode:BattleMode)=>{
    setMode(nextMode);
    const room:RoomKind=nextMode==="raid"?"boss":"battle";
    const units=spawn(save.heroes,save.party,room,save.floor);
    const label=nextMode==="defense"?"방어전 시작 · 30초 동안 웨이브가 계속됩니다.":"보스 레이드 시작 · 보스 페이즈는 AI가 자동 전환됩니다.";
    setBattle({units,log:[label],room,round:1,tick:0,ended:false,next:units[0].id,mode:nextMode,wave:1,deadline:nextMode==="defense"?Date.now()+30000:undefined,objectiveHp:100,phase:1});
    setPaused(false);setScreen("battle");
    setDecision(nextMode==="defense"?"방어 목표와 생존 경로를 계산 중...":"보스 패턴과 페이즈 전환을 분석 중...");
  };

  useEffect(()=>{
    if(screen!=="battle"||paused||battle.ended)return;
    const timer=window.setTimeout(()=>{
      setBattle(prev=>{
        if(prev.ended||!prev.units.length)return prev;
        const alive=prev.units.filter(x=>x.alive);
        if(!alive.length)return {...prev,ended:true,result:"defeat"};
        const actor=alive.sort((a,b)=>a.pos-b.pos||b.speed-a.speed)[Math.floor(Math.random()*Math.min(2,alive.length))];
        const out=doAI(prev.units,actor.id);
        let p=live(out.units,"player"),e=live(out.units,"enemy");
        let wave=prev.wave,objectiveHp=prev.objectiveHp,phase=prev.phase,ended=false,result:string|undefined;
        const now=Date.now();

        if(prev.mode==="defense"){
          const nearGoal=e.filter(x=>x.pos>8.7).length;
          if(prev.tick%4===0 && nearGoal>0) objectiveHp=Math.max(0,objectiveHp-nearGoal*3);
          if(p.length===0||objectiveHp<=0){ended=true;result="defeat";}
          else if(now>=((prev.deadline||now)+1)){ended=true;result="victory";}
          else if(e.length===0){
            wave+=1;
            const pool=["Goblin","Kobold","Gnoll","Orc","Uruk","Arachne","Ogre"];
            const count=Math.min(7,2+wave);
            const nextEnemies=Array.from({length:count},(_,i)=>{
              const m=createMonster(pool[(i+wave+save.floor)%pool.length],Math.max(1,save.floor+wave-1),wave>=4?"Elite":"Normal",i);
              return asEnemy({...m,pos:8.2+i*.55},"-w"+wave);
            });
            out.units=out.units.concat(nextEnemies);
            e=live(out.units,"enemy");
          }
        }else if(prev.mode==="raid"){
          const boss=out.units.find(x=>x.grade==="Boss"&&x.alive);
          if(boss) phase=pct(boss)>0.65?1:pct(boss)>0.35?2:3;
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }else{
          ended=p.length===0||e.length===0;
          result=e.length===0?"victory":p.length===0?"defeat":undefined;
        }

        if(out.decision) setDecision(out.decision.detail+" · 후보점수 "+Math.round(out.decision.score));
        const logLine=out.line+(out.decision.detail?" / "+out.decision.detail:"");
        const waveLine=prev.mode==="defense"&&wave>prev.wave?" / WAVE "+wave+" 증원":"";
        return {...prev,units:out.units,log:[(logLine+waveLine)].concat(prev.log).slice(0,12),round:prev.round+(actor.team==="enemy"?1:0),tick:prev.tick+1,ended,result,next:out.units.find(x=>x.id===actor.id&&x.alive)?.id,wave,objectiveHp,phase};
      });
    },Math.max(150,850/speed));
    return ()=>window.clearTimeout(timer);
  },[screen,paused,battle.ended,speed,battle.tick,battle.mode,save.floor]);