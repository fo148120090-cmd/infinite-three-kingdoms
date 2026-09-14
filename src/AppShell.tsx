import { useEffect, useState } from 'react';
import App from './App';
import BattleEngine from './BattleEngine';
import './battle-engine.css';

const KEY='infinite-three-kingdoms-save-v2';
function readSave(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function Settings(){
 const[open,setOpen]=useState(false),[save,setSave]=useState(readSave),refresh=()=>setSave(readSave());
 const reset=()=>{if(!window.confirm('게임 진행 데이터를 초기화할까요?'))return;localStorage.removeItem(KEY);window.location.reload()};
 useEffect(()=>{const timer=window.setInterval(refresh,1000);return()=>window.clearInterval(timer)},[]);
 const owned=Array.isArray(save.owned)?save.owned:[],formation=Array.isArray(save.formation)?save.formation:[],eq=save.equipment&&typeof save.equipment==='object'?Object.values(save.equipment) as Array<{level?:number}>:[],avg=eq.length?Math.round(eq.reduce((a,e)=>a+(e.level||0),0)/eq.length):0;
 return <><button className="tower-settings" aria-label="게임 설정" onClick={()=>{refresh();setOpen(true)}}>⚙️</button>{open&&<div className="tower-settings-modal" role="dialog" aria-modal="true" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}><div className="tower-settings-panel"><h2>⚙️ 게임 설정</h2><div className="tower-settings-grid"><div className="tower-settings-stat"><small>천탑 진행</small><b>{save.floor||1}층</b></div><div className="tower-settings-stat"><small>계정 레벨</small><b>Lv.{save.level||1}</b></div><div className="tower-settings-stat"><small>보유 장수</small><b>{owned.length}명</b></div><div className="tower-settings-stat"><small>현재 편성</small><b>{formation.length}/5명</b></div><div className="tower-settings-stat"><small>보옥</small><b>💎 {save.gems||0}</b></div><div className="tower-settings-stat"><small>금화</small><b>🪙 {save.gold||0}</b></div><div className="tower-settings-stat"><small>강화 재료</small><b>{save.materials||0}</b></div><div className="tower-settings-stat"><small>장비 평균</small><b>+{avg}</b></div></div><p className="tower-settings-note">수동 턴제 전투 · 고정 10×10 전장 · 삼국지 장수 vs 판타지 몬스터<br/>자동전투와 궁극기는 사용하지 않습니다.</p><button className="tower-settings-reset" onClick={reset}>게임 데이터 초기화</button><button className="tower-settings-close" onClick={()=>setOpen(false)}>닫기</button></div></div>}</>;
}
function BattleEngineBridge(){
 const[active,setActive]=useState(false);
 useEffect(()=>{const detect=()=>setActive(Boolean(document.querySelector('.battle-layout')));const observer=new MutationObserver(detect);observer.observe(document.body,{childList:true,subtree:true});const timer=window.setInterval(detect,400);detect();return()=>{observer.disconnect();window.clearInterval(timer)}},[]);
 return active?<div className="be-overlay"><BattleEngine/></div>:null;
}
export default function AppShell(){return <><App/><BattleEngineBridge/><Settings/></>}
