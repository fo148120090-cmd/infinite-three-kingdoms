type MonsterAction={name:string;detail:string;bonus:number};

export function monsterActions(species:string,grade?:string,mutation?:string):MonsterAction[]{
  const out:MonsterAction[]=[];
  const add=(name:string,detail:string,bonus:number)=>out.push({name,detail,bonus});
  if(species==="Slime")add("분열","체력이 높을 때 자신을 나누어 전장을 채움",24);
  if(species==="Goblin")add("함정 투척","약한 지점에 함정을 던져 적의 움직임을 제한",24);
  if(species==="Kobold")add("매복 함정","좁은 통로에서 접근한 적을 노려본다",26);
  if(species==="Gnoll")add("무리 사냥","부상당한 대상을 여러 개체가 집중한다",29);
  if(species==="Orc")add("전투 함성","주변 아군의 공격 성향을 끌어올린다",25);
  if(species==="Lizardman")add("측면 습격","전열을 우회해 후방의 약한 대상을 노린다",27);
  if(species==="Naga")add("독성 압박","상대를 약화시키는 공격을 선택한다",28);
  if(species==="Harpy")add("급강하","이동 거리를 무시하고 먼 대상을 덮친다",30);
  if(species==="Uruk")add("지휘 명령","규율을 세워 동료의 집중 공격을 유도한다",30);
  if(species==="Ogre")add("대지 강타","주변 여러 적에게 강한 광역 피해를 준다",32);
  if(species==="Arachne")add("거미줄","적의 속도를 떨어뜨려 통로를 봉쇄한다",29);
  if(species==="Siren")add("매혹","가장 집중력이 낮은 적의 판단을 흔든다",28);
  if(species==="Darkworm")add("굴 파기 기습","거리를 무시하고 약한 적에게 갑자기 접근한다",31);
  if(species==="Demon")add("역할 분석","지원 역할을 가진 적을 우선해서 압박한다",34);
  if(grade==="Boss")add("영역 지배","현재 페이즈에 맞는 전장 압박 행동을 선택한다",36);
  if(mutation==="광폭")add("광폭화","공격력을 끌어올리고 후퇴 성향을 줄인다",24);
  if(mutation==="기민")add("회피 기동","위험할 때 빠르게 거리를 벌린다",22);
  if(mutation==="무리")add("연계 공격","같은 편과 함께 행동할 때 추가 압박을 만든다",24);
  if(mutation==="집중")add("약점 추적","체력이 낮은 적에게 우선순위를 집중한다",25);
  return out;
}
