import type { Hero, Item, Tendencies } from "./dungeonData";
import { randomGeneralItem } from "./dungeonData";

type EventUpdate={hp?:number;tendencies?:Partial<Tendencies>};
export type DungeonEventOutcome={
  text:string;
  gold:number;
  materials:number;
  item?:Item;
  heroUpdates:Record<string,EventUpdate>;
};

const clamp=(n:number)=>Math.max(0,Math.min(100,n));

export function resolveDungeonEvent(heroes:Hero[],partyIds:string[],floor:number):DungeonEventOutcome{
  const party=heroes.filter(h=>partyIds.includes(h.id));
  const avg=(key:keyof Tendencies)=>party.length?party.reduce((n,h)=>n+h.tendencies[key],0)/party.length:0;
  const curiosity=avg("curiosity"), caution=avg("caution"), greed=avg("greed"), bravery=avg("bravery"), survival=avg("survival"), cooperation=avg("cooperation");
  const roll=Math.random();
  const heroUpdates:Record<string,EventUpdate>={};

  party.forEach(h=>heroUpdates[h.id]={});
  const touch=(id:string,update:EventUpdate)=>{
    const prev=heroUpdates[id]||{};
    heroUpdates[id]={...prev,hp:prev.hp===undefined?update.hp:Math.min(prev.hp,update.hp||prev.hp),tendencies:{...(prev.tendencies||{}),...(update.tendencies||{})}};
  };

  if(curiosity>=70 && roll<.42){
    const item=randomGeneralItem(floor+3);
    party.forEach(h=>touch(h.id,{tendencies:{curiosity:clamp(h.tendencies.curiosity+.5),greed:clamp(h.tendencies.greed+.2)}}));
    return {text:"봉인된 제단: 호기심이 봉인을 풀어 추가 장비를 발견했다.",gold:120,materials:18,item,heroUpdates};
  }

  if(greed>=70 && roll<.68){
    const reward=260+Math.round(greed*.9);
    const damage=Math.max(4,Math.round(12+(100-caution)*.12));
    party.forEach(h=>touch(h.id,{hp:-damage,tendencies:{greed:clamp(h.tendencies.greed+.7),caution:clamp(h.tendencies.caution-.3)}}));
    return {text:"탐욕의 보관고: 보상은 컸지만 함정을 밟아 파티가 피해를 입었다.",gold:reward,materials:10,heroUpdates};
  }

  if(bravery>=68 && roll<.5){
    const gain=35+Math.round(bravery*.25);
    party.forEach(h=>touch(h.id,{hp:gain,tendencies:{bravery:clamp(h.tendencies.bravery+.8),survival:clamp(h.tendencies.survival-.2)}}));
    return {text:"불안정한 지맥: 용감하게 통과해 경험과 자원을 챙겼다.",gold:100,materials:gain,heroUpdates};
  }

  if(survival>=65 || caution>=65){
    party.forEach(h=>touch(h.id,{hp:18,tendencies:{caution:clamp(h.tendencies.caution+.5),survival:clamp(h.tendencies.survival+.5)}}));
    return {text:"안전한 우회로: 위험을 피하고 작은 보급품을 확보했다.",gold:90,materials:22,heroUpdates};
  }

  if(cooperation>=70){
    party.forEach(h=>touch(h.id,{hp:12,tendencies:{cooperation:clamp(h.tendencies.cooperation+.7)}}));
    return {text:"무너진 통로: 함께 길을 정리해 자원을 추가로 확보했다.",gold:110,materials:30,heroUpdates};
  }

  party.forEach(h=>touch(h.id,{hp:8,tendencies:{curiosity:clamp(h.tendencies.curiosity+.4)}}));
  return {text:"낡은 탐사 흔적: 큰 위험 없이 소량의 보급품을 찾았다.",gold:70,materials:14,heroUpdates};
}
