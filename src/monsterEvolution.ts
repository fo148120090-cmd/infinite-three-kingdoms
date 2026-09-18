import type { Monster, MonsterLineage, Grade, Tendencies } from "./dungeonData";

type Branch={focus:string;forms:string[]};
export const monsterEvolutionTrees:Record<string,Branch[]>={
  Slime:[{focus:"absorb",forms:["메가 슬라임","킹 슬라임"]},{focus:"split",forms:["멀티 슬라임","슬라임 콜로니"]},{focus:"poison",forms:["독성 슬라임","데스 슬라임"]},{focus:"mana",forms:["마나 슬라임","아케인 슬라임"]}],
  Goblin:[{focus:"combat",forms:["홉고블린","고블린 전사왕"]},{focus:"command",forms:["고블린 대장","고블린 족장"]},{focus:"greed",forms:["고블린 도적","고블린 암살자"]},{focus:"magic",forms:["고블린 주술사","대주술사"]}],
  Kobold:[{focus:"trap",forms:["공병 코볼트","함정 장인"]},{focus:"combat",forms:["코볼트 전사","코볼트 경비대장"]},{focus:"scout",forms:["코볼트 정찰병","코볼트 사냥꾼"]},{focus:"command",forms:["코볼트 족장","대족장"]}],
  Gnoll:[{focus:"hunt",forms:["사냥 놀","늑대 놀"]},{focus:"combat",forms:["전투 놀","놀 전쟁군주"]},{focus:"command",forms:["놀 주술사","놀 족장"]}],
  Orc:[{focus:"combat",forms:["오크 전사","오크 챔피언"]},{focus:"defense",forms:["오크 수호자","철벽 오크"]},{focus:"command",forms:["오크 족장","대족장"]},{focus:"berserk",forms:["오크 광전사","학살자"]}],
  Lizardman:[{focus:"hunt",forms:["리자드맨 사냥꾼","리자드맨 전사"]},{focus:"poison",forms:["독 리자드","맹독 리자드"]},{focus:"aquatic",forms:["수중 리자드","심해 리자드"]},{focus:"command",forms:["리자드 장로","리자드 왕"]}],
  Naga:[{focus:"combat",forms:["나가 전사","나가 장군"]},{focus:"poison",forms:["독술사 나가","맹독의 주인"]},{focus:"magic",forms:["나가 마도사","나가 대마도사"]},{focus:"command",forms:["여왕의 호위","나가 여왕"]}],
  Harpy:[{focus:"speed",forms:["바람 하피","폭풍 하피"]},{focus:"combat",forms:["전투 하피","하피 전사장"]},{focus:"mental",forms:["사이렌 하피","매혹의 하피"]},{focus:"command",forms:["하피 여왕"] .slice(0,2)}],
  Uruk:[{focus:"soldier",forms:["우르크 베테랑","우르크 챔피언"]},{focus:"officer",forms:["우르크 지휘관","우르크 장군"]},{focus:"armor",forms:["중장 우르크","철갑군"]},{focus:"command",forms:["우르크 전쟁대장","우르크 전쟁군주"]}],
  Ogre:[{focus:"strength",forms:["거대 오거","오거 왕"]},{focus:"defense",forms:["장갑 오거","오거 요새"]},{focus:"berserk",forms:["광폭 오거","오거 파괴자"]}],
  Arachne:[{focus:"hunt",forms:["사냥 거미","살인 거미"]},{focus:"poison",forms:["독거미","맹독 아라크네"]},{focus:"web",forms:["거미줄 장인","둥지 여왕"]},{focus:"command",forms:["아라크네 여왕","고대 여왕"]}],
  Siren:[{focus:"charm",forms:["유혹의 사이렌","매혹의 여왕"]},{focus:"illusion",forms:["환영 사이렌","악몽 사이렌"]},{focus:"control",forms:["정신의 사이렌","정신 지배자"]},{focus:"song",forms:["고대 사이렌","심해의 여왕"]}],
  Darkworm:[{focus:"ambush",forms:["암흑벌레","밤의 벌레"]},{focus:"size",forms:["대형 다크웜","고대 웜"]},{focus:"mana",forms:["마나 웜","공허 웜"]},{focus:"territory",forms:["던전 웜","심연의 웜"]}],
  Demon:[{focus:"war",forms:["중급 악마","고급 악마"]},{focus:"flame",forms:["화염 악마","화염 군주"]},{focus:"domination",forms:["지배 악마","악마 군주"]},{focus:"illusion",forms:["환영 악마","공포의 악마"]},{focus:"death",forms:["사령 악마","죽음의 대공"]}]
};

const focusForAction=(action:string,species?:string):string=>{
  if(action.includes("분열"))return "split";
  if(action.includes("흡수"))return "absorb";
  if(action.includes("함정"))return species==="Kobold"?"trap":"greed";
  if(action.includes("거미줄"))return "web";
  if(action.includes("무리 사냥"))return "hunt";
  if(action.includes("공격")||action.includes("추격")){
    if(species==="Uruk")return "soldier";
    if(species==="Ogre")return "strength";
    return "combat";
  }
  if(action.includes("전투 함성"))return "command";
  if(action.includes("측면 습격"))return "hunt";
  if(action.includes("급강하"))return "speed";
  if(action.includes("독성 압박"))return "poison";
  if(action.includes("매혹"))return "charm";
  if(action.includes("대지 강타"))return "strength";
  if(action.includes("회피 기동")||action.includes("후퇴"))return "survival";
  if(action.includes("역할 분석"))return species==="Demon"?"domination":"officer";
  if(action.includes("지휘")||action.includes("보스 패턴")||action.includes("영역 지배"))return "command";
  if(action.includes("광역"))return "magic";
  if(action.includes("광폭화"))return "berserk";
  if(action.includes("대기"))return "defense";
  if(action.includes("사격"))return "combat";
  return "combat";
};

export function emptyLineage(id:string,species:string):MonsterLineage{
  return {id,species,level:1,experience:0,focus:{},evolutionStage:0,evolutionPath:[]};
}

export function evolveLineage(lineage:MonsterLineage):MonsterLineage{
  const branches=monsterEvolutionTrees[lineage.species]||[];
  const current=Math.floor(lineage.evolutionStage/1);
  const eligible=branches
    .map(b=>({...b,score:(lineage.focus[b.focus]||0)}))
    .sort((a,b)=>b.score-a.score);
  const best=eligible[0];
  if(!best||best.score<4)return lineage;
  const desiredStage=Math.min(2,lineage.evolutionStage+1);
  const form=best.forms[desiredStage-1];
  if(!form||lineage.evolutionStage>=2)return lineage;
  return {...lineage,evolutionStage:desiredStage,evolutionPath:[...lineage.evolutionPath,form],lastMemory:"행동 경향 "+best.focus+" 누적"};
}

export function recordLineage(lineage:MonsterLineage,action:string,won:boolean):MonsterLineage{
  const focus=focusForAction(action,lineage.species);
  const next={...lineage,focus:{...lineage.focus},experience:lineage.experience+(won?2:1)};
  next.focus[focus]=(next.focus[focus]||0)+(won?1.4:.6);
  next.level=Math.max(1,1+Math.floor(next.experience/10));
  return evolveLineage(next);
}

export function applyLineage(monster:Monster,lineage?:MonsterLineage):Monster{
  if(!lineage||lineage.evolutionStage===0)return monster;
  const form=lineage.evolutionPath[lineage.evolutionPath.length-1];
  const stat=1+(lineage.evolutionStage*.08);
  const tendencies:Tendencies={...monster.tendencies};
  Object.entries(lineage.focus).forEach(([k,v])=>{
    const map:Record<string,keyof Tendencies>={combat:"aggression",soldier:"aggression",officer:"focus",armor:"caution",command:"cooperation",survival:"survival",magic:"focus",ambush:"pursuit",defense:"caution",strength:"aggression",split:"cooperation",absorb:"aggression",poison:"focus",mana:"focus",greed:"greed",trap:"caution",scout:"pursuit",hunt:"pursuit",berserk:"aggression",aquatic:"survival",speed:"bravery",mental:"focus",charm:"focus",illusion:"caution",control:"cooperation",song:"focus",web:"caution",war:"aggression",flame:"aggression",domination:"cooperation",size:"aggression",territory:"caution",death:"survival"};
    const key=map[k];
    if(key)tendencies[key]=Math.min(100,tendencies[key]+Math.min(12,v));
  });
  const evolutionFocus=Object.entries(lineage.focus).sort((a,b)=>b[1]-a[1])[0]?.[0];
  return {...monster,name:form?monster.name+" · "+form:monster.name,level:Math.max(monster.level,lineage.level),evolutionFocus,
    hp:Math.round(monster.hp*stat),maxHp:Math.round(monster.maxHp*stat),attack:Math.round(monster.attack*stat),
    defense:Math.round(monster.defense*stat),tendencies};
}

export function evolutionActionBonus(lineage:MonsterLineage|undefined,action:string):number{
  if(!lineage||lineage.evolutionStage===0)return 0;
  const focus=Object.entries(lineage.focus).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const stage=lineage.evolutionStage;
  const match:Record<string,string[]>={
    split:["분열"],absorb:["일반 공격"],poison:["독성 압박"],mana:["광역 마법"],
    combat:["일반 공격","추격"],command:["전투 함성","지휘 명령","보스 패턴"],greed:["함정 투척","일반 공격"],
    trap:["매복 함정"],scout:["추격"],hunt:["무리 사냥","측면 습격","굴 파기 기습"],defense:["후퇴","회피 기동"],
    berserk:["광폭화"],aquatic:["측면 습격"],magic:["역할 분석","광역 마법"],speed:["급강하"],
    mental:["매혹"],charm:["매혹"],illusion:["매혹"],control:["매혹"],song:["매혹"],
    soldier:["일반 공격","연계 공격"],officer:["지휘 명령"],armor:["전투 함성"],
    strength:["대지 강타","일반 공격"],web:["거미줄"],war:["일반 공격","광폭화"],
    flame:["독성 압박"],domination:["역할 분석"],ambush:["굴 파기 기습"],size:["대지 강타"],
    territory:["영역 지배"],death:["역할 분석"]
  };
  return (focus&&match[focus]?.some(x=>action===x))?stage*10:0;
}

export function evolutionHint(lineage:MonsterLineage):string{
  const branches=monsterEvolutionTrees[lineage.species]||[];
  const best=branches.slice().sort((a,b)=>(lineage.focus[b.focus]||0)-(lineage.focus[a.focus]||0))[0];
  return best?`${best.focus} 계열 · 다음 진화까지 ${Math.max(0,4-(lineage.focus[best.focus]||0)).toFixed(1)}`:"아직 뚜렷한 진화 방향 없음";
}
