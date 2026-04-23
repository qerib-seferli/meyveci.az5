
document.addEventListener('DOMContentLoaded', async () => {
  createLoader();
  applyBrandAssets();
  try {
    if (document.querySelector('#header') || document.querySelector('#bottomNav')) {
      await loadComponents();
    }
    await initLiteApp();
  } catch (err) {
    console.error('Lite app xətası:', err);
  } finally {
    hideLoader();
  }
});
function createLoader(){
  if(document.querySelector('.page-loader')) return;
  const base=(typeof getBasePath==='function')?getBasePath():'./';
  const el=document.createElement('div');
  el.className='page-loader';
  el.innerHTML=`<div><img src="${base}assets/img/logo/Cilek-logo.png" alt="Yüklənir"><p style="margin-top:12px;text-align:center;color:#4b6350;font-weight:700;">Meyvəçi.az yüklənir...</p></div>`;
  document.body.prepend(el);
}
function hideLoader(){ requestAnimationFrame(()=>document.querySelector('.page-loader')?.classList.add('hidden')); }
function applyBrandAssets(){
  const base = (typeof getBasePath==='function') ? getBasePath() : (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/courier/') ? '../' : './');
  const cilek = `${base}assets/img/logo/Cilek-logo.png`;
  let favicon = document.querySelector('link[rel="icon"]');
  if(!favicon){ favicon = document.createElement('link'); favicon.rel='icon'; favicon.type='image/png'; document.head.appendChild(favicon); }
  favicon.href = cilek;
}
async function initLiteApp(){
  const { data } = typeof getCachedSession==='function' ? await getCachedSession() : { data:{session:null} };
  document.documentElement.dataset.authState = data?.session ? 'authenticated' : 'guest';
  await enhanceRoleLinks();
  await initNotificationPanel();
}
async function enhanceRoleLinks(){
  try{
    const { data } = await getCachedSession();
    if(!data?.session) return;
    const role = typeof getCachedRole === 'function' ? await getCachedRole() : null;
    if(!role || role === 'user') return;
    const actions = document.querySelector('.topbar-actions');
    if(!actions || actions.querySelector('[data-role-link]')) return;
    const base = typeof getBasePath === 'function' ? getBasePath() : './';
    const a = document.createElement('a');
    a.className='topbar-icon';
    a.dataset.roleLink=role;
    a.href= role === 'admin' ? `${base}admin/index.html` : `${base}courier/index.html`;
    a.title = role === 'admin' ? 'Admin panel' : 'Kuryer panel';
    a.textContent = role === 'admin' ? 'Admin' : 'Kuryer';
    actions.prepend(a);
  }catch(err){ console.warn('Rol linki qurulmadı', err); }
}
async function initNotificationPanel(){
  const toggle=document.getElementById('notificationToggle');
  const panel=document.getElementById('notificationPanel');
  const list=document.getElementById('notificationList');
  const badge=document.getElementById('notificationBadge');
  const markBtn=document.getElementById('markNotificationsRead');
  if(!toggle||!panel||!list||!badge) return;
  const { data } = await getCachedUser();
  const user=data?.user;
  if(!user){ toggle.style.display='none'; return; }
  let loaded=false;
  async function renderNotifications(markRead=false){
    const { data: items, error } = await supabaseClient.from('notifications').select('id,title,body,link_url,is_read,created_at').eq('user_id', user.id).order('created_at',{ascending:false}).limit(10);
    if(error){ list.innerHTML=`<p class="muted">${error.message}</p>`; return; }
    const unread=(items||[]).filter(x=>!x.is_read).length;
    badge.textContent=String(unread); badge.classList.toggle('badge-hidden', unread<1);
    list.innerHTML=(items||[]).length ? items.map(item=>`<article class="notification-card"><a href="${item.link_url||'#'}"><strong>${item.title}</strong><p>${item.body||''}</p><small>${new Date(item.created_at).toLocaleString('az-AZ')}</small></a></article>`).join('') : '<p class="muted">Bildiriş yoxdur.</p>';
    if(markRead && unread>0){ await supabaseClient.from('notifications').update({is_read:true}).eq('user_id', user.id).eq('is_read', false); badge.classList.add('badge-hidden'); }
  }
  await renderNotifications(false);
  toggle.addEventListener('click', async (e)=>{ e.preventDefault(); panel.classList.toggle('hidden'); if(!loaded){ await renderNotifications(false); loaded=true; } });
  markBtn?.addEventListener('click', async ()=>{ await renderNotifications(true); });
  document.addEventListener('click', (e)=>{ if(!panel.contains(e.target) && !toggle.contains(e.target)) panel.classList.add('hidden'); });
}
