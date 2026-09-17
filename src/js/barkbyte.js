export function initBarkbyte(){
 const stage=document.querySelector('[data-bb-stage]');
 stage?.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();stage.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));stage.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3));});
 const runner=document.querySelector('[data-bb-runner]');
 const onScroll=()=>{if(!runner)return;const r=runner.closest('.bb-pack').getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));runner.style.setProperty('--run-x',`${-22+p*34}%`)};addEventListener('scroll',onScroll,{passive:true});onScroll();
 document.querySelectorAll('[data-copy-ca]').forEach(btn=>btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(btn.dataset.value||'');const old=btn.textContent;btn.textContent='COPIED ✓';setTimeout(()=>btn.textContent=old,1200)}catch{}}));
}
