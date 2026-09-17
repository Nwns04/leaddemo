export function initMoonrat(){
 const launch=document.querySelector('[data-mr-launch]');const rocket=document.querySelector('[data-mr-rocket]');
 const update=()=>{if(!launch||!rocket)return;const r=launch.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(r.height+innerHeight*.15)));launch.style.setProperty('--launch-progress',p.toFixed(3));};addEventListener('scroll',update,{passive:true});update();
 document.querySelector('[data-mr-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText('MRATxxxxxxxxxxxxxxxxxxxxxxxx');e.currentTarget.textContent='COPIED ✓';setTimeout(()=>e.currentTarget.textContent='COPY CA',1200)}catch{}})
}
