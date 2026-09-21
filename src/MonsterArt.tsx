import React from "react";

type Props={species?:string;grade?:string;size?:number};

const palette:Record<string,{body:string;accent:string;eye:string}>={
  Goblin:{body:"#5f7f55",accent:"#9bb56b",eye:"#f5d76e"}, Kobold:{body:"#725947",accent:"#b88762",eye:"#f1c56a"},
  Slime:{body:"#4b9b9a",accent:"#8be0d5",eye:"#dffcff"}, Gnoll:{body:"#8a6650",accent:"#c59a6f",eye:"#ffd36b"},
  Orc:{body:"#56775b",accent:"#a7c47c",eye:"#ffcf67"}, Lizardman:{body:"#4f826c",accent:"#9cc98e",eye:"#d9ff9c"},
  Naga:{body:"#5f6e96",accent:"#a9b9e4",eye:"#f5dc76"}, Harpy:{body:"#715f8d",accent:"#c3a8dc",eye:"#ffe6a3"},
  Uruk:{body:"#495e55",accent:"#b3c48c",eye:"#ffd16b"}, Ogre:{body:"#78634e",accent:"#c8a679",eye:"#ffbd63"},
  Arachne:{body:"#593f66",accent:"#b786c6",eye:"#ffe7a0"}, Siren:{body:"#456f86",accent:"#9dd0dc",eye:"#e9ffff"},
  Darkworm:{body:"#4d4b5e",accent:"#aaa1c5",eye:"#ff9f6e"}, Demon:{body:"#6d3f4d",accent:"#d17b83",eye:"#ffe07b"},
  Dragon:{body:"#7b4e46",accent:"#d49b72",eye:"#ffe16b"}, Wolf:{body:"#596273",accent:"#aab5c7",eye:"#f6d16a"},
  Skeleton:{body:"#8b8778",accent:"#d9d3bd",eye:"#8ff0ff"}
};

export default function MonsterArt({species="Goblin",grade="Normal",size=42}:Props){
  const normalized=String(species||"Goblin");
  const key=/dragon|drake|용|드래곤/i.test(normalized)?"Dragon":/wolf|늑대/i.test(normalized)?"Wolf":/skeleton|undead|해골|언데드/i.test(normalized)?"Skeleton":normalized;
  const p=palette[key]||palette.Goblin;
  const boss=grade==="Boss", elite=grade==="Elite", named=grade==="Named";
  const frameColor=boss?"#f2c76d":elite?"#d6b86a":named?"#b9c8ff":"#64748b";

  return <svg className={"monster-art-svg monster-art-"+key.toLowerCase()+" monster-art-grade-"+String(grade).toLowerCase()} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={species+" monster"}>
    <defs><linearGradient id="monsterGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.accent}/><stop offset="1" stopColor={p.body}/></linearGradient></defs>
    <circle cx="32" cy="32" r={boss?30:elite?29:named?28:27} fill="none" stroke={frameColor} strokeWidth={boss?2.2:elite?1.8:named?1.5:1} opacity={boss?.95:elite?.85:named?.72:.42}/>
    {boss&&<circle cx="32" cy="32" r="25" fill="none" stroke="#fff0b0" strokeWidth=".7" strokeDasharray="2 3" opacity=".8"/>}
    {elite&&<path d="M9 32h6M49 32h6M32 9v6M32 49v6" stroke="#e8c978" strokeWidth="1.8" strokeLinecap="round"/>}
    {named&&<path d="M13 13l5 5M51 13l-5 5M13 51l5-5M51 51l-5-5" stroke="#c9d5ff" strokeWidth="1.5" strokeLinecap="round"/>}

    <path className="monster-aura" d="M10 51 Q12 27 23 20 Q32 13 41 20 Q53 28 54 51 Q45 57 32 57 Q19 57 10 51Z" fill="url(#monsterGlow)" stroke={boss?"#f0c96b":"#1b2230"} strokeWidth={boss?2.4:1.5}/>

    {key==="Arachne"||key==="Darkworm"
      ? <g stroke={p.accent} strokeLinecap="round" strokeWidth="3"><path d="M14 35L4 27M14 41L3 40M17 27L8 15M50 35L60 27M50 41L61 40M47 27L56 15"/></g>
      : key==="Dragon"
      ? <g fill={p.body} stroke="#1b2230" strokeWidth="1.4"><path d="M18 27L7 8L25 16L32 7L39 16L57 8L46 27Z"/><path d="M23 18L17 8L27 13M41 18L47 8L37 13" fill={p.accent}/></g>
      : key==="Wolf"
      ? <g fill={p.body} stroke="#1b2230" strokeWidth="1.4"><path d="M16 28L7 8L24 16L32 12L40 16L57 8L48 28Z"/><path d="M19 18L13 11L24 16M45 18L51 11L40 16" fill={p.accent}/></g>
      : key==="Skeleton"
      ? <g fill={p.body} stroke="#1b2230" strokeWidth="1.4"><path d="M16 27L12 10L25 17L32 8L39 17L52 10L48 27Z"/><path d="M21 20L27 15L32 20L37 15L43 20" fill={p.accent}/></g>
      : <g fill={p.body} stroke="#1b2230" strokeWidth="1.4"><path d="M18 25L10 11L25 18L32 14L39 18L54 11L46 25Z"/><path d="M22 21L27 17M42 21L37 17" fill="none" stroke={p.accent} strokeWidth="2"/></g>}

    {key==="Demon"||key==="Orc"||key==="Uruk" ? <path d="M20 25L25 12L31 23L39 12L44 25" fill={p.accent} stroke="#1b2230" strokeWidth="1.2"/> : null}
    <ellipse cx="24" cy="33" rx="5" ry="4" fill={key==="Skeleton"?"#d9d3bd":"#101522"}/>
    <ellipse cx="40" cy="33" rx="5" ry="4" fill={key==="Skeleton"?"#d9d3bd":"#101522"}/>
    <circle className="monster-eye-glow" cx="24" cy="33" r={boss?3:2.3} fill={p.eye}/><circle className="monster-eye-glow" cx="40" cy="33" r={boss?3:2.3} fill={p.eye}/>
    {key==="Demon"||key==="Dragon"||key==="Arachne"||boss?<path className="monster-aura-ring" d="M12 32 Q16 10 32 8 Q48 10 52 32 Q48 52 32 56 Q16 52 12 32Z" fill="none" stroke={p.eye} strokeWidth={boss?1.8:1.1} opacity={boss?.7:.32}/>:null}
    <path d={key==="Skeleton"?"M22 44L27 47L32 44L37 47L42 44":"M24 43 Q32 48 40 43"} fill="none" stroke={p.accent} strokeWidth="2" strokeLinecap="round"/>

    {elite&&<path d="M32 7L35 13L42 14L37 19L38 26L32 22L26 26L27 19L22 14L29 13Z" fill="#d6b86a" opacity=".9"/>}
    {named&&<circle cx="32" cy="8" r="4" fill="#b9c8ff" stroke="#eef3ff" strokeWidth="1"/>}
    {boss&&<path d="M16 17L21 5L29 14L35 4L43 14L49 5L50 22" fill="none" stroke="#e5c46d" strokeWidth="2.4" strokeLinejoin="round"/>}
    {boss&&<path d="M18 57 Q32 61 46 57" fill="none" stroke="#f2c76d" strokeWidth="1.8" opacity=".8"/>}
    <path d="M17 52 Q32 47 47 52" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2"/>
  </svg>;
}
