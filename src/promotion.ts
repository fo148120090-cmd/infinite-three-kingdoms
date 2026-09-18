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
  "철벽 수호자":[{name:"요새",keys:["defense" as keyof Tendencies,"survival"]},{name:"바스티온",keys:["protect","caution"]},{name:"불가동벽",keys:["survival","bravery"]}],
  "가디언 나이트":[{name:"템플러",keys:["bravery","protect"]},{name:"센티넬",keys:["focus","protect"]},{name:"수호기사단",keys:["cooperation","protect"]}],
  "방패 전사":[{name:"중장벽",keys:["survival","protect"]},{name:"방패파괴자",keys:["aggression","bravery"]},{name:"아에기스",keys:["protect","focus"]}],
  "저격수":[{name:"데드아이",keys:["focus","caution"]},{name:"명사수",keys:["focus","bravery"]},{name:"탄환 사냥꾼",keys:["pursuit","focus"]}],
  "헌터":[{name:"비스트마스터",keys:["curiosity","cooperation"]},{name:"추적자",keys:["pursuit","focus"]},{name:"스토커",keys:["caution","pursuit"]}],
  "레인저":[{name:"윈드러너",keys:["speed" as keyof Tendencies,"pursuit"]},{name:"패스파인더",keys:["curiosity","survival"]},{name:"스커미셔",keys:["bravery","caution"]}],
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
    leveled=true;
    next=applyPromotion(next,next.level);
  }
  return {hero:next,leveled};
}

export function promotionLabel(hero:Hero){
  const path=hero.promotionPath||[];
  return path.length?path.join(" → "):"초급";
}
