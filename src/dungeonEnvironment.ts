import type { BattleUnit, RoomKind } from "./dungeonData";

export type EnvironmentKind = "dark" | "narrow" | "toxic" | "water" | "unstable";

export const environmentInfo:Record<EnvironmentKind,{name:string;detail:string}> = {
  dark:{name:"암흑 동굴",detail:"시야가 짧아 원거리 행동의 안정성이 떨어진다."},
  narrow:{name:"좁은 통로",detail:"이동 공간이 제한되어 근접 압박과 추격이 강해진다."},
  toxic:{name:"독성 지맥",detail:"시간이 지날수록 전투원이 피해를 입고 생존 판단이 중요해진다."},
  water:{name:"지하 수로",detail:"리자드맨은 기동력을 살리지만 다른 종족은 이동이 둔해진다."},
  unstable:{name:"불안정 지형",detail:"페이즈가 진행될수록 전장이 위험해진다."}
};

export function environmentFor(floor:number,room:RoomKind,mode:"dungeon"|"defense"|"raid"):EnvironmentKind{
  if(mode==="raid")return floor%2===0?"unstable":"narrow";
  if(mode==="defense")return floor%3===0?"toxic":floor%3===1?"narrow":"dark";
  const pool:EnvironmentKind[]=["dark","narrow","toxic","water","unstable"];
  return pool[(floor+(room==="elite"?2:0)+(room==="boss"?3:0))%pool.length];
}

export function environmentDecisionBonus(a:BattleUnit,env:EnvironmentKind):number{
  const ranged=a.job==="Archer"||a.job==="Mage";
  let bonus=0;
  if(env==="dark")bonus+=ranged?-8:a.tendencies.caution*.05;
  if(env==="narrow")bonus+=(a.tendencies.aggression+a.tendencies.pursuit)*.06;
  if(env==="toxic")bonus+=a.tendencies.survival*.08+a.tendencies.caution*.05;
  if(env==="water")bonus+=a.species==="Lizardman"?18:(a.team==="player"?-3:0);
  if(env==="unstable")bonus+=a.tendencies.focus*.06;
  return bonus;
}

export function environmentTick(units:BattleUnit[],env:EnvironmentKind,tick:number,phase:number):string|undefined{
  if(env==="toxic"&&tick%5===0){
    let changed=0;
    units.forEach(u=>{if(u.alive){u.hp=Math.max(0,u.hp-3);u.alive=u.hp>0;changed++;}});
    return changed?"독성 지맥 · 생존 중인 전투원 "+changed+"명에게 지속 피해":"독성 지맥 · 전투 종료";
  }
  if(env==="water"){
    units.forEach(u=>{if(u.alive)u.speed=Math.max(.35,u.speed+(u.species==="Lizardman"?.03:-.01));});
  }
  if(env==="unstable"&&tick%8===0){
    const damage=phase>=3?7:phase>=2?5:3;
    units.forEach(u=>{if(u.alive&&Math.random()<.45){u.hp=Math.max(0,u.hp-damage);u.alive=u.hp>0;}});
    return "불안정 지형 · 균열 충격 "+damage+" 피해";
  }
  return undefined;
}
