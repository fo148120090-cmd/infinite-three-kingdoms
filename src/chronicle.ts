import type { Hero } from "./dungeonData";

type Bonus={attack?:number;defense?:number;hpPct?:number;speedPct?:number};
type ChronicleDef={id:string;kind:"achievement"|"title";name:string;description:string;bonus:Bonus;check:(hero:Hero)=>boolean};

export const chronicleCatalog:ChronicleDef[]=[
  {id:"first-victory",kind:"achievement",name:"첫 승리",description:"어둠 속 첫 전투에서 살아남았다.",bonus:{attack:1},check:h=>(h.campaignStats?.wins||0)>=1},
  {id:"veteran",kind:"achievement",name:"노련한 원정자",description:"수많은 전투를 경험하며 원정 감각을 익혔다.",bonus:{defense:2,hpPct:2},check:h=>(h.campaignStats?.wins||0)>=5},
  {id:"elite-hunter",kind:"achievement",name:"정예 토벌자",description:"정예 무리를 여러 차례 돌파했다.",bonus:{attack:2,defense:1},check:h=>(h.campaignStats?.eliteWins||0)>=3},
  {id:"guardian-oath",kind:"achievement",name:"수호의 맹세",description:"반복되는 보호 행동으로 동료를 지키는 영웅이 되었다.",bonus:{defense:3,hpPct:2},check:h=>(h.behaviorCounts?.["아군 보호"]||0)+(h.behaviorCounts?.["수호 맹세"]||0)+(h.behaviorCounts?.["철벽 진형"]||0)>=20},
  {id:"relentless",kind:"achievement",name:"멈추지 않는 칼날",description:"추격과 공격을 반복해 압박을 이어갔다.",bonus:{attack:3,speedPct:2},check:h=>(h.behaviorCounts?.["추격"]||0)+(h.behaviorCounts?.["광폭 돌격"]||0)>=25},
  {id:"deep-explorer",kind:"achievement",name:"심층 개척자",description:"깊은 층으로 향하는 원정을 계속했다.",bonus:{speedPct:3},check:h=>(h.campaignStats?.bossWins||0)>=2},
  {id:"abyss-breaker",kind:"achievement",name:"악의 문 파쇄자",description:"악의 동굴의 수문장을 쓰러뜨렸다.",bonus:{attack:5,defense:5,hpPct:5},check:h=>(h.campaignStats?.finalWins||0)>=1},

  {id:"dungeon-vanguard",kind:"title",name:"동굴의 선봉장",description:"심층 관문을 돌파한 원정대의 선봉장.",bonus:{attack:2,hpPct:2},check:h=>(h.campaignStats?.bossWins||0)>=1},
  {id:"iron-heart",kind:"title",name:"철의 심장",description:"패배를 겪어도 원정을 이어 간 불굴의 용사.",bonus:{defense:3,hpPct:3},check:h=>(h.campaignStats?.losses||0)>=1&&(h.campaignStats?.wins||0)>=3},
  {id:"scenario-veteran",kind:"title",name:"반복 도전의 전사",description:"완료한 시나리오를 다시 돌파하며 성장했다.",bonus:{speedPct:3,attack:2},check:h=>(h.campaignStats?.repeatWins||0)>=5},
  {id:"world-saver",kind:"title",name:"세계의 봉인자",description:"세계의 구멍을 막아 악의 침입을 저지했다.",bonus:{attack:8,defense:8,hpPct:8},check:h=>h.statusNote==="세계의 구멍 봉인 완료"}
];

export function chronicleBonuses(hero:Hero):Bonus{
  return (hero.chronicle||[]).reduce((a,e)=>{
    const d=chronicleCatalog.find(x=>x.id===e.id); if(!d)return a;
    for(const k of ["attack","defense","hpPct","speedPct"] as const)a[k]=(a[k]||0)+(d.bonus[k]||0);
    return a;
  },{} as Bonus);
}

export function awardChronicle(hero:Hero):Hero{
  const existing=new Set((hero.chronicle||[]).map(x=>x.id));
  const now=Date.now();
  const entries=[...(hero.chronicle||[])];
  for(const d of chronicleCatalog){
    if(existing.has(d.id)||!d.check(hero))continue;
    entries.push({kind:d.kind,id:d.id,name:d.name,description:d.description,earnedAt:now});
  }
  return {...hero,chronicle:entries.slice().sort((a,b)=>a.earnedAt-b.earnedAt)};
}

export function chronicleLabel(hero:Hero):string{
  const title=(hero.chronicle||[]).slice().reverse().find(x=>x.kind==="title");
  return title?.name||"신입 원정자";
}

export function systemMood(hero:Hero):string{
  const t=hero.tendencies;
  if((hero.memories||[]).some(m=>m.text.includes("동료를 잃")))return "동료를 잃은 기억이 남아 긴장감이 높다";
  if(t.aggression+t.bravery>=155)return "투지가 끓어오른다";
  if(t.protect+t.cooperation>=155)return "동료를 살피며 안정을 찾고 있다";
  if(t.caution+t.survival>=150)return "주변을 경계하며 침착하게 준비한다";
  if(t.curiosity+t.focus>=150)return "다음 심층에 강한 호기심을 보인다";
  return "차분하게 다음 원정을 준비한다";
}

export function systemStatus(hero:Hero):string{
  const stats=hero.campaignStats;
  if(hero.statusNote==="세계의 구멍 봉인 완료")return "세계의 구멍 봉인 완료 · 전설의 원정 기록";
  if((stats?.finalWins||0)>0)return "악의 동굴 수문장 격파 · 세계의 구멍 봉인 대기";
  if((stats?.bossWins||0)>0)return "심층 전투 경험 축적 · 다음 관문 대비";
  if((stats?.losses||0)>0)return "전투 상처의 기억 보유 · 재도전 가능";
  if((stats?.wins||0)>0)return "원정 경험 누적 · 성장 단계 진입";
  return "첫 원정을 준비하는 상태";
}

export function systemEvaluation(hero:Hero):string{
  const b=chronicleBonuses(hero);
    if(hero.statusNote==="세계의 구멍 봉인 완료")return "평가: 세계의 구멍을 봉인한 전설적 용사. 연대기 가산 효과가 전투력에 반영된다.";
  if((hero.campaignStats?.finalWins||0)>0)return "평가: 악의 동굴 수문장을 쓰러뜨린 용사. 이제 마지막 봉인 의식만 남았다.";
  if(b.attack&&b.defense)return "평가: 전투 기록과 영웅적 업적이 균형 있게 축적되고 있다.";
  if(hero.tendencies.protect>80&&hero.tendencies.cooperation>80)return "평가: 동료의 생존을 우선하는 핵심 수호자.";
  if(hero.tendencies.aggression>80&&hero.tendencies.bravery>75)return "평가: 위험을 감수하며 전선을 밀어붙이는 공격형 용사.";
  if(hero.tendencies.focus>80&&hero.tendencies.caution>70)return "평가: 판단을 서두르지 않고 기회를 기다리는 정밀한 용사.";
  return "평가: 아직 성향이 완전히 굳지 않은 성장형 용사.";
}
