import type { Hero, Item, Tendencies } from "./dungeonData";
import type { EnvironmentKind } from "./dungeonEnvironment";
import { randomGeneralItem, uniqueItems } from "./dungeonData";

type EventUpdate={hpDelta?:number;tendencies?:Partial<Tendencies>};
export type DungeonEventOutcome={
  text:string;
  gold:number;
  materials:number;
  item?:Item;
  heroUpdates:Record<string,EventUpdate>;
};

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

export function resolveHiddenRoom(heroes:Hero[],partyIds:string[],floor:number,environment:EnvironmentKind):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const heroUpdates:Record<string,EventUpdate>={};
  const curiosity=party.length?party.reduce((n,h)=>n+h.tendencies.curiosity,0)/party.length:0;
  const focus=party.length?party.reduce((n,h)=>n+h.tendencies.focus,0)/party.length:0;
  const item=Math.random()<.28?uniqueItems[Math.floor(Math.random()*uniqueItems.length)]:randomGeneralItem(floor+6);
  party.forEach(h=>heroUpdates[h.id]={tendencies:{curiosity:clamp(h.tendencies.curiosity+1.2),focus:clamp(h.tendencies.focus+.5)}});
  const envReward=environment==="water"?20:environment==="dark"?18:environment==="unstable"?28:12;
  return {text:`숨은 방 발견 · ${environmentInfoName(environment)} · 호기심 ${Math.round(curiosity)}/100 / 집중 ${Math.round(focus)}/100`,gold:220,materials:envReward,item,heroUpdates};
}
function environmentInfoName(environment:EnvironmentKind){return environment==="dark"?"암흑 보관실":environment==="narrow"?"비밀 측로":environment==="toxic"?"해독 연구실":environment==="water"?"수중 금고":"공명 수정실";}

export function resolveDungeonEvent(heroes:Hero[],partyIds:string[],floor:number,environment?:EnvironmentKind):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const avg=(key:keyof Tendencies)=>party.length?party.reduce((n,h)=>n+h.tendencies[key],0)/party.length:0;
  const curiosity=avg("curiosity"), caution=avg("caution"), greed=avg("greed"), bravery=avg("bravery"), survival=avg("survival"), cooperation=avg("cooperation");
  const roll=Math.random();
  const heroUpdates:Record<string,EventUpdate>={};

  if(environment==="dark" && curiosity>=62 && roll<.52){
    const item=randomGeneralItem(floor+4);
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+1),focus:clamp(h.tendencies.focus+.6)}}));
    return {text:"암흑 기록실: 어둠 속 숨겨진 문서를 찾아 고급 장비를 발견했다.",gold:160,materials:20,item,heroUpdates};
  }
  if(environment==="narrow" && caution<58 && roll<.55){
    const damage=Math.max(5,Math.round(9+(58-caution)*.18));
    party.forEach(h=>touch(h.id,{hpDelta:-damage,tendencies:{caution:clamp(h.tendencies.caution-.6),survival:clamp(h.tendencies.survival+.5)}}));
    return {text:"압력판 통로: 좁은 길에서 함정이 작동해 파티가 피해를 입었다.",gold:70,materials:16,heroUpdates};
  }
  if(environment==="toxic" && survival>=58 && roll<.58){
    const item=randomGeneralItem(floor+3);
    party.forEach(h=>touch(h.id,{hpDelta:10,tendencies:{survival:clamp(h.tendencies.survival+.7),caution:clamp(h.tendencies.caution+.4)}}));
    return {text:"해독 약초 저장고: 독성 지대에서 약초를 확보해 회복하고 장비를 찾았다.",gold:90,materials:24,item,heroUpdates};
  }
  if(environment==="water" && curiosity>=58 && roll<.55){
    const item=roll<.14?uniqueItems[Math.floor(Math.random()*uniqueItems.length)]:randomGeneralItem(floor+5);
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+.8)}}));
    return {text:"수중 금고: 물속에 잠긴 보관함에서 특수 보상을 발견했다.",gold:140,materials:26,item,heroUpdates};
  }
  if(environment==="unstable" && focus>=66 && roll<.5){
    const gain=45+Math.round(focus*.2);
    party.forEach(h=>touch(h.id,{hpDelta:-4,tendencies:{focus:clamp(h.tendencies.focus+1),bravery:clamp(h.tendencies.bravery+.4)}}));
    return {text:"공명 수정맥: 불안정한 결정을 제어해 많은 자원을 추출했다.",gold:130,materials:gain,heroUpdates};
  }

  party.forEach(h=>heroUpdates[h.id]={});
  const touch=(id:string,update:EventUpdate)=>{
    const prev=heroUpdates[id]||{};
    heroUpdates[id]={...prev,hpDelta:(prev.hpDelta||0)+(update.hpDelta||0),tendencies:{...(prev.tendencies||{}),...(update.tendencies||{})}};
  };

  if(curiosity>=70 && roll<.42){
    const item=randomGeneralItem(floor+3);
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+.5),greed:clamp(h.tendencies.greed+.2)}}));
    return {text:"봉인된 제단: 호기심이 봉인을 풀어 추가 장비를 발견했다.",gold:120,materials:18,item,heroUpdates};
  }

  if(greed>=70 && roll<.68){
    const reward=260+Math.round(greed*.9);
    const damage=Math.max(4,Math.round(12+(100-caution)*.12));
    party.forEach(h=>touch(h.id,{hpDelta:-damage,tendencies:{greed:clamp(h.tendencies.greed+.7),caution:clamp(h.tendencies.caution-.3)}}));
    return {text:"탐욕의 보관고: 보상은 컸지만 함정을 밟아 파티가 피해를 입었다.",gold:reward,materials:10,heroUpdates};
  }

  if(bravery>=68 && roll<.5){
    const gain=35+Math.round(bravery*.25);
    party.forEach(h=>touch(h.id,{hpDelta:gain,tendencies:{bravery:clamp(h.tendencies.bravery+.8),survival:clamp(h.tendencies.survival-.2)}}));
    return {text:"불안정한 지맥: 용감하게 통과해 경험과 자원을 챙겼다.",gold:100,materials:gain,heroUpdates};
  }

  if(survival>=65 || caution>=65){
    party.forEach(h=>touch(h.id,{hpDelta:18,tendencies:{caution:clamp(h.tendencies.caution+.5),survival:clamp(h.tendencies.survival+.5)}}));
    return {text:"안전한 우회로: 위험을 피하고 작은 보급품을 확보했다.",gold:90,materials:22,heroUpdates};
  }

  if(cooperation>=70){
    party.forEach(h=>touch(h.id,{hpDelta:12,tendencies:{cooperation:clamp(h.tendencies.cooperation+.7)}}));
    return {text:"무너진 통로: 함께 길을 정리해 자원을 추가로 확보했다.",gold:110,materials:30,heroUpdates};
  }

  party.forEach(h=>touch(h.id,{hpDelta:8,tendencies:{curiosity:clamp(h.tendencies.curiosity+.4)}}));
  return {text:"낡은 탐사 흔적: 큰 위험 없이 소량의 보급품을 찾았다.",gold:70,materials:14,heroUpdates};
}
