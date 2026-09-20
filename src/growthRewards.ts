import type { Hero, BattleUnit } from "./dungeonData";

export type GrowthRewardKind = "trait" | "artifact";
export type GrowthReward = {
  kind: GrowthRewardKind;
  name: string;
  detail: string;
  source: string;
};

export const growthTraitCatalog: Record<string,{detail:string;aiMods:Record<string,number>}> = {
  "정예 토벌자": {detail:"정예 적과 반복해서 싸우며 강적을 압박하는 판단이 몸에 배었습니다.", aiMods:{aggression:6,bravery:5,pursuit:8,focus:4}},
  "보스 생존자": {detail:"강력한 보스와의 전투를 견뎌내며 위기 대응 능력이 강화되었습니다.", aiMods:{survival:8,caution:5,bravery:5,focus:4}},
  "수호 전술가": {detail:"전투에서 동료를 지키는 행동을 반복하며 수호 전술이 굳어졌습니다.", aiMods:{protect:9,cooperation:6,caution:4}},
  "전장 분석가": {detail:"전투 기록을 누적하며 적의 행동과 약점을 분석하는 습관이 생겼습니다.", aiMods:{focus:9,caution:5,curiosity:4}},
  "재도전 숙련자": {detail:"같은 전장을 반복해서 공략하며 안정적인 대응법을 익혔습니다.", aiMods:{focus:6,survival:6,pursuit:5}},
  "전리품 감식가": {detail:"보물과 전리품을 반복해서 확인하며 가치 있는 물건을 찾아내는 감각이 좋아졌습니다.", aiMods:{greed:8,curiosity:6,focus:3}},
  "연전 회복관": {detail:"긴 전투에서 회복을 반복하며 위급한 동료를 살피는 습관이 강화되었습니다.", aiMods:{protect:7,cooperation:8,survival:5}}
};

export const growthArtifactCatalog: Record<string,{detail:string;aiMods:Record<string,number>;combatMods:Record<string,number>}> = {
  "정예 토벌의 훈장": {detail:"정예 토벌의 증표. 강적을 쓰러뜨린 경험을 전투력으로 바꿉니다.", aiMods:{aggression:5,pursuit:6,bravery:4}, combatMods:{attack:4,critPct:2}},
  "보스의 핵편": {detail:"보스에게서 추출한 응축 핵. 강한 적을 상대로 한 전투를 강화합니다.", aiMods:{focus:6,bravery:5}, combatMods:{attack:7,hpPct:5}},
  "심층 탐사 기록": {detail:"심층 지역의 지형과 약점을 기록한 전투 기록.", aiMods:{focus:7,curiosity:6,caution:4}, combatMods:{range:.3}},
  "생환자의 표식": {detail:"위험한 원정에서 살아 돌아온 증표. 생존과 방어 행동을 강화합니다.", aiMods:{survival:7,caution:7,protect:4}, combatMods:{defense:5,hpPct:5}},
  "연전의 깃발": {detail:"여러 차례의 전투에서 파티가 함께 사용한 지휘 표식.", aiMods:{cooperation:8,focus:4,bravery:3}, combatMods:{speedPct:3,defense:2}},
  "보물 탐사의 인장": {detail:"보물방에서 발견한 탐사 인장. 추가 보상을 노리는 판단을 강화합니다.", aiMods:{greed:9,curiosity:7}, combatMods:{attack:3,critPct:2}}
};

function topHeroByBattle(units:BattleUnit[]):BattleUnit|undefined {
  return units
    .filter(u=>u.team==="player"&&u.alive)
    .slice()
    .sort((a,b)=>(b.battleStats?.damage||0)-(a.battleStats?.damage||0)||(b.battleStats?.healing||0)-(a.battleStats?.healing||0)||(b.battleStats?.actions||0)-(a.battleStats?.actions||0))[0];
}

function firstEligibleHero(heroes:Hero[], predicate:(h:Hero)=>boolean):Hero|undefined {
  return heroes.filter(predicate).slice().sort((a,b)=>(b.level-a.level)||(b.experience-a.experience))[0];
}

export function eliteClearReward(units:BattleUnit[], heroes:Hero[]):GrowthReward|undefined {
  const mvp=topHeroByBattle(units);
  if(!mvp) return undefined;
  const hero=heroes.find(h=>h.id===mvp.id);
  if(!hero || (hero.campaignStats?.eliteWins||0)!==0) return undefined;
  const name=hero.job==="Guardian"?"수호 전술가":hero.job==="Cleric"?"연전 회복관":hero.job==="Mage"||hero.job==="Archer"?"전장 분석가":"정예 토벌자";
  if((hero.traits||[]).includes(name)) return undefined;
  return {kind:"trait",name,detail:growthTraitCatalog[name].detail,source:"첫 정예 전투 클리어"};
}

export function bossClearReward(units:BattleUnit[], heroes:Hero[]):GrowthReward|undefined {
  const mvp=topHeroByBattle(units);
  if(!mvp) return undefined;
  const hero=heroes.find(h=>h.id===mvp.id);
  if(!hero || (hero.campaignStats?.bossWins||0)!==0) return undefined;
  const candidates=hero.job==="Guardian"||hero.job==="Cleric" ? ["생환자의 표식","연전의 깃발"] : ["보스의 핵편","정예 토벌의 훈장"];
  const name=candidates.find(x=>!(hero.artifacts||[]).includes(x))||candidates[0];
  return {kind:"artifact",name,detail:growthArtifactCatalog[name].detail,source:"첫 보스 클리어"};
}

export function repeatClearReward(units:BattleUnit[],heroes:Hero[],repeatCount:number):GrowthReward|undefined {
  if(repeatCount<3) return undefined;
  const mvp=topHeroByBattle(units);
  const hero=mvp&&heroes.find(h=>h.id===mvp.id);
  if(!hero || (hero.traits||[]).includes("재도전 숙련자")) return undefined;
  return {kind:"trait",name:"재도전 숙련자",detail:growthTraitCatalog["재도전 숙련자"].detail,source:"시나리오 3회 이상 재도전"};
}

export function milestoneReward(hero:Hero, actionCounts:Record<string,number>):GrowthReward|undefined {
  const thresholds=[
    {action:"아군 보호",name:"수호 전술가",kind:"trait" as const},
    {action:"회복",name:"연전 회복관",kind:"trait" as const},
    {action:"추격",name:"정예 토벌자",kind:"trait" as const},
    {action:"광역 마법",name:"전장 분석가",kind:"trait" as const}
  ];
  for(const item of thresholds){
    if((actionCounts[item.action]||0)>=10 && !(hero.traits||[]).includes(item.name)){
      return {kind:item.kind,name:item.name,detail:growthTraitCatalog[item.name].detail,source:item.action+" 10회 달성"};
    }
  }
  return undefined;
}

export function hiddenRoomReward(hero:Hero, floor:number):GrowthReward|undefined {
  if(floor<4 || Math.random()>0.5) return undefined;
  const name=hero.tendencies.curiosity>=70 ? "전리품 감식가" : hero.tendencies.focus>=70 ? "전장 분석가" : "재도전 숙련자";
  if((hero.traits||[]).includes(name)) return undefined;
  return {kind:"trait",name,detail:growthTraitCatalog[name]?.detail||"숨은 방 탐색 경험으로 얻은 특성입니다.",source:"숨은 방 탐색"};
}

export function treasureArtifactReward(hero:Hero,floor:number):GrowthReward|undefined {
  if(floor<3 || Math.random()>0.2) return undefined;
  const candidates=["보물 탐사의 인장","심층 탐사 기록","생환자의 표식"];
  const name=candidates.find(x=>!(hero.artifacts||[]).includes(x));
  if(!name) return undefined;
  return {kind:"artifact",name,detail:growthArtifactCatalog[name].detail,source:"보물방 특수 발견"};
}

export function pickRecipient(heroes:Hero[], preferredId?:string):Hero|undefined {
  if(preferredId){
    const preferred=heroes.find(h=>h.id===preferredId);
    if(preferred)return preferred;
  }
  return firstEligibleHero(heroes,h=>(h.traits||[]).length<4||(h.artifacts||[]).length<4);
}
