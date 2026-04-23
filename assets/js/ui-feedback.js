// ======================================================
// UI FEEDBACK
// Toast, badge, sound
// ======================================================
function ensureToastRoot(){
  let root=document.getElementById('toastRoot');
  if(!root){
    root=document.createElement('div');
    root.id='toastRoot';
    root.className='toast-root';
    document.body.appendChild(root);
  }
  return root;
}
function showToast(message,type='success'){
  const root=ensureToastRoot();
  const toast=document.createElement('div');
  toast.className=`toast-item ${type}`;
  toast.textContent=message;
  root.appendChild(toast);
  requestAnimationFrame(()=>toast.classList.add('show'));
  setTimeout(()=>{toast.classList.remove('show'); setTimeout(()=>toast.remove(),260);},2600);
}
function playNotificationSound(){
  try{ const audio=new Audio('./assets/sounds/notification.mp3'); audio.volume=0.35; audio.play().catch(()=>{});}catch(_){ }
}
function setBadgeValue(selector,value){
  const el=document.querySelector(selector); if(!el) return;
  const num=Number.isFinite(Number(value))?Number(value):0;
  el.textContent = num > 99 ? '99+' : String(num);
  el.classList.toggle('zero', num===0);
}
