async function loadAdminSidebar() {
  const target = document.querySelector('#adminSidebar');
  if (!target || target.dataset.loaded==='true') return;
  try{
    const res = await fetch('../assets/components/admin-sidebar.html', {cache:'force-cache'});
    if(!res.ok) throw new Error('Sidebar yüklənmədi');
    const html = await res.text();
    target.innerHTML = html;
    target.dataset.loaded='true';
    const current = window.location.pathname.split('/').pop();
    document.querySelectorAll('.admin-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === `./${current}` || href === current) link.classList.add('active');
    });
  }catch(err){
    target.innerHTML = `<aside class="admin-sidebar"><div class="admin-card">Menyu yüklənmədi: ${err.message}</div></aside>`;
  }
}
async function adminPageGuard() { const allowed = await requireRole('admin'); return !!allowed; }
