import { useEffect, useState } from 'react';
import App from './App';

const KEY='infinite-three-kingdoms-save-v2';
const ranges:Record<string,number>={유비:2,관우:1,장비:1,조운:1,제갈량:3,조조:2,하후돈:1,손권:2,여포:1,초선:2};
const moves:Record<string,number>={유비:3,관우:3,장비:2,조운:4,제갈량:2,조조:3,하후돈:3,손권:3,여포:4,초선:3};

function readSave(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}

function BattleGuide(){
 useEffect(()=>{
  const paint=()=>{
   const grid=document.querySelector('.battle-grid');
   if(!grid)return;
   const cells=Array.from(grid.children) as HTMLElement[];
   if(cells.length!==42)return;
   const selected=Array.from(document.querySelectorAll('b')).map(x=>x.textContent?.trim()||'').find(x=>x in ranges)||'';
   cells.forEach((cell,i)=>{
    cell.classList.remove('tower-tile-move','tower-tile-attack','tower-tile-selected');
    const text=cell.textContent||'';
    if(!selected||!text)return;
    const selectedIndex=cells.findIndex(c=>(c.textContent||'').includes(selected));
    if(selectedIndex<0)return;
    if(text.includes(selected)){cell.classList.add('tower-tile-selected');return}
    const sx=selectedIndex%7,sy=Math.floor(selectedIndex/7),x=i%7,y=Math.floor(i/7);
    const d=Math.abs(x-sx)+Math.abs(y-sy);
    const occupied=/🟦|🟥/.test(text);
    if(/🟥/.test(text)&&d<=ranges[selected])cell.classList.add('tower-tile-attack');
    else if(!occupied&&d>0&&d<=moves[selected]&&getComputedStyle(cell).backgroundColor!=='rgb(23, 38, 58)')cell.classList.add('tower-tile-move');
   });
  };
  const observer=new MutationObserver(paint); observer.observe(document.body,{childList:true,subtree:true});
  const timer=window.setInterval(paint,400); paint();
  return()=>{observer.disconnect();window.clearInterval(timer)};
 },[]);
 return null;
}

function Settings(){
 const[open,setOpen]=useState(false);
 const[save,setSave]=useState(readSave);
 const refresh=()=>setSave(readSave());
 const reset=()=>{if(!window.confirm('게임 진행 데이터를 초기화할까요?'))return;localStorage.removeItem(KEY);window.location.reload()};
 useEffect(()=>{const timer=window.setInterval(refresh,1000);return()=>window.clearInterval(timer)},[]);
 const owned=Array.isArray(save.owned)?save.owned:[];
 const formation=Array.isArray(save.formation)?save.formation:[];
 const eq=save.equipment&&typeof save.equipment==='object'?Object.values(save.equipment) as Array<{level?:number}>:[];
 const avg=eq.length?Math.round(eq.reduce((a,e)=>a+(e.level||0),0)/eq.length):0;
 return <>
  <button className="tower-settings" aria-label="게임 설정" onClick={()=>{refresh();setOpen(true)}}>⚙️</button>
  {open&&<div className="tower-settings-modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <div className="tower-settings-panel">
    <h2>⚙️ 게임 설정</h2>
    <div className="tower-settings-grid">
     <div className="tower-settings-stat"><small>천탑 진행</small><b>{save.floor||1}층</b></div>
     <div className="tower-settings-stat"><small>계정 레벨</small><b>Lv.{save.level||1}</b></div>
     <div className="tower-settings-stat"><small>보유 장수</small><b>{owned.length}명</b></div>
     <div className="tower-settings-stat"><small>현재 편성</small><b>{formation.length}/5명</b></div>
     <div className="tower-settings-stat"><small>보옥</small><b>💎 {save.gems||0}</b></div>
     <div className="tower-settings-stat"><small>금화</small><b>🪙 {save.gold||0}</b></div>
     <div className="tower-settings-stat"><small>강화 재료</small><b>{save.materials||0}</b></div>
     <div className="tower-settings-stat"><small>장비 평균</small><b>+{avg}</b></div>
    </div>
    <p className="tower-settings-note">수동 턴제 전투 · 7×6 전장 · 삼국지 장수 vs 판타지 몬스터<br/>자동전투와 궁극기는 사용하지 않습니다.</p>
    <button className="tower-settings-reset" onClick={reset}>게임 데이터 초기화</button>
    <button className="tower-settings-close" onClick={()=>setOpen(false)}>닫기</button>
   </div>
  </div>}
 </>;
}

export default function AppShell(){return <><App/><BattleGuide/><Settings/></>}
