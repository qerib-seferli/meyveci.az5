document.addEventListener('DOMContentLoaded', async ()=>{
  try{
    applyBrandAssets();
    const hasHeaderSlot=document.querySelector('#header');
    const hasBottomSlot=document.querySelector('#bottomNav');
    if((hasHeaderSlot||hasBottomSlot) && typeof loadComponents==='function'){
      await loadComponents();
      await enhanceRoleLinks();
    }
    if(typeof initHeaderLive==='function') await initHeaderLive();
    if(typeof initPWAInstall==='function') initPWAInstall();
    await checkAuth();
  }catch(err){
    console.error('Core app xətası:',err);
  }
});

function applyBrandAssets(){
  const base = (typeof getBasePath==='function') ? getBasePath() : (window.location.pathname.includes('/admin/') || window.location.pathname.includes('/courier/') ? '../' : './');
  const cilek = `${base}assets/img/logo/Cilek-logo.png`;
  let favicon = document.querySelector('link[rel="icon"]');
  if(!favicon){ favicon = document.createElement('link'); favicon.setAttribute('rel','icon'); document.head.appendChild(favicon); }
  favicon.setAttribute('type','image/png');
  favicon.setAttribute('href', cilek);
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
    a.className = 'topbar-icon';
    a.dataset.roleLink = role;
    a.href = role === 'admin' ? `${base}admin/index.html` : `${base}courier/index.html`;
    a.title = role === 'admin' ? 'Admin panel' : 'Kuryer panel';
    a.textContent = role === 'admin' ? 'Admin' : 'Kuryer';
    actions.prepend(a);
  } catch(err){
    console.warn('Rol linki qurulmadı', err);
  }
}

async function checkAuth(){
  try{
    if(typeof supabaseClient==='undefined') return null;
    const {data,error}=await getCachedSession();
    if(error){ console.error(error.message); return null; }
    document.documentElement.dataset.authState=data.session?'authenticated':'guest';
    return data.session||null;
  }catch(err){
    console.error('Auth yoxlama xətası:',err);
    return null;
  }
}
