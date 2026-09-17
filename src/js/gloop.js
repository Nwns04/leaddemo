export function initGloop(){
 const world=document.querySelector('[data-gloop-world]');
 world?.addEventListener('pointermove',e=>{const r=world.getBoundingClientRect();world.style.setProperty('--gx',((e.clientX-r.left)/r.width-.5).toFixed(3));world.style.setProperty('--gy',((e.clientY-r.top)/r.height-.5).toFixed(3));});
 const stage=document.querySelector('[data-gloop-stage]');const blob=document.querySelector('[data-gloop-blob]');const image=document.querySelector('[data-gl-creature-image]');const label=document.querySelector('[data-gl-state-label]');const poke=document.querySelector('[data-gl-poke]');
 const neutral='/demos/gloop/gloop-cutout.png',stretch='/demos/gloop/gloop-stretch.png',squish='/demos/gloop/gloop-squish.png';
 stage?.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;stage.style.setProperty('--px',x.toFixed(3));stage.style.setProperty('--py',y.toFixed(3));if(image&&Math.abs(y)>.23&&!blob?.classList.contains('is-poked')){image.src=stretch;label&&(label.textContent='CURIOUS')}else if(image&&!blob?.classList.contains('is-poked')){image.src=neutral;label&&(label.textContent='CALM')}});
 stage?.addEventListener('pointerleave',()=>{if(image&&!blob?.classList.contains('is-poked'))image.src=neutral;if(label)label.textContent='CALM'});
 const doPoke=()=>{if(!blob||!image)return;blob.classList.add('is-poked');image.src=squish;if(label)label.textContent='POKED';setTimeout(()=>{image.src=neutral;blob.classList.remove('is-poked');if(label)label.textContent='CALM'},700)};blob?.addEventListener('click',doPoke);poke?.addEventListener('click',doPoke);
 document.querySelector('[data-gl-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText('GLOOPxxxxxxxxxxxxxxxxxxxxxxxx');const old=e.currentTarget.textContent;e.currentTarget.textContent='COPIED ✓';setTimeout(()=>e.currentTarget.textContent=old,1200)}catch{}})
}
