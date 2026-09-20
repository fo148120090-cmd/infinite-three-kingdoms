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

const lateTierChoices:Record<number,Record<Job,Choice[]>>={
  4:{
    Warrior:[{name:"파멸 전쟁군주",keys:["aggression","bravery"]},{name:"철혈 기사",keys:["protect","bravery"]},{name:"무쌍 투사",keys:["pursuit","focus"]}],
    Guardian:[{name:"불굴의 요새",keys:["protect","survival"]},{name:"성벽의 기사",keys:["protect","bravery"]},{name:"철갑 분쇄자",keys:["aggression","focus"]}],
    Archer:[{name:"천공 저격수",keys:["focus","caution"]},{name:"심연 추적자",keys:["pursuit","curiosity"]},{name:"폭풍 레인저",keys:["survival","cooperation"]}],
    Mage:[{name:"대원소술사",keys:["aggression","focus"]},{name:"심연 주술사",keys:["curiosity","cooperation"]},{name:"비전 대마도사",keys:["focus","curiosity"]}],
    Cleric:[{name:"대성역 사제",keys:["protect","cooperation"]},{name:"성좌 팔라딘",keys:["bravery","protect"]},{name:"천벌 집행자",keys:["focus","caution"]}]
  },
  5:{
    Warrior:[{name:"전쟁신의 사도",keys:["aggression","bravery"]},{name:"철혈 성전왕",keys:["protect","bravery"]},{name:"무쌍 검성",keys:["pursuit","focus"]}],
    Guardian:[{name:"불침의 성채",keys:["protect","survival"]},{name:"천상의 방벽",keys:["protect","bravery"]},{name:"절대 수호자",keys:["aggression","focus"]}],
    Archer:[{name:"천궁의 신궁",keys:["focus","caution"]},{name:"심연 사냥왕",keys:["pursuit","curiosity"]},{name:"세계수 레인저",keys:["survival","cooperation"]}],
    Mage:[{name:"원소 재앙술사",keys:["aggression","focus"]},{name:"대주령술사",keys:["curiosity","cooperation"]},{name:"공허 대현자",keys:["focus","curiosity"]}],
    Cleric:[{name:"성역의 대주교",keys:["protect","cooperation"]},{name:"신벌의 성기사",keys:["bravery","protect"]},{name:"천상의 심판자",keys:["focus","caution"]}]
  },
  6:{
    Warrior:[{name:"전쟁신",keys:["aggression","bravery"]},{name:"무한의 검제",keys:["pursuit","focus"]},{name:"파멸의 군왕",keys:["aggression","curiosity"]}],
    Guardian:[{name:"불멸의 방패",keys:["protect","survival"]},{name:"영원의 수호자",keys:["protect","bravery"]},{name:"절대 방벽",keys:["survival","focus"]}],
    Archer:[{name:"천공의 신궁",keys:["focus","caution"]},{name:"무한 추적자",keys:["pursuit","curiosity"]},{name:"세계의 파수꾼",keys:["survival","cooperation"]}],
    Mage:[{name:"창세 원소군",keys:["aggression","focus"]},{name:"심연 군주",keys:["curiosity","cooperation"]},{name:"무한 대현자",keys:["focus","curiosity"]}],
    Cleric:[{name:"영원의 성자",keys:["protect","cooperation"]},{name:"신성 수호왕",keys:["bravery","protect"]},{name:"최후의 심판관",keys:["focus","caution"]}]
  }
};

function score(h:Hero,c:Choice){
  return c.keys.reduce((n,k)=>n+(h.tendencies[k]||0),0);
}
function pick(h:Hero,choices:Choice[]){
  return choices.slice().sort((a,b)=>score(h,b)-score(h,a))[0]?.name||"";
}
function pushPromotion(next:Hero,tier:number,name:string,mults:{hp:number;attack:number;defense:number}){
  return {...next,promotionTier:tier,promotionPath:[...(next.promotionPath||[]),name],
    hp:Math.round(next.hp*mults.hp),attack:Math.round(next.attack*mults.attack),defense:Math.round(next.defense*mults.defense)};
}

function applyPromotion(h:Hero,level:number){
  const tier=h.promotionTier||0;
  const path=[...(h.promotionPath||[])];
  let next={...h,promotionTier:tier,promotionPath:path};
  if(level>=10 && (next.promotionTier||0)<1){
    const name=pick(next,firstTier[next.job]);
    if(name)next=pushPromotion(next,1,name,{hp:1.12,attack:1.06,defense:1.06});
  }
  const branch=next.promotionPath?.[0]||"";
  if(level>=20 && (next.promotionTier||0)<2){
    const name=pick(next,secondTier[branch]||[]);
    if(name)next=pushPromotion(next,2,name,{hp:1.10,attack:1.08,defense:1.08});
  }
  if(level>=30 && (next.promotionTier||0)<3){
    const final=next.job==="Warrior"?"전쟁의 화신":next.job==="Guardian"?"수호의 화신":next.job==="Archer"?"천공의 사수":next.job==="Mage"?"대현자":"성역의 집행자";
    next=pushPromotion(next,3,final,{hp:1.15,attack:1.12,defense:1.12});
  }
  if(level>=50 && (next.promotionTier||0)<4){
    const name=pick(next,lateTierChoices[4][next.job]);
    if(name)next=pushPromotion(next,4,name,{hp:1.18,attack:1.15,defense:1.15});
  }
  if(level>=70 && (next.promotionTier||0)<5){
    const name=pick(next,lateTierChoices[5][next.job]);
    if(name)next=pushPromotion(next,5,name,{hp:1.22,attack:1.19,defense:1.19});
  }
  if(level>=100 && (next.promotionTier||0)<6){
    const name=pick(next,lateTierChoices[6][next.job]);
    if(name)next=pushPromotion(next,6,name,{hp:1.30,attack:1.25,defense:1.25});
  }
  return next;
}


const finalAwakeningData:Record<string,{id:string;name:string;detail:string;skillName:string;skillDetail:string;attack:number;defense:number;hpPct:number;speedPct:number;range:number}> = {
  kael:{id:"kael-infinite",name:"무쌍천극",detail:"100레벨에 도달한 카엘의 최종 각성. 전장의 한계를 넘어 무쌍의 경지를 완성합니다.",skillName:"천극·무쌍",skillDetail:"전투 시작 시 공격력과 기동력을 크게 끌어올리는 최종 각성 패시브.",attack:24,defense:4,hpPct:6,speedPct:1.5,range:.03},
  seren:{id:"seren-infinite",name:"불침영역",detail:"100레벨에 도달한 세린의 최종 각성. 자신과 동료를 지키는 절대 수호 영역을 완성합니다.",skillName:"천벽·불침",skillDetail:"전투 시작 시 방어력과 최대 HP를 크게 높이는 최종 각성 패시브.",attack:4,defense:18,hpPct:12,speedPct:.4,range:.02},
  lyra:{id:"lyra-infinite",name:"천궁극점",detail:"100레벨에 도달한 리라의 최종 각성. 전장을 꿰뚫는 궁술의 극점을 완성합니다.",skillName:"천궁·일점",skillDetail:"전투 시작 시 공격력·사거리·기동력을 강화하는 최종 각성 패시브.",attack:20,defense:3,hpPct:4,speedPct:1.0,range:.14},
  orion:{id:"orion-infinite",name:"종언의 비전",detail:"100레벨에 도달한 오리온의 최종 각성. 비전의 한계를 넘어 종언의 마력을 개방합니다.",skillName:"비전·종언",skillDetail:"전투 시작 시 마력 화력과 사거리를 강화하는 최종 각성 패시브.",attack:23,defense:3,hpPct:3,speedPct:.8,range:.12},
  mira:{id:"mira-infinite",name:"영원의 성역",detail:"100레벨에 도달한 미라의 최종 각성. 영원히 지속되는 성역의 기적을 완성합니다.",skillName:"기적·영원",skillDetail:"전투 시작 시 회복형 영웅의 생존 기반을 크게 강화하는 최종 각성 패시브.",attack:5,defense:12,hpPct:10,speedPct:.5,range:.08}
};
const genericFinalAwakening:Record<Job,{id:string;name:string;detail:string;skillName:string;skillDetail:string;attack:number;defense:number;hpPct:number;speedPct:number;range:number}> = {
  Warrior:{id:"warrior-infinite",name:"무한의 전사",detail:"100레벨 최종 각성으로 전사의 성장 한계를 넘어섭니다.",skillName:"무한·돌파",skillDetail:"전투 시작 시 공격과 기동을 강화합니다.",attack:18,defense:5,hpPct:5,speedPct:1.0,range:.03},
  Guardian:{id:"guardian-infinite",name:"무한의 방벽",detail:"100레벨 최종 각성으로 수호자의 성장 한계를 넘어섭니다.",skillName:"무한·수호",skillDetail:"전투 시작 시 방어와 생존을 강화합니다.",attack:5,defense:15,hpPct:10,speedPct:.3,range:.02},
  Archer:{id:"archer-infinite",name:"무한의 신궁",detail:"100레벨 최종 각성으로 궁수의 성장 한계를 넘어섭니다.",skillName:"무한·정밀",skillDetail:"전투 시작 시 공격과 사거리를 강화합니다.",attack:17,defense:3,hpPct:4,speedPct:.9,range:.12},
  Mage:{id:"mage-infinite",name:"무한의 대현자",detail:"100레벨 최종 각성으로 마법사의 성장 한계를 넘어섭니다.",skillName:"무한·비전",skillDetail:"전투 시작 시 마법 화력과 사거리를 강화합니다.",attack:20,defense:3,hpPct:3,speedPct:.7,range:.1},
  Cleric:{id:"cleric-infinite",name:"무한의 성역",detail:"100레벨 최종 각성으로 성직자의 성장 한계를 넘어섭니다.",skillName:"무한·기적",skillDetail:"전투 시작 시 회복과 생존 기반을 강화합니다.",attack:4,defense:10,hpPct:9,speedPct:.4,range:.06}
};
const finalAwakeningFor=(hero:Hero)=>finalAwakeningData[hero.id]||genericFinalAwakening[hero.job];

const endgameAwakening=(hero:Hero,level:number):Hero=>{
  const definitions:{level:50|70|100;name:string;detail:string;hp:number;attack:number;defense:number;speed:number;range:number}[]=[
    {level:50,name:"초월 각성 · 개화",detail:"50레벨에 도달해 영웅의 잠재력이 개화합니다.",hp:1.08,attack:3,defense:2,speed:.04,range:.03},
    {level:70,name:"초월 각성 · 극점",detail:"70레벨에 도달해 전투 특성이 극점에 도달합니다.",hp:1.12,attack:5,defense:3,speed:.05,range:.04},
    {level:100,name:"초월 각성 · 무한",detail:"100레벨 최종 각성. 영웅의 성장 한계를 넘어섭니다.",hp:1.18,attack:8,defense:5,speed:.08,range:.06}
  ];
  const unlocked=new Set((hero.awakenings||[]).map(x=>x.level));
  let next=hero; const entries=[...(hero.awakenings||[])];
  for(const d of definitions){
    if(level<d.level||unlocked.has(d.level))continue;
    next={...next,hp:Math.round(next.hp*d.hp),attack:next.attack+d.attack,defense:next.defense+d.defense,speed:next.speed+d.speed,range:next.range+d.range};
    entries.push({level:d.level,name:d.name,detail:d.detail,earnedAt:Date.now()});
    next.history=[d.name+" 해금",...(next.history||[])].slice(0,6);
  }
  if(level>=100 && !next.finalAwakening){
    const f=finalAwakeningFor(next);
    next={
      ...next,
      hp:Math.round(next.hp*(1+f.hpPct/100)),
      attack:next.attack+f.attack,
      defense:next.defense+f.defense,
      speed:next.speed*(1+f.speedPct/100),
      range:next.range+f.range,
      finalAwakening:{id:f.id,name:f.name,detail:f.detail,skillName:f.skillName,skillDetail:f.skillDetail,earnedAt:Date.now()},
      history:[f.skillName+" 해금",...(next.history||[])].slice(0,6)
    };
  }
  return {...next,awakenings:entries};
};

export function awakeningSummary(hero:Hero):string{
  const levels=(hero.awakenings||[]).map(x=>x.level);
  if(levels.includes(100))return "무한 각성 완료";
  if(levels.includes(70))return "극점 각성 완료 · Lv.100 대기";
  if(levels.includes(50))return "개화 각성 완료 · Lv.70 대기";
  return "최종 각성 미해금 · Lv.50부터 시작";
}

export function grantExperience(hero:Hero,gain:number){
  const safeLevel=Math.max(1,Math.floor(Number(hero.level)||1));
  const rawExperience=Number(hero.experience);
  const safeExperience=Number.isFinite(rawExperience)?Math.max(0,rawExperience):0;
  const safeGain=Number.isFinite(Number(gain))?Math.max(0,Number(gain)):0;
  let next={...hero,level:safeLevel,experience:safeExperience+safeGain};
  let leveled=false;
  while(next.experience>=100){
    next.experience-=100;
    next.level+=1;
    next.skillPoints=(next.skillPoints||0)+1;
    next.hp=Math.round(next.hp*1.04);
    next.attack=Math.max(next.attack+1,Math.round(next.attack*1.025));
    next.defense=Math.max(next.defense+1,Math.round(next.defense*1.02));
    leveled=true;
    next=applyPromotion(next,next.level);
    next=endgameAwakening(next,next.level);
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
  const forecast=(level:number,choices:Choice[],fallback:string)=>{
    const best=pick(hero,choices);
    const ranked=choices.slice().sort((a,b)=>score(hero,b)-score(hero,a));
    return {next:"Lv."+level+" · "+(best||fallback),level,progress:Math.min(100,Math.round(hero.level/level*100)),reason:ranked.slice(0,2).map(x=>x.name).join(" / ")+" 후보 중 현재 성향이 높은 쪽으로 자동 결정됩니다."};
  };
  if(tier>=6)return {next:"Lv.100 · 최종 각성 완료",level:100,progress:100,reason:"100레벨 최종 각성까지 도달한 상태입니다."};
  if(tier===0)return forecast(10,firstTier[hero.job]||[],"자동 전직");
  if(tier===1){
    const branch=path[0]||"";
    return forecast(20,secondTier[branch]||[],"2차 전직");
  }
  if(tier===2)return forecast(30,[{name:hero.job==="Warrior"?"전쟁의 화신":hero.job==="Guardian"?"수호의 화신":hero.job==="Archer"?"천공의 사수":hero.job==="Mage"?"대현자":"성역의 집행자",keys:["focus","bravery"]}],"3차 전직");
  if(tier===3)return forecast(50,lateTierChoices[4][hero.job]||[],"4차 전직");
  if(tier===4)return forecast(70,lateTierChoices[5][hero.job]||[],"5차 전직");
  return forecast(100,lateTierChoices[6][hero.job]||[],"최종 각성");
}

export function promotionActions(heroPath:string[]|undefined):{name:string;detail:string;bonus:number}[]{
  const path=heroPath||[];
  const text=path.join(" ");
  const out:{name:string;detail:string;bonus:number}[]=[];
  if(/광전사|전쟁군주|학살자|광란|파멸|전쟁신|검성|군왕/.test(text))out.push({name:"광폭 돌격",detail:"공격성과 용맹을 전부 밀어붙이는 전직 행동",bonus:34});
  if(/기사|성기사|크루세이더|근위|템플러|수호기사|팔라딘|성전사|여명의 기사|철혈|성벽|방벽|수호자|방패/.test(text))out.push({name:"수호 맹세",detail:"가까운 위험한 아군을 지키며 자신도 방어 태세를 취함",bonus:32});
  if(/검투사|결투가|챔피언|처형자|투사/.test(text))out.push({name:"결투 집중",detail:"가장 위협적인 단일 대상을 집중 공격",bonus:28});
  if(/철벽|요새|바스티온|불가동벽|중장벽|아에기스|성채|불침|방패|절대 방벽/.test(text))out.push({name:"철벽 진형",detail:"아군 주변에서 방어 우선순위를 극대화",bonus:30});
  if(/저격수|데드아이|명사수|탄환|신궁|저격/.test(text))out.push({name:"정밀 사격",detail:"체력이 낮은 대상을 확실하게 마무리",bonus:30});
  if(/헌터|비스트마스터|추적자|스토커|레인저|윈드러너|패스파인더|스커미셔|추적|사냥왕/.test(text))out.push({name:"사냥 본능",detail:"약한 대상을 추적하며 거리 우위를 유지",bonus:27});
  if(/엘리멘탈리스트|인페르노|템페스트|프로스트|원소|대마도사/.test(text))out.push({name:"원소 폭발",detail:"여러 적에게 광역 피해를 집중",bonus:31});
  if(/주술사|스피릿|헥스|폭풍 주술사|주령|심연 주술/.test(text))out.push({name:"저주 확산",detail:"다수 적에게 약화 효과를 남기는 전직 행동",bonus:25});
  if(/아케인|아르카니스트|스펠블레이드|보이드|대현자|비전|공허|대현자/.test(text))out.push({name:"비전 해방",detail:"집중력을 끌어올려 강한 마법을 사용",bonus:33});
  if(/힐러|대사제|성인|오라클|성역 사제|대주교|성자/.test(text))out.push({name:"대회복",detail:"가장 위험한 동료에게 큰 회복을 시도",bonus:34});
  if(/저지|이단심문관|중재자|정화자|집행자|심판자/.test(text))out.push({name:"심판",detail:"위협적인 대상을 우선 제압",bonus:29});
  return out;
}
