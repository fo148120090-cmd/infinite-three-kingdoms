import { useEffect, useMemo, useState } from "react";
import { cities, factions, generalOf, generals, factionOf, generalPower, recruitCost, type FactionId } from "./threeKingdoms";

type CampaignSave = {
  faction: FactionId;
  recruited: string[];
  influence: number;
  renown: number;
  cityOwners: Record<string, FactionId|"neutral">;
  relations: Record<FactionId, number>;
  turns: number;
};

type Props = {
  gold: number;
  materials: number;
  onSpendGold:(n:number)=>void;
  onSpendMaterials:(n:number)=>void;
  onRewardGold:(n:number)=>void;
  onRewardMaterials:(n:number)=>void;
  onDispatch:(cityId:string)=>void;
  onToast:(s:string)=>void;
};

const KEY="three-kingdoms-campaign-v1";
const initial=():CampaignSave=>({
  faction:"wei",
  recruited:["cao-cao"],
  influence:40,
  renown:0,
  cityOwners:Object.fromEntries(cities.map(c=>[c.id,c.owner])),
  relations:{wei:50,shu:45,wu:45,han:60}
});

export default function ThreeKingdoms({gold,materials,onSpendGold,onSpendMaterials,onRewardGold,onRewardMaterials,onDispatch,onToast}:Props){
  const [save,setSave]=useState<CampaignSave>(()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"null");return x?{...initial(),...x}:initial()}catch{return initial()}});
  const [tab,setTab]=useState<"map"|"generals"|"diplomacy">("map");
  const [selected,setSelected]=useState("luoyang");

  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(save)),[save]);

  const faction=factionOf(save.faction);
  const ownedCities=useMemo(()=>cities.filter(c=>save.cityOwners[c.id]===save.faction),[save]);
  const available=generals.filter(g=>g.faction===save.faction);
  const recruited=save.recruited.map(generalOf).filter(Boolean);
  const target=cities.find(c=>c.id===selected)!;
  const targetOwner=save.cityOwners[target.id];
  const enemyPower=target.defense+target.garrison/25;
  const commander=recruited.slice().sort((a,b)=>generalPower(b!)-generalPower(a!))[0];
  const armyPower=(commander?generalPower(commander):40)+ownedCities.length*5+save.renown*.15;

  const chooseFaction=(id:FactionId)=>{
    setSave(s=>({...s,faction:id,recruited:[generals.find(g=>g.faction===id&&g.role==="군주")?.id||"cao-cao"],influence:40,renown:0,cityOwners:Object.fromEntries(cities.map(c=>[c.id,c.owner])),relations:{wei:50,shu:45,wu:45,han:60}}));
    onToast("세력 변경 · "+factionOf(id).name+" · "+factionOf(id).ruler);
  };

  const recruit=(id:string)=>{
    const g=generalOf(id); if(!g||save.recruited.includes(id))return;
    const cost=recruitCost(g,save.faction);
    if(gold<cost){onToast("금이 부족합니다 · "+cost+"G 필요");return;}
    onSpendGold(cost);
    setSave(s=>({...s,recruited:[...s.recruited,id],influence:Math.min(100,s.influence+4)}));
    onToast(g.name+" 영입 완료 · "+cost+"G");
  };

  const conquer=()=>{
    if(targetOwner===save.faction){onToast(target.name+"은 이미 우리 세력의 영지입니다.");return;}
    const cost=55+Math.round(target.defense*.45);
    if(materials<cost){onToast("병참 자원이 부족합니다 · "+cost+" 필요");return;}
    onSpendMaterials(cost);
    const success=armyPower>=enemyPower*.78;
    setSave(s=>{
      const relations={...s.relations};
      if(targetOwner!=="neutral")relations[targetOwner]=Math.max(0,(relations[targetOwner]||40)-8);
      return {...s,
        cityOwners:success?{...s.cityOwners,[target.id]:s.faction}:s.cityOwners,
        renown:Math.max(0,s.renown+(success?12:-3)),
        influence:Math.max(0,Math.min(100,s.influence+(success?7:-5))),
        turns:s.turns+1,
        relations
      };
    });
    if(success){
      const reward=target.income+Math.round(target.garrison/20);
      onRewardGold(reward);
      onToast(target.name+" 정벌 성공 · "+reward+"G 확보");
    }else onToast(target.name+" 정벌 실패 · 병력 재정비 필요");
  };

  const diplomacy=(id:FactionId)=>{
    if(id===save.faction){onToast("우리 세력입니다.");return;}
    if(gold<120){onToast("외교 자금 120G가 필요합니다.");return;}
    onSpendGold(120);
    setSave(s=>({...s,relations:{...s.relations,[id]:Math.min(100,(s.relations[id]||40)+12)},influence:Math.min(100,s.influence+5),turns:s.turns+1}));
    onToast(factionOf(id).name+"과 외교 관계 개선 · 관계 +12");
  };

  return <section className="page" style={{height:"100%",overflow:"auto",padding:"4px 2px"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",marginBottom:10}}>
      <div><span className="eyebrow">THREE KINGDOMS · GRAND STRATEGY</span><h1 style={{margin:"4px 0"}}>천하전략</h1><p className="muted" style={{margin:0}}>세력·장수·도시·외교를 관리하고, 출정 버튼을 누르면 기존 AI 전투 시스템으로 연결됩니다.</p></div>
      <div style={{display:"flex",gap:6}}>{factions.map(f=><button key={f.id} className={save.faction===f.id?"primary-btn":"secondary-btn"} onClick={()=>chooseFaction(f.id)}>{f.name} · {f.ruler}</button>)}</div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1.4fr .6fr",gap:10,marginBottom:10}}>
      <div className="panel" style={{padding:12}}>
        <div style={{display:"flex",gap:6,marginBottom:9}}>{(["map","generals","diplomacy"] as const).map(t=><button key={t} className={tab===t?"nav-on":"secondary-btn"} onClick={()=>setTab(t)}>{t==="map"?"전략 지도":t==="generals"?"장수":"외교"}</button>)}</div>
        {tab==="map"&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>{cities.map(c=>{const owner=save.cityOwners[c.id];const f=owner==="neutral"?undefined:factionOf(owner);return <button key={c.id} onClick={()=>setSelected(c.id)} style={{textAlign:"left",padding:10,border:"1px solid "+(selected===c.id?"#b89955":"#26364f"),borderRadius:10,background:selected===c.id?"#1c1b16":"#101927",color:"#d9e1ef",cursor:"pointer"}}><b>{c.name}</b><small style={{display:"block",color:"#8997ad",marginTop:4}}>{c.region} · {f?.name||"중립"} · 수입 {c.income}G</small><span style={{display:"block",marginTop:5,fontSize:10}}>방어 {c.defense} · 주둔 {c.garrison}</span></button>})}</div>}
        {tab==="generals"&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>{available.map(g=>{const own=save.recruited.includes(g.id);return <div key={g.id} style={{padding:10,border:"1px solid #26364f",borderRadius:10,background:"#101927"}}><b>{g.name}</b><small style={{display:"block",color:"#8997ad"}}>{g.role} · 전투력 {generalPower(g)}</small><div style={{fontSize:9,lineHeight:1.5,margin:"7px 0"}}>무력 {g.war} · 지력 {g.intellect} · 통솔 {g.command}<br/>정치 {g.politics} · 매력 {g.charisma}<br/><span style={{color:"#d3bd77"}}>{g.skill}</span></div>{own?<button className="secondary-btn" disabled>등용 완료</button>:<button className="primary-btn" onClick={()=>recruit(g.id)}>등용 · {recruitCost(g,save.faction)}G</button>}</div>})}</div>}
        {tab==="diplomacy"&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{factions.filter(f=>f.id!==save.faction).map(f=><div key={f.id} style={{padding:12,border:"1px solid #26364f",borderRadius:10,background:"#101927"}}><b>{f.name} · {f.ruler}</b><div style={{fontSize:10,color:"#8997ad",margin:"8px 0"}}>관계도 {save.relations[f.id]||0}<br/>{f.doctrine}</div><button className="primary-btn" onClick={()=>diplomacy(f.id)}>외교 개선 · 120G</button></div>)}</div>}
      </div>

      <div className="panel" style={{padding:12}}>
        <span className="eyebrow">COMMANDER PROFILE</span>
        <h2 style={{margin:"5px 0"}}>{faction.name} · {faction.ruler}</h2>
        <p className="muted">{faction.description}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,margin:"10px 0"}}>{[["영지",ownedCities.length],["장수",recruited.length],["영향력",Math.round(save.influence)],["명성",Math.round(save.renown)],["턴",save.turns],["금",gold]].map(x=><div key={x[0]} style={{padding:8,background:"#101927",borderRadius:8}}><small>{x[0]}</small><b style={{display:"block",fontSize:15}}>{x[1]}</b></div>)}</div>
        <b>세력 특성</b>{faction.bonuses.map(x=><div key={x} style={{fontSize:10,color:"#aebbd0",padding:"4px 0"}}>◆ {x}</div>)}
        <hr style={{border:"0",borderTop:"1px solid #24344d",margin:"10px 0"}}/>
        <b>선택 도시 · {target.name}</b>
        <div style={{fontSize:10,color:"#8997ad",margin:"6px 0"}}>{target.region} · {targetOwner==="neutral"?"중립":factionOf(targetOwner as FactionId).name}<br/>도시 전투력 {Math.round(enemyPower)} · 우리 원정군 {Math.round(armyPower)}</div>
        <div style={{display:"grid",gap:6}}><button className="primary-btn" onClick={conquer}>AI 원정군으로 정벌 · 병참 {55+Math.round(target.defense*.45)}</button><button className="secondary-btn" onClick={()=>onDispatch(target.id)}>기존 던전 원정으로 출격</button></div>
        <small style={{display:"block",color:"#75839a",marginTop:7}}>정벌 결과는 지휘관 능력·영지·명성에 따라 자동 판정됩니다. 전투 명령은 기존 AI가 계속 담당합니다.</small>
      </div>
    </div>
  </section>;
}
