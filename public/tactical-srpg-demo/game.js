(() => {
const W=10,H=8;
const terrain=[
"RRRFFWWWWW","RRRFFWWWWW","RFFFW...WW","R...W...WW","R...W...WW","R...W.....","RRRRR.....","RRRRR....."
];
const typeMap={R:"road",F:"forest",W:"water",".":"plain"};
const units=[
{id:"h1",team:"hero",name:"진호",job:"검기병",icon:"⚔",x:1,y:6,hp:120,maxHp:120,atk:31,def:18,move:5,range:1,skills:["돌진","강습"]},
{id:"h2",team:"hero",name:"서린",job:"창보병",icon:"🛡",x:2,y:6,hp:145,maxHp:145,atk:25,def:27,move:3,range:1,skills:["찌르기","견제"]},
{id:"h3",team:"hero",name:"유안",job:"궁기병",icon:"🏹",x:1,y:7,hp:100,maxHp:100,atk:29,def:13,move:5,range:3,skills:["연사","후퇴사격"]},
{id:"h4",team:"hero",name:"하령",job:"책사",icon:"📜",x:2,y:7,hp:85,maxHp:85,atk:33,def:9,move:3,range:4,skills:["빙결술","약화"]},
{id:"h5",team:"hero",name:"문지",job:"의무병",icon:"✚",x:3,y:7,hp:90,maxHp:90,atk:18,def:12,move:3,range:3,skills:["치유","정화"]},
{id:"e1",team:"enemy",name:"적병",job:"도보병",icon:"⚔",x:7,y:1,hp:95,maxHp:95,atk:22,def:15,move:3,range:1,skills:["베기"]},
{id:"e2",team:"enemy",name:"적병",job:"도보병",icon:"⚔",x:8,y:2,hp:95,maxHp:95,atk:22,def:15,move:3,range:1,skills:["베기"]},
{id:"e3",team:"enemy",name:"기병장",job:"중기병",icon:"♞",x:8,y:3,hp:135,maxHp:135,atk:30,def:20,move:5,range:1,skills:["돌파"]},
{id:"e4",team:"enemy",name:"노병",job:"궁병",icon:"🏹",x:9,y:1,hp:80,maxHp:80,atk:27,def:9,move:3,range:4,skills:["정밀사격"]},
{id:"e5",team:"enemy",name:"노병",job:"궁병",icon:"🏹",x:9,y:2,hp:80,maxHp:80,atk:27,def:9,move:3,range:4,skills:["정밀사격"]},
{id:"e6",team:"enemy",name:"도사",job:"도술사",icon:"☯",x:7,y:3,hp:78,maxHp:78,atk:31,def:8,move:3,range:4,skills:["빙결"]},
{id:"e7",team:"enemy",name:"방패병",job:"중보병",icon:"🛡",x:8,y:5,hp:155,maxHp:155,atk:20,def:30,move:2,range:1,skills:["방진"]},
{id:"e8",team:"enemy",name:"자객",job:"암살자",icon:"🗡",x:9,y:6,hp:75,maxHp:75,atk:35,def:8,move:5,range:1,skills:["급습"]},
{id:"e9",team:"enemy",name:"군사",job:"군사",icon:"📜",x:7,y:6,hp:90,maxHp:90,atk:25,def:12,move:3,range:3,skills:["약화","회복"]},
];
const art={h1:"./assets/units/sword-cavalry.svg",h2:"./assets/units/spear-infantry.svg",h3:"./assets/units/archer-rider.svg",h4:"./assets/units/tactician.svg",h5:"./assets/units/medic.svg",e1:"./assets/units/foot-soldier.svg",e2:"./assets/units/foot-soldier.svg",e3:"./assets/units/heavy-cavalry.svg",e4:"./assets/units/enemy-archer.svg",e5:"./assets/units/enemy-archer.svg",e6:"./assets/units/mage.svg",e7:"./assets/units/heavy-infantry.svg",e8:"./assets/units/assassin.svg",e9:"./assets/units/war-counselor.svg"};

const classData={
  cavalry:{label:"기병",strong:["archer","mage"],weak:["spear","heavy"],coop:true},
  spear:{label:"창보병",strong:["cavalry","assassin"],weak:["archer","mage"],coop:true},
  archer:{label:"궁병",strong:["cavalry"],weak:["assassin","heavy"],supportRange:4},
  mage:{label:"술사",strong:["heavy","tactician"],weak:["assassin","cavalry"],supportRange:3},
  heavy:{label:"중보병",strong:["cavalry","assassin"],weak:["mage","archer"],coop:true},
  assassin:{label:"암살자",strong:["mage","tactician","archer"],weak:["spear","heavy"],coop:true},
  tactician:{label:"책략가",strong:["assassin"],weak:["cavalry"],supportRange:3},
  medic:{label:"의무병",strong:[],weak:["assassin"],supportRange:2},
  foot:{label:"도보병",strong:["assassin"],weak:["cavalry"],coop:true}
};
const unitClass={h1:"cavalry",h2:"spear",h3:"archer",h4:"tactician",h5:"medic",e1:"foot",e2:"foot",e3:"cavalry",e4:"archer",e5:"archer",e6:"mage",e7:"heavy",e8:"assassin",e9:"tactician"};
const skillData={
  "돌진":{kind:"attack",range:2,damage:18},
  "강습":{kind:"attack",range:1,damage:32,noCounter:true},
  "찌르기":{kind:"attack",range:2,damage:20},
  "견제":{kind:"attack",range:3,damage:12,atkDown:3},
  "연사":{kind:"attack",range:3,damage:14,aoe:1,noCounter:true},
  "후퇴사격":{kind:"attack",range:3,damage:19,noCounter:true,retreat:true},
  "빙결술":{kind:"attack",range:4,damage:22,aoe:1,noCounter:true,atkDown:4},
  "약화":{kind:"attack",range:4,damage:10,atkDown:7},
  "치유":{kind:"heal",range:3,heal:35},
  "정화":{kind:"heal",range:3,heal:22,cleanse:true},
  "베기":{kind:"attack",range:1,damage:14},
  "돌파":{kind:"attack",range:2,damage:24,noCounter:true},
  "정밀사격":{kind:"attack",range:4,damage:18,noCounter:true},
  "빙결":{kind:"attack",range:4,damage:20,aoe:1,noCounter:true,atkDown:5},
  "방진":{kind:"attack",range:1,damage:12,atkDown:4},
  "급습":{kind:"attack",range:1,damage:28,noCounter:true},
  "회복":{kind:"heal",range:3,heal:28}
};
const scenarios={
  annihilate:{label:"전멸전",desc:"적군을 모두 격파하면 승리합니다.",goal:null},
  commander:{label:"지휘관 격파",desc:"적 지휘관 '군사'를 격파하면 승리합니다.",goal:null},
  capture:{label:"거점 점령",desc:"아군이 표시된 거점에 들어가고 턴을 종료하면 승리합니다.",goal:{x:5,y:6}},
  survive:{label:"5라운드 생존",desc:"5번의 적군 행동을 버티면 승리합니다.",goal:null,survive:5}
};
let state={turn:"hero",round:1,selected:null,acted:new Set(),moved:new Set(),skillMode:null,enemyTurns:0,scenarioId:"annihilate",log:[],gameOver:false};
const app=document.querySelector("#app");
const alive=t=>units.filter(u=>u.team===t&&u.hp>0);
const unitAt=(x,y)=>units.find(u=>u.x===x&&u.y===y&&u.hp>0);
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function terrainAt(x,y){return typeMap[terrain[y]?.[x]||"."]||"plain"}
function log(s){state.log.unshift(s);state.log=state.log.slice(0,40);render()}
function canWalk(u,x,y){if(x<0||y<0||x>=W||y>=H)return false; if(terrain[y][x]==="W")return false; const v=unitAt(x,y); return !v || v.id===u.id}
function moveCost(x,y){const t=terrainAt(x,y);return t==="forest"?2:1}
function reachable(u){
  if(state.moved.has(u.id))return new Set();
  const q=[[u.x,u.y,0]],seen=new Set([u.x+","+u.y]),out=new Set();
  while(q.length){
    const [x,y,d]=q.shift();
    if(d>0)out.add(x+","+y);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=nx+","+ny;
      if(seen.has(k)||nx<0||ny<0||nx>=W||ny>=H)continue;
      if(terrain[ny][nx]==="W"||unitAt(nx,ny))continue;
      const nd=d+moveCost(nx,ny);
      if(nd>u.move)continue;
      seen.add(k);q.push([nx,ny,nd]);
    }
  }
  return out;
}
function attackable(u){return new Set(units.filter(v=>v.hp>0&&v.team!==u.team&&dist(u,v)<=u.range).map(v=>v.x+","+v.y))}
function select(id){if(state.gameOver)return;const u=units.find(v=>v.id===id);if(!u||u.hp<=0)return;if(state.turn!=="hero"||u.team!=="hero"||state.acted.has(id))return;state.selected=id;render()}
function moveSelected(x,y){
  const u=units.find(v=>v.id===state.selected);if(!u||state.turn!=="hero"||state.acted.has(u.id))return;
  const r=reachable(u);if(!r.has(x+","+y))return;
  u.x=x;u.y=y;state.moved.add(u.id);state.skillMode=null;
  log(u.name+"이(가) 이동했습니다. 이제 공격·스킬 또는 대기할 수 있습니다.");
}
function matchupBonus(attacker,defender){
  const a=classData[unitClass[attacker.id]]||classData.foot;
  const d=classData[unitClass[defender.id]]||classData.foot;
  if(a.strong.includes(unitClass[defender.id]))return 10;
  if(a.weak.includes(unitClass[defender.id]))return -8;
  return 0;
}
function terrainDefBonus(u){return terrainAt(u.x,u.y)==="forest"?4:0}
function terrainAtkBonus(u){return terrainAt(u.x,u.y)==="road"?2:0}
function supportAlly(attacker,target){
  return units.filter(v=>v.team===attacker.team&&v.id!==attacker.id&&v.hp>0)
    .filter(v=>(classData[unitClass[v.id]]||{}).supportRange>0)
    .sort((a,b)=>dist(a,target)-dist(b,target))
    .find(v=>dist(v,target)<=(classData[unitClass[v.id]].supportRange||0));
}
function cooperativeAlly(attacker,target){
  return units.filter(v=>v.team===attacker.team&&v.id!==attacker.id&&v.hp>0)
    .filter(v=>(classData[unitClass[v.id]]||{}).coop&&dist(v,target)===1)
    .sort((a,b)=>a.hp-b.hp)[0];
}
function resolveAttack(attacker,target,extra=0,opts={}){
  if(!attacker||!target||attacker.hp<=0||target.hp<=0)return 0;
  const matchup=matchupBonus(attacker,target);
  const raw=attacker.atk+terrainAtkBonus(attacker)+matchup+extra-(target.def+terrainDefBonus(target));
  const dmg=Math.max(1,raw);
  target.hp=Math.max(0,target.hp-dmg);
  log(attacker.name+" → "+target.name+" : "+dmg+" 피해"+(matchup>0?" · 상성 우위":"")+(matchup<0?" · 상성 불리":""));
  if(target.hp===0){log(target.name+"이(가) 쓰러졌습니다.");return dmg;}
  const coop=cooperativeAlly(attacker,target);
  if(coop){
    const cdmg=Math.max(1,Math.floor((coop.atk+matchupBonus(coop,target)+terrainAtkBonus(coop)-target.def-terrainDefBonus(target))*0.28));
    target.hp=Math.max(0,target.hp-cdmg);log("협공! "+coop.name+"이(가) 추가로 "+cdmg+" 피해");
    if(target.hp===0){log(target.name+"이(가) 쓰러졌습니다.");return dmg+cdmg;}
  }
  const sup=supportAlly(attacker,target);
  if(sup&&sup.id!==coop?.id){
    const sdmg=Math.max(1,Math.floor((sup.atk+terrainAtkBonus(sup)+matchupBonus(sup,target)-target.def-terrainDefBonus(target))*0.22));
    target.hp=Math.max(0,target.hp-sdmg);log("지원공격! "+sup.name+"이(가) "+sdmg+" 추가 피해");
    if(target.hp===0){log(target.name+"이(가) 쓰러졌습니다.");return dmg+sdmg;}
  }
  if(!opts.noCounter&&dist(target,attacker)<=target.range){
    const counterRaw=target.atk+matchupBonus(target,attacker)+terrainAtkBonus(target)-(attacker.def+terrainDefBonus(attacker))-4;
    const counter=Math.max(1,counterRaw);
    attacker.hp=Math.max(0,attacker.hp-counter);log("반격! "+target.name+" → "+attacker.name+" : "+counter+" 피해");
    if(attacker.hp===0)log(attacker.name+"이(가) 쓰러졌습니다.");
  }
  return dmg;
}
function attack(id){
  const u=units.find(v=>v.id===state.selected),v=units.find(z=>z.id===id);
  if(!u||!v||u.hp<=0||v.hp<=0||u.team!== "hero"||v.team==="hero"||dist(u,v)>u.range||state.acted.has(u.id))return;
  state.skillMode=null;resolveAttack(u,v,0,{});
  state.acted.add(u.id);checkEnd();
  if(!state.gameOver&&alive("hero").length&&state.acted.size===alive("hero").length)endHeroTurn();
  render();
}
function skillTargets(u,sk){
  const data=skillData[sk]||{};const team=data.kind==="heal"?u.team:(u.team==="hero"?"enemy":"hero");
  return units.filter(v=>v.hp>0&&v.team===team&&dist(u,v)<=data.range);
}
function armSkill(name){
  const u=units.find(v=>v.id===state.selected);if(!u||state.turn!=="hero"||state.acted.has(u.id))return;
  if(state.skillMode===name){state.skillMode=null;render();return;}
  if(!skillData[name])return;
  state.skillMode=name;log("스킬 선택: "+name+" · 범위 안의 대상을 선택하세요.");render();
}
function castSkill(name,targetId){
  const u=units.find(v=>v.id===state.selected),t=units.find(v=>v.id===targetId),data=skillData[name];
  if(!u||!t||!data||state.turn!=="hero"||state.acted.has(u.id))return;
  if((data.kind==="heal"&&t.team!=="hero")||(data.kind==="attack"&&t.team!=="enemy")||dist(u,t)>data.range)return;
  state.skillMode=null;
  if(data.kind==="heal"){
    const healTargets=data.aoe?[...units].filter(v=>v.team==="hero"&&v.hp>0&&dist({x:t.x,y:t.y},v)<=data.aoe):[t];
    healTargets.forEach(v=>{const before=v.hp;v.hp=Math.min(v.maxHp,v.hp+data.heal);log(u.name+"의 "+name+" → "+v.name+" +"+(v.hp-before)+" HP");if(data.cleanse)v.status={};});
  }else{
    const targets=data.aoe?[...units].filter(v=>v.team==="enemy"&&v.hp>0&&dist({x:t.x,y:t.y},v)<=data.aoe):[t];
    targets.forEach(v=>{resolveAttack(u,v,data.damage?data.damage-u.atk:0,{noCounter:data.noCounter});if(v.hp>0&&data.atkDown){v.atk=Math.max(5,v.atk-data.atkDown);log(v.name+" 공격력 -"+data.atkDown);}});
    if(data.retreat&&u.hp>0){
      const old={x:u.x,y:u.y};const dx=Math.sign(u.x-t.x),dy=Math.sign(u.y-t.y);const nx=u.x+dx,ny=u.y+dy;
      if(canWalk(u,nx,ny)){u.x=nx;u.y=ny;log(u.name+"이(가) 후퇴했습니다.");}
    }
  }
  state.acted.add(u.id);checkEnd();
  if(!state.gameOver&&alive("hero").length&&state.acted.size===alive("hero").length)endHeroTurn();
  render();
}
function endHeroTurn(){
  if(scenarios[state.scenarioId].goal){
    const g=scenarios[state.scenarioId].goal;
    if(alive("hero").some(u=>u.x===g.x&&u.y===g.y)){
      state.gameOver=true;state.turn="end";log("승리! 거점을 확보했습니다.");render();return;
    }
  }
  state.turn="enemy";state.acted.clear();state.moved.clear();state.selected=null;state.skillMode=null;
  log("적군 턴");render();setTimeout(enemyTurn,250);
}
function enemyTurn(){
  if(state.gameOver)return;
  const es=alive("enemy");let i=0;
  function step(){
    if(i>=es.length){
      state.enemyTurns++;
      if(checkEnd())return;
      if(scenarios[state.scenarioId].survive&&state.enemyTurns>=scenarios[state.scenarioId].survive){state.gameOver=true;state.turn="end";log("승리! "+scenarios[state.scenarioId].label+" 조건을 달성했습니다.");render();return;}
      state.turn="hero";state.acted.clear();state.moved.clear();state.selected=alive("hero")[0]?.id||null;state.round=state.enemyTurns+1;log("아군 턴");render();return;
    }
    const e=es[i++];if(e.hp<=0){step();return}
    const targets=alive("hero").sort((a,b)=>dist(e,a)-dist(e,b)),t=targets[0];if(!t){step();return}
    if(dist(e,t)<=e.range){resolveAttack(e,t,0,{});if(checkEnd())return;render();setTimeout(step,180);return}
    let dx=Math.sign(t.x-e.x),dy=Math.sign(t.y-e.y);
    const candidates=Math.abs(t.x-e.x)>=Math.abs(t.y-e.y)?[[e.x+dx,e.y],[e.x,e.y+dy]]:[[e.x,e.y+dy],[e.x+dx,e.y]];
    for(const [nx,ny] of candidates){if(canWalk(e,nx,ny)){e.x=nx;e.y=ny;break;}}
    render();setTimeout(step,120);
  }
  step();
}
function checkEnd(){
  if(state.gameOver)return true;
  const sc=scenarios[state.scenarioId];
  if(alive("enemy").length===0){state.gameOver=true;state.turn="end";log("승리! 적군을 모두 격파했습니다.");render();return true;}
  if(alive("hero").length===0){state.gameOver=true;state.turn="end";log("패배… 아군이 전멸했습니다.");render();return true;}
  if(state.scenarioId==="commander"&&!units.find(u=>u.id==="e9")?.hp){state.gameOver=true;state.turn="end";log("승리! 적 지휘관을 격파했습니다.");render();return true;}
  return false;
}
function scenarioWinAtTurnEnd(){
  if(state.scenarioId==="capture"){
    const g=scenarios.capture.goal;const onGoal=alive("hero").some(u=>u.x===g.x&&u.y===g.y);
    if(onGoal){state.gameOver=true;state.turn="end";log("승리! 거점을 확보했습니다.");return true;}
  }
  return checkEnd();
}
function reset(){location.reload()}
state.selected=units.find(u=>u.team==="hero")?.id;state.log=["전투 개시. 아군 5명이 출전했습니다."];render();
})();