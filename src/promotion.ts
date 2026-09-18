import type { Hero, Job, Tendencies } from "./dungeonData";

type Choice={name:string;keys:(keyof Tendencies)[]};

const firstTier:Record<Job,Choice[]>={
  Warrior:[{name:"광전사",keys:["aggression","bravery"]},{name:"기사",keys:["caution","protect"]},{name:"검투사",keys:["pursuit","focus"]}],
  Guardian:[{name:"철벽 수호자",keys:["protect","survival"]},{name:"가디언 나이트",keys:["protect","bravery"]},{name:"방패 전사",keys:["aggression","focus"]}],
  Archer:[{name:"저격수",keys:["focus","caution"]},{name:"헌터",keys:["pursuit","curiosity"]},{name:"레인저",keys:["survival","cooperation"]}],
  Mage:[{name:"엘리멘탈리스트",keys:["aggression","focus"]},{name:"주술사",keys:["curiosity","cooperation"]},{name:"아케인 메이지",keys:["focus","curiosity"]}],
  Cleric:[{name:"힐러",keys:["protect","cooperation"]},{name:"팔라딘",keys:["bravery","protect"]},{name:"저지",keys:["focus","caution"]}]
};

const secondTier:Record<string,Choice[]>={
  "광전사":[{name:"전쟁군주",keys:["aggression","bravery"]},{name:"학살자",keys:["pursuit","aggression"]},{name:"광란의 파괴자",keys:["aggression","curiosity"]}],
  "기사":[{name:"성기사",keys:["protect","bravery"]},{name:"크루세이더",keys:["bravery","focus"]},{name:"왕실 근위",keys:["protect","caution"]}],
  "검투사":[{name:"결투가",keys:["focus","pursuit"]},{name:"챔피언",keys:["bravery","cooperation"]},{name:"처형자",keys:["pursuit","aggression"]}],
  "철벽 수호자":[{name:"요새",keys:["protect","survival"]},{name:"바스티온",keys:["protect","caution"]},{name:"불가동벽",keys:["survival","bravery"]}],
  "가디언 나이트":[{name:"템플러",keys:["bravery","protect"]},{name:"센티넬",keys:["focus","protect"]},{name:"수호기사단",keys:["cooperation","protect"]}],
  "방패 전사":[{name:"중장벽",keys:["survival","protect"]},{name:"방패파괴자",keys:["aggression","bravery"]},{name:"아에기스",keys:["protect","focus"]}],
  "저격수":[{name:"데드아이",keys:["focus","caution"]},{name:"명사수",keys:["focus","bravery"]},{name:"탄환 사냥꾼",keys:["pursuit","focus"]}],
  "헌터":[{name:"비스트마스터",keys:["curiosity","cooperation"]},{name:"추적자",keys:["pursuit","focus"]},{name:"스토커",keys:["caution","pursuit"]}],
  "레인저":[{name:"윈드러너",keys:["pursuit","focus"]},{name:"패스파인더",keys:["curiosity","survival"]},{name:"스커미셔",keys:["bravery","caution"]}],
  "엘리멘탈리스트":[{name:"인페르노",keys:["aggression","focus"]},{name:"템페스트",keys:["aggression","curiosity"]},{name:"프로스트로드",keys:["caution","focus"]}],
  "주술사":[{name:"스피릿콜러",keys:["cooperation","curiosity"]},{name:"폭풍 주술사",keys:["aggression","focus"]},{name:"헥스위버",keys:["caution","curiosity"]}],
  "아케인 메이지":[{name:"아르카니스트",keys:["focus","curiosity"]},{name:"스펠블레이드",keys:["bravery","focus"]},{name:"보이드 세이지",keys:["caution","curiosity"]}],
  "힐러":[{name:"대사제",keys:["protect","cooperation"]},{name:"성인",keys:["protect","bravery"]},{name:"오라클",keys:["focus","curiosity"]}],
  "팔라딘":[{name:"성전사",keys:["bravery","protect"]},{name:"여명의 기사",keys:["bravery","focus"]},{name:"성스러운 심판관",keys:["protect","caution"]}],
  "저지":[{name:"이단심문관",keys:["focus","bravery"]},{name:"중재자",keys:["focus","cooperation"]},{name:"정화자",keys:["caution","protect"]}]
};

function score(h:Hero,c:Choice){
  return c.keys.reduce((n,k)=>n+(h.tendencies[k]||0),0);
}
function pick(h:Hero,choices:Choice[]){
  return choices.slice().sort((a,b)=>score(h,b)-score(h,a))[0]?.name||"";
}

function applyPromotion(h:Hero,level:number){
  const tier=h.promotionTier||0;
  const path=[...(h.promotionPath||[])];
  let next={...h,promotionTier:tier,promotionPath:path};
  if(level>=10 && tier<1){
    const name=pick(h,firstTier[h.job]);
    next={...next,promotionTier:1,promotionPath:[...path,name],hp:Math.round(h.hp*1.12),attack:Math.round(h.attack*1.06),defense:Math.round(h.defense*1.06)};
  }
  const branch=next.promotionPath?.[0]||"";
  if(level>=20 && (next.promotionTier||0)<2){
    const name=pick(next,secondTier[branch]||[]);
    if(name){
      next={...next,promotionTier:2,promotionPath:[...(next.promotionPath||[]),name],hp:Math.round(next.hp*1.10),attack:Math.round(next.attack*1.08),defense:Math.round(next.defense*1.08)};
    }
  }
  if(level>=30 && (next.promotionTier||0)<3){
    const values=Object.values(next.tendencies).sort((a,b)=>b-a);
    if(values[0]>=85 && values[1]>=75){
      const final=next.job==="Warrior"?"전쟁의 화신":next.job==="Guardian"?"수호의 화신":next.job==="Archer"?"천공의 사수":next.job==="Mage"?"대현자": "성역의 집행자";
      next={...next,promotionTier:3,promotionPath:[...(next.promotionPath||[]),final],hp:Math.round(next.hp*1.15),attack:Math.round(next.attack*1.12),defense:Math.round(next.defense*1.12)};
    }
  }
  return next;
}

export function grantExperience(hero:Hero,gain:number){
  let next={...hero,experience:hero.experience+gain};
  let leveled=false;
  while(next.experience>=100){
    next.experience-=100;
    next.level+=1;
    next.hp=Math.round(next.hp*1.04);
    next.attack=Math.max(next.attack+1,Math.round(next.attack*1.025));
    next.defense=Math.max(next.defense+1,Math.round(next.defense*1.02));
    leveled=true;
    next=applyPromotion(next,next.level);
    next.history=["레벨 업 · Lv."+next.level,...next.history].slice(0,6);
  }
  return {hero:next,leveled};
}

export function promotionLabel(hero:Hero){
  const path=hero.promotionPath||[];
  return path.length?path.join(" → "):"초급";
}

export function promotionForecast(hero:Hero){
  const tier=hero.promotionTier||0;
  const path=hero.promotionPath||[];
  if(tier>=3)return {next:"최종 전직 완료",level:30,progress:100,reason:"최종 전직까지 도달한 상태입니다."};
  if(tier===0){
    const choices=firstTier[hero.job]||[];
    const best=pick(hero,choices);
    const ranked=choices.slice().sort((a,b)=>score(hero,b)-score(hero,a));
    return {next:"Lv.10 · "+(best||"자동 전직"),level:10,progress:Math.min(100,Math.round(hero.level/10*100)),reason:ranked.slice(0,2).map(x=>x.name).join(" / ")+" 후보 중 현재 성향이 높은 쪽으로 자동 결정됩니다."};
  }
  if(tier===1){
    const branch=path[0]||"";
    const choices=secondTier[branch]||[];
    const best=pick(hero,choices);
    const ranked=choices.slice().sort((a,b)=>score(hero,b)-score(hero,a));
    return {next:"Lv.20 · "+(best||"2차 전직"),level:20,progress:Math.min(100,Math.round(hero.level/20*100)),reason:ranked.slice(0,2).map(x=>x.name).join(" / ")+" 후보 중 현재 성향이 높은 쪽으로 자동 결정됩니다."};
  }
  const values=Object.values(hero.tendencies).sort((a,b)=>b-a);
  const ready=values[0]>=85&&values[1]>=75;
  return {next:ready?"Lv.30 · 최종 전직 가능":"Lv.30 · 최종 전직 조건 확인",level:30,progress:Math.min(100,Math.round(hero.level/30*100)),reason:ready?"상위 두 성향이 최종 전직 기준을 충족할 수 있는 상태입니다.":"Lv.30에서 상위 두 성향이 기준을 충족하면 최종 전직합니다."};
}


export function promotionActions(heroPath:string[]|undefined):{name:string;detail:string;bonus:number}[]{
  const path=heroPath||[];
  const text=path.join(" ");
  const out:{name:string;detail:string;bonus:number}[]=[];
  if(/광전사|전쟁군주|학살자|광란/.test(text))out.push({name:"광폭 돌격",detail:"공격성과 용맹을 전부 밀어붙이는 전직 행동",bonus:34});
  if(/기사|성기사|크루세이더|근위|템플러|수호기사|팔라딘|성전사|여명의 기사/.test(text))out.push({name:"수호 맹세",detail:"가까운 위험한 아군을 지키며 자신도 방어 태세를 취함",bonus:32});
  if(/검투사|결투가|챔피언|처형자/.test(text))out.push({name:"결투 집중",detail:"가장 위협적인 단일 대상을 집중 공격",bonus:28});
  if(/철벽|요새|바스티온|불가동벽|중장벽|아에기스/.test(text))out.push({name:"철벽 진형",detail:"아군 주변에서 방어 우선순위를 극대화",bonus:30});
  if(/저격수|데드아이|명사수|탄환/.test(text))out.push({name:"정밀 사격",detail:"체력이 낮은 대상을 확실하게 마무리",bonus:30});
  if(/헌터|비스트마스터|추적자|스토커|레인저|윈드러너|패스파인더|스커미셔/.test(text))out.push({name:"사냥 본능",detail:"약한 대상을 추적하며 거리 우위를 유지",bonus:27});
  if(/엘리멘탈리스트|인페르노|템페스트|프로스트/.test(text))out.push({name:"원소 폭발",detail:"여러 적에게 광역 피해를 집중",bonus:31});
  if(/주술사|스피릿|헥스|폭풍 주술사/.test(text))out.push({name:"저주 확산",detail:"다수 적에게 약화 효과를 남기는 전직 행동",bonus:25});
  if(/아케인|아르카니스트|스펠블레이드|보이드|대현자/.test(text))out.push({name:"비전 해방",detail:"집중력을 끌어올려 강한 마법을 사용",bonus:33});
  if(/힐러|대사제|성인|오라클/.test(text))out.push({name:"대회복",detail:"가장 위험한 동료에게 큰 회복을 시도",bonus:34});
  if(/저지|이단심문관|중재자|정화자/.test(text))out.push({name:"심판",detail:"위협적인 대상을 우선 제압",bonus:29});
  return out;
}
