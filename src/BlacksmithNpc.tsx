import { useState } from "react";

const blacksmithImage="/npc/blacksmith.webp";

export default function BlacksmithNpc(){
  const [open,setOpen]=useState(false);
  const openArmory=()=>{
    const button=Array.from(document.querySelectorAll<HTMLButtonElement>(".main-nav button"))
      .find(x=>x.textContent?.trim()==="장비");
    button?.click();
    setOpen(false);
  };
  return <div className="blacksmith-npc-root">
    {open&&<div className="blacksmith-backdrop" onClick={()=>setOpen(false)}>
      <section className="blacksmith-dialog" onClick={e=>e.stopPropagation()}>
        <div className="blacksmith-dialog-art">
          <img src={blacksmithImage} alt="대장장이 NPC 아르덴"/>
        </div>
        <div className="blacksmith-dialog-body">
          <span className="eyebrow">NPC · DIVINE FORGE</span>
          <h2>아르덴</h2>
          <small>불꽃의 대장장이 · 강화 담당</small>
          <p>금속의 울림만 들어도 장비의 다음 한계를 알아냅니다. 골드만 준비하면 장비를 최대 <b>+15</b>까지 강화할 수 있습니다.</p>
          <div className="blacksmith-ability-grid">
            <div><b>🔥 불 내성</b><span>용광로와 마그마 열기에 강한 체질</span></div>
            <div><b>✋ 신의 손</b><span>정밀한 망치질로 강화 품질을 안정적으로 유지</span></div>
            <div><b>🔨 대형망치</b><span>거대한 망치로 장비 잠재력을 끌어냄</span></div>
          </div>
          <div className="blacksmith-rule"><span>강화 비용</span><b>GOLD</b><small>강화 단계가 높을수록 비용 증가</small></div>
          <button className="primary-btn blacksmith-armory-btn" onClick={openArmory}>장비실에서 강화하기</button>
          <button className="ghost-btn blacksmith-close-btn" onClick={()=>setOpen(false)}>대화 닫기</button>
        </div>
      </section>
    </div>}
    <button className={"blacksmith-float "+(open?"active":"")} onClick={()=>setOpen(true)} aria-label="대장장이 아르덴 호출">
      <img src={blacksmithImage} alt="" />
      <span className="blacksmith-float-label"><b>아르덴</b><small>강화 · +15</small></span>
      <i>🔨</i>
    </button>
  </div>;
}
