export function initGloop(){
 const stage=document.querySelector('[data-gloop-stage]');const blob=document.querySelector('[data-gloop-blob]');
 stage?.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();stage.style.setProperty('--gx',((e.clientX-r.left)/r.width-.5).toFixed(3));stage.style.setProperty('--gy',((e.clientY-r.top)/r.height-.5).toFixed(3));});
 blob?.addEventListener('click',()=>{blob.style.setProperty('--squish','.84');setTimeout(()=>blob.style.setProperty('--squish','1.05'),140);setTimeout(()=>blob.style.setProperty('--squish','1'),300)});
 document.querySelector('[data-gl-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText('GLOOPxxxxxxxxxxxxxxxxxxxxxxxx');e.currentTarget.textContent='COPIED ✓';setTimeout(()=>e.currentTarget.textContent='COPY CA',1200)}catch{}})
}
