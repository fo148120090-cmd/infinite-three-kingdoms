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
let state={turn:"hero",round:1,selected:null,acted:new Set(),log:[],gameOver:false};
const app=document.querySelector("#app");
const alive=t=>units.filter(u=>u.team===t&&u.hp>0);
const unitAt=(x,y)=>units.find(u=>u.x===x&&u.y===y&&u.hp>0);
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function terrainAt(x,y){return typeMap[terrain[y]?.[x]||"."]||"plain"}
function log(s){state.log.unshift(s);state.log=state.log.slice(0,40);render()}
function canWalk(u,x,y){if(x<0||y<0||x>=W||y>=H)return false; if(terrain[y][x]==="W")return false; const v=unitAt(x,y); return !v || v.id===u.id}
function reachable(u){const q=[[u.x,u.y,0]],seen=new Set([u.x+","+u.y]),out=new Set();while(q.length){const [x,y,d]=q.shift();if(d>0)out.add(x+","+y);if(d===u.move)continue;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+","+ny;if(seen.has(k)||!canWalk(u,nx,ny))continue;seen.add(k);q.push([nx,ny,d+1])}}return out}
function attackable(u){return new Set(units.filter(v=>v.hp>0&&v.team!==u.team&&dist(u,v)<=u.range).map(v=>v.x+","+v.y))}
function select(id){if(state.gameOver)return;const u=units.find(v=>v.id===id);if(!u||u.hp<=0)return;if(state.turn!=="hero"||u.team!=="hero"||state.acted.has(id))return;state.selected=id;render()}
function moveSelected(x,y){const u=units.find(v=>v.id===state.selected);if(!u)return;const r=reachable(u);if(!r.has(x+","+y))return;u.x=x;u.y=y;log(u.name+"이(가) 이동했습니다.");}
function attack(id){const u=units.find(v=>v.id===state.selected),v=units.find(z=>z.id===id);if(!u||!v||u.hp<=0||v.hp<=0||u.team===v.team||dist(u,v)>u.range)return;const terrainBonus=terrainAt(u.x,u.y)==="forest"?-2:0;const dmg=Math.max(1,u.atk-v.def+8+terrainBonus);v.hp=Math.max(0,v.hp-dmg);state.acted.add(u.id);log(u.name+" → "+v.name+" : "+dmg+" 피해");if(v.hp===0)log(v.name+"이(가) 쓰러졌습니다.");checkEnd();if(!state.gameOver&&alive("hero").length&&state.acted.size===alive("hero").length)endHeroTurn();render()}
function skill(name){const u=units.find(v=>v.id===state.selected);if(!u||state.acted.has(u.id))return;const targets=units.filter(v=>v.hp>0&&v.team!==u.team&&dist(u,v)<=u.range);if(name==="치유"){const ally=units.filter(v=>v.team==="hero"&&v.hp>0&&dist(u,v)<=u.range).sort((a,b)=>(a.hp/a.maxHp)-(b.hp/b.maxHp))[0];if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+30);state.acted.add(u.id);log(u.name+"의 치유 → "+ally.name+" +30 HP")}}else if(name==="약화"&&targets[0]){targets[0].atk=Math.max(5,targets[0].atk-5);state.acted.add(u.id);log(u.name+"의 약화 → "+targets[0].name+" 공격력 -5")}else if(name==="연사"&&targets.length){targets.slice(0,2).forEach(v=>v.hp=Math.max(0,v.hp-18));state.acted.add(u.id);log(u.name+"의 연사 발동")}else if(name==="빙결술"&&targets[0]){targets[0].hp=Math.max(0,targets[0].hp-26);state.acted.add(u.id);log(u.name+"의 빙결술 → "+targets[0].name)}else if(name==="강습"&&targets[0]){targets[0].hp=Math.max(0,targets[0].hp-35);state.acted.add(u.id);log(u.name+"의 강습 → "+targets[0].name+" 35 피해")}checkEnd();render()}
function endHeroTurn(){state.turn="enemy";state.acted.clear();state.selected=null;state.round++;log("적군 턴");setTimeout(enemyTurn,250)}
function enemyTurn(){if(state.gameOver)return;const es=alive("enemy");let i=0;function step(){if(i>=es.length){state.turn="hero";state.acted.clear();state.selected=alive("hero")[0]?.id||null;log("아군 턴");render();return}const e=es[i++];if(e.hp<=0){step();return}const targets=alive("hero").sort((a,b)=>dist(e,a)-dist(e,b));const t=targets[0];if(!t){step();return}if(dist(e,t)<=e.range){const dmg=Math.max(1,e.atk-t.def+7);t.hp=Math.max(0,t.hp-dmg);log(e.name+"의 공격 → "+t.name+" "+dmg+" 피해");checkEnd();render();setTimeout(step,170);return}let dx=Math.sign(t.x-e.x),dy=Math.sign(t.y-e.y),nx=e.x+(Math.abs(t.x-e.x)>=Math.abs(t.y-e.y)?dx:0),ny=e.y+(Math.abs(t.x-e.x)<Math.abs(t.y-e.y)?dy:0);if(canWalk(e,nx,ny)){e.x=nx;e.y=ny}else if(canWalk(e,e.x+dx,e.y)){e.x+=dx}else if(canWalk(e,e.x,e.y+dy)){e.y+=dy}render();setTimeout(step,120)}step()}
function checkEnd(){if(alive("enemy").length===0){state.gameOver=true;state.turn="end";log("승리! 적군을 모두 격파했습니다.")}else if(alive("hero").length===0){state.gameOver=true;state.turn="end";log("패배… 아군이 전멸했습니다.")}}
function reset(){location.reload()}
function render(){const s=units.find(u=>u.id===state.selected);const moves=s&&state.turn==="hero"&&!state.acted.has(s.id)?reachable(s):new Set();const ats=s&&state.turn==="hero"&&!state.acted.has(s.id)?attackable(s):new Set();
app.innerHTML=`<div class="shell"><div class="top"><div class="title"><h1>전술전기 · 첫 전투 데모</h1><small>턴제 격자 전술 SRPG / 5인 출전</small></div><div class="badges"><span class="badge">고저차 없음</span><span class="badge">화공 없음</span><span class="badge">사기 없음</span><span class="badge">Round ${state.round}</span></div></div>
<div class="layout"><section class="panel battle"><div class="battle-head"><div><b>서쪽 관문 탈환</b><div class="hint">승리조건: 적 전멸 · 패배조건: 아군 전멸</div></div><div class="turn">${state.turn==="hero"?"아군 턴":"적군 턴"}</div></div>
<div class="board">${Array.from({length:H},(_,y)=>Array.from({length:W},(_,x)=>{const u=unitAt(x,y),k=x+","+y;let c="cell "+terrainAt(x,y);if(moves.has(k))c+=" move";if(ats.has(k))c+=" attack";if(s&&s.x===x&&s.y===y)c+=" selected";return `<button class="${c}" onclick="cellClick(${x},${y})"><span class="coord">${x+1},${y+1}</span>${u?`<div class="unit ${u.team}"><span>${u.icon}</span><b>${u.name}</b><div class="hp"><i style="width:${u.hp/u.maxHp*100}%"></i></div></div>`:""}</button>`})).join("")}</div></section>
<aside class="side"><section class="panel card"><h2>출전 부대</h2><div class="unit-list">${units.filter(u=>u.team==="hero").map(u=>`<button class="unit-row ${s?.id===u.id?"active":""}" onclick="selectUnit('${u.id}')"><span class="dot">${u.icon}</span><span class="unit-info"><strong>${u.name} · ${u.job}</strong><span>HP ${u.hp}/${u.maxHp} · 이동 ${u.move} · 사거리 ${u.range}${state.acted.has(u.id)?" · 행동완료":""}</span></span></button>`).join("")}</div></section>
<section class="panel card"><h2>선택 유닛</h2>${s?`<div class="objective"><b>${s.name}</b> · ${s.job}<div class="stats" style="margin-top:7px"><div class="stat">HP <b>${s.hp}/${s.maxHp}</b></div><div class="stat">공격 <b>${s.atk}</b></div><div class="stat">방어 <b>${s.def}</b></div><div class="stat">이동 <b>${s.move}</b></div><div class="stat">사거리 <b>${s.range}</b></div><div class="stat">상태 <b>${state.acted.has(s.id)?"완료":"대기"}</b></div></div></div><div class="actions" style="margin-top:8px">${s.skills.map(sk=>`<button class="btn" onclick="useSkill('${sk}')" ${state.acted.has(s.id)||state.turn!=="hero"?"disabled":""}>${sk}</button>`).join("")}<button class="btn danger full" onclick="waitUnit()" ${state.acted.has(s.id)||state.turn!=="hero"?"disabled":""}>대기</button></div>`:"<div class='hint'>아군 유닛을 선택하세요.</div>"}</section>
<section class="panel card"><h2>전장 요소</h2><span class="tag">평지</span><span class="tag">도로: 이동에 유리</span><span class="tag">숲: 방어적 지형</span><span class="tag">수로: 이동 불가</span><p class="hint">고저차를 사용하지 않습니다. 전장 상황은 지형·장애물·증원·승리조건을 중심으로 확장합니다.</p></section>
<section class="panel card log-card"><h2>전투 기록</h2><div class="log">${state.log.map(x=>`<div>${x}</div>`).join("")}</div><button class="btn full" style="margin-top:7px" onclick="reset()">전투 재시작</button></section></aside></div></div>`}
function cellClick(x,y){const u=unitAt(x,y);const s=units.find(v=>v.id===state.selected);if(state.turn!=="hero"||state.gameOver)return;if(u&&u.team==="hero"){select(u.id);return}if(u&&u.team==="enemy"){attack(u.id);return}if(s)moveSelected(x,y)}
function selectUnit(id){select(id)}function useSkill(n){skill(n)}function waitUnit(){const u=units.find(v=>v.id===state.selected);if(!u)return;state.acted.add(u.id);log(u.name+"이(가) 대기했습니다.");if(state.acted.size===alive("hero").length)endHeroTurn();render()}
window.cellClick=cellClick;window.selectUnit=selectUnit;window.useSkill=useSkill;window.waitUnit=waitUnit;window.reset=reset;
state.selected=units.find(u=>u.team==="hero")?.id;state.log=["전투 개시. 아군 5명이 출전했습니다."];render();
})();