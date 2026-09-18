import type { Hero, Memory, Relationship } from "./dungeonData";

export function relationshipOf(hero:Hero, targetId:string):Relationship{
  return hero.relationships?.[targetId]||{trust:50,respect:50,fear:0,bond:0};
}

export function relationshipFromMap(map:Record<string,Relationship>|undefined,targetId:string):Relationship{
  return map?.[targetId]||{trust:50,respect:50,fear:0,bond:0};
}

export function adjustRelationship(hero:Hero,targetId:string,delta:{trust?:number;respect?:number;fear?:number;bond?:number}):Hero{
  const current=relationshipOf(hero,targetId);
  const next:Relationship={
    trust:clamp(current.trust+(delta.trust||0)),
    respect:clamp(current.respect+(delta.respect||0)),
    fear:clamp(current.fear+(delta.fear||0)),
    bond:clamp(current.bond+(delta.bond||0))
  };
  return {...hero,relationships:{...(hero.relationships||{}),[targetId]:next}};
}

export function remember(hero:Hero,text:string,weight=1):Hero{
  const memory:Memory={text,weight,createdAt:Date.now()};
  return {...hero,memories:[memory,...(hero.memories||[])].slice(0,12)};
}

export function bondAfterBattle(heroes:Hero[],partyIds:string[],deadIds:string[]):Hero[]{
  const inParty=heroes.filter(h=>partyIds.includes(h.id));
  const survivors=inParty.filter(h=>h.hp>0 && !deadIds.includes(h.id));
  return heroes.map(hero=>{
    if(!partyIds.includes(hero.id))return hero;
    let next=hero;
    for(const ally of survivors){
      if(ally.id===hero.id)continue;
      next=adjustRelationship(next,ally.id,{trust:2,respect:1,bond:2});
    }
    for(const deadId of deadIds){
      if(deadId===hero.id)continue;
      const dead=heroes.find(h=>h.id===deadId);
      if(dead){
        next=adjustRelationship(next,dead.id,{trust:Math.max(-1,-0.5),fear:2,bond:3});
        next=remember(next,dead.name+"의 전사 · 동료를 잃은 기억",2);
        const t={...next.tendencies};
        t.survival=clamp(t.survival+0.8);
        t.aggression=clamp(t.aggression+0.5);
        next={...next,tendencies:t};
      }
    }
    return next;
  });
}

function clamp(n:number){return Math.max(0,Math.min(100,n));}
