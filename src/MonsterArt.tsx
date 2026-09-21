import React from "react";

type Props={species?:string;grade?:string;size?:number};

const palette:Record<string,{body:string;accent:string;eye:string}>={
  Goblin:{body:"#5f7f55",accent:"#9bb56b",eye:"#f5d76e"},
  Kobold:{body:"#725947",accent:"#b88762",eye:"#f1c56a"},
  Slime:{body:"#4b9b9a",accent:"#8be0d5",eye:"#dffcff"},
  Gnoll:{body:"#8a6650",accent:"#c59a6f",eye:"#ffd36b"},
  Orc:{body:"#56775b",accent:"#a7c47c",eye:"#ffcf67"},
  Lizardman:{body:"#4f826c",accent:"#9cc98e",eye:"#d9ff9c"},
  Naga:{body:"#5f6e96",accent:"#a9b9e4",eye:"#f5dc76"},
  Harpy:{body:"#715f8d",accent:"#c3a8dc",eye:"#ffe6a3"},
  Uruk:{body:"#495e55",accent:"#b3c48c",eye:"#ffd16b"},
  Ogre:{body:"#78634e",accent:"#c8a679",eye:"#ffbd63"},
  Arachne:{body:"#593f66",accent:"#b786c6",eye:"#ffe7a0"},
  Siren:{body:"#456f86",accent:"#9dd0dc",eye:"#e9ffff"},
  Darkworm:{body:"#4d4b5e",accent:"#aaa1c5",eye:"#ff9f6e"},
  Demon:{body:"#6d3f4d",accent:"#d17b83",eye:"#ffe07b"},
  Dragon:{body:"#7b4e46",accent:"#d49b72",eye:"#ffe16b"},
  Wolf:{body:"#596273",accent:"#aab5c7",eye:"#f6d16a"},
  Skeleton:{body:"#8b8778",accent:"#d9d3bd",eye:"#8ff0ff"}
};

export default function MonsterArt({species="Goblin",grade="Normal",size=42}:Props){
  const normalized=String(species||"Goblin");\n  const key=/dragon|drake|용|드래곤/i.test(normalized)?"Dragon":/wolf|늑대/i.test(normalized)?"Wolf":/skeleton|undead|해골|언데드/i.test(normalized)?"Skeleton":normalized;\n  const p=palette[key]||palette.Goblin;
  const boss=grade==="Boss", elite=grade==="Elite", named=grade==="Named";
  return <svg className="monster-art-svg" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={species+" monster"}>
    <defs><linearGradient id="monsterGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.accent}/><stop offset="1" stopColor={p.body}/></linearGradient></defs>
    <path d="M10 51 Q12 27 23 20 Q32 13 41 20 Q53 28 54 51 Q45 57 32 57 Q19 57 10 51Z" fill="url(#monsterGlow)" stroke={boss?"#f0c96b":"#1b2230"} strokeWidth={boss?2.4:1.5}/>
    {species==="Arachne"||species==="Darkworm"
      ? <path d="M14 35L5 29M14 41L4 42M50 35L59 29M50 41L60 42M18 27L11 17M46 27L53 17" stroke={p.accent} strokeWidth="3" strokeLinecap="round"/>
      : key==="Dragon"\n        ? <path d="M18 27L8 12L25 18L32 10L39 18L56 12L46 27" fill={p.body} stroke="#1b2230" strokeWidth="1.4"/>\n        : key==="Wolf"\n          ? <path d="M17 27L9 9L25 17L32 13L39 17L55 9L47 27" fill={p.body} stroke="#1b2230" strokeWidth="1.4"/>\n          : key==="Skeleton"\n            ? <path d="M17 27L13 14L25 19L32 12L39 19L51 14L47 27" fill={p.body} stroke="#1b2230" strokeWidth="1.4"/>\n            : <path d="M18 25L11 13L25 19M46 25L53 13L39 19" fill={p.body} stroke="#1b2230" strokeWidth="1.4"/>}
    {key==="Demon"||key==="Orc"||key==="Uruk"
      ? <path d="M20 25L25 12L31 23L39 12L44 25" fill={p.accent} stroke="#1b2230" strokeWidth="1.2"/>
      : null}
    <ellipse cx="24" cy="33" rx="5" ry="4" fill={key==="Skeleton"?"#d9d3bd":"#101522"}/><ellipse cx="40" cy="33" rx="5" ry="4" fill={key==="Skeleton"?"#d9d3bd":"#101522"}/>
    <circle cx="24" cy="33" r="2" fill={p.eye}/><circle cx="40" cy="33" r="2" fill={p.eye}/>
    <path d={key==="Skeleton"?"M22 44L27 47L32 44L37 47L42 44":"M24 43 Q32 48 40 43"} fill="none" stroke={p.accent} strokeWidth="2" strokeLinecap="round"/>
    {elite&&<path d="M32 7L35 13L42 14L37 19L38 26L32 22L26 26L27 19L22 14L29 13Z" fill="#d6b86a" opacity=".9"/>}
    {named&&<circle cx="32" cy="8" r="4" fill="#b9c8ff" stroke="#eef3ff" strokeWidth="1"/>}
    {boss&&<path d="M16 17L21 5L29 14L35 4L43 14L49 5L50 22" fill="none" stroke="#e5c46d" strokeWidth="2.4" strokeLinejoin="round"/>}
    <path d="M17 52 Q32 47 47 52" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2"/>
  </svg>;
}
