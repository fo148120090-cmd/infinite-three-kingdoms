export type FactionId = "wei" | "shu" | "wu" | "han";

export type Faction = {
  id: FactionId;
  name: string;
  ruler: string;
  color: string;
  doctrine: string;
  description: string;
  bonuses: string[];
};

export type General = {
  id: string;
  name: string;
  faction: FactionId;
  role: "군주" | "맹장" | "책사" | "궁장" | "내정";
  war: number;
  intellect: number;
  command: number;
  politics: number;
  charisma: number;
  loyalty: number;
  bond: string[];
  skill: string;
};

export type City = {
  id: string;
  name: string;
  owner: FactionId | "neutral";
  region: string;
  income: number;
  defense: number;
  garrison: number;
  special?: string;
};

export const factions: Faction[] = [
  {id:"wei",name:"위",ruler:"조조",color:"#7b8fa8",doctrine:"정밀한 지휘와 병참",description:"강한 행정력과 지휘 체계를 기반으로 장기전을 수행합니다.",bonuses:["금 수입 +10%","궁병 명중 +5%","성 수비 +8%"]},
  {id:"shu",name:"촉",ruler:"유비",color:"#6f9b76",doctrine:"의리와 협동",description:"장수 간 유대와 협동 행동이 강해질수록 전투력이 상승합니다.",bonuses:["관계 상승 +15%","협동 AI +8","회복 효과 +5%"]},
  {id:"wu",name:"오",ruler:"손권",color:"#a57d55",doctrine:"기동과 수전",description:"기동력과 원거리 압박을 이용해 전장을 유리하게 만듭니다.",bonuses:["속도 +6%","궁병 사거리 +0.4","수로 지역 보너스"]},
  {id:"han",name:"한실",ruler:"헌제",color:"#a88a5b",doctrine:"중립 조정",description:"세력 확장보다 외교와 인재 영입에 집중하는 중립 세력입니다.",bonuses:["모집 비용 -10%","외교 영향력 +12","이벤트 보상 +5%"]}
];

export const generals: General[] = [
  {id:"cao-cao",name:"조조",faction:"wei",role:"군주",war:72,intellect:96,command:94,politics:93,charisma:82,loyalty:100,bond:["xiahou-dun","xun-yu"],skill:"위무지진"},
  {id:"xiahou-dun",name:"하후돈",faction:"wei",role:"맹장",war:92,intellect:62,command:86,politics:48,charisma:76,loyalty:96,bond:["cao-cao"],skill:"독안의 맹격"},
  {id:"xun-yu",name:"순욱",faction:"wei",role:"책사",war:34,intellect:98,command:76,politics:96,charisma:78,loyalty:94,bond:["cao-cao"],skill:"왕좌의 책략"},
  {id:"liu-bei",name:"유비",faction:"shu",role:"군주",war:68,intellect:82,command:91,politics:86,charisma:99,loyalty:100,bond:["guan-yu","zhang-fei"],skill:"인덕의 결집"},
  {id:"guan-yu",name:"관우",faction:"shu",role:"맹장",war:99,intellect:80,command:94,politics:52,charisma:91,loyalty:100,bond:["liu-bei","zhang-fei"],skill:"청룡의 일격"},
  {id:"zhang-fei",name:"장비",faction:"shu",role:"맹장",war:98,intellect:54,command:88,politics:34,charisma:72,loyalty:99,bond:["liu-bei","guan-yu"],skill:"장판의 포효"},
  {id:"sun-quan",name:"손권",faction:"wu",role:"군주",war:70,intellect:88,command:90,politics:91,charisma:88,loyalty:100,bond:["zhou-yu"],skill:"강동의 결의"},
  {id:"zhou-yu",name:"주유",faction:"wu",role:"책사",war:84,intellect:97,command:93,politics:84,charisma:92,loyalty:96,bond:["sun-quan"],skill:"적벽의 화계"},
  {id:"gan-ning",name:"감녕",faction:"wu",role:"맹장",war:94,intellect:62,command:79,politics:38,charisma:80,loyalty:90,bond:[],skill:"금범의 돌격"},
  {id:"emperor-xian",name:"헌제",faction:"han",role:"군주",war:22,intellect:61,command:42,politics:68,charisma:74,loyalty:100,bond:[],skill:"황실의 칙령"}
];

export const cities: City[] = [
  {id:"luoyang",name:"낙양",owner:"han",region:"중원",income:120,defense:70,garrison:900,special:"황실"},
  {id:"xuchang",name:"허창",owner:"wei",region:"중원",income:150,defense:82,garrison:1200,special:"병참"},
  {id:"chengdu",name:"성도",owner:"shu",region:"익주",income:135,defense:88,garrison:1100,special:"풍요"},
  {id:"jianye",name:"건업",owner:"wu",region:"강동",income:145,defense:86,garrison:1150,special:"수운"},
  {id:"jingzhou",name:"형주",owner:"neutral",region:"형주",income:110,defense:64,garrison:700},
  {id:"hanzhong",name:"한중",owner:"neutral",region:"한중",income:95,defense:78,garrison:650}
];

export const factionOf=(id:FactionId)=>factions.find(f=>f.id===id)!;
export const generalOf=(id:string)=>generals.find(g=>g.id===id);
export const cityOf=(id:string)=>cities.find(c=>c.id===id);

export function recruitCost(g:General, faction:FactionId){
  const discount=faction==="han"?.9:1;
  return Math.max(180,Math.round((280+(g.command+g.charisma)*2)*discount));
}

export function generalPower(g:General){
  return Math.round(g.war*.35+g.intellect*.25+g.command*.25+g.politics*.1+g.charisma*.05);
}

export function cityPower(c:City){
  return Math.round(c.defense+c.garrison/35);
}
