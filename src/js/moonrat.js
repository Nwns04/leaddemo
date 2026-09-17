export function initMoonrat(){
 const launch=document.querySelector('[data-mr-launch]');const altitude=document.querySelector('[data-mr-altitude]');
 const update=()=>{if(!launch)return;const r=launch.getBoundingClientRect();const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(r.height+innerHeight*.08)));launch.style.setProperty('--launch-progress',p.toFixed(3));if(altitude)altitude.textContent=String(Math.round(p*999)).padStart(3,'0')};
 addEventListener('scroll',update,{passive:true});update();
 document.querySelector('[data-mr-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText('MRATxxxxxxxxxxxxxxxxxxxxxxxx');const old=e.currentTarget.textContent;e.currentTarget.textContent='COPIED ✓';setTimeout(()=>e.currentTarget.textContent=old,1200)}catch{}})
}
