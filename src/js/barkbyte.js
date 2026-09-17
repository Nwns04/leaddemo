export function initBarkbyte(){
 const stage=document.querySelector('[data-bb-stage]');
 stage?.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();stage.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));stage.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3));});
 const trail=document.querySelector('[data-bb-trail]');
 const update=()=>{if(!trail)return;const r=trail.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));trail.style.setProperty('--trail-progress',p.toFixed(3));};
 addEventListener('scroll',update,{passive:true});update();
 document.querySelectorAll('[data-copy-ca]').forEach(btn=>btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(btn.dataset.value||'');const old=btn.textContent;btn.textContent='COPIED ✓';setTimeout(()=>btn.textContent=old,1200)}catch{}}));
}
