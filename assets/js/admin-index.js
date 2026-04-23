
const statsGrid = document.getElementById('statsGrid');
const ordersStateBox = document.getElementById('ordersStateBox');
document.getElementById('logoutBtn')?.addEventListener('click', async ()=>{ await AuthService.signOut(); window.location.href='../login.html'; });
(async function initAdminIndex(){
  const ok = await adminPageGuard(); if(!ok) return; await loadAdminSidebar();
  statsGrid.innerHTML='<div class="admin-card">Statistika yüklənir...</div>';
  const [productsRes, ordersRes, usersRes, couriersRes] = await Promise.all([
    supabaseClient.from('products').select('id', {count:'exact', head:true}),
    supabaseClient.from('orders').select('id,status', {count:'exact'}).order('created_at',{ascending:false}).limit(120),
    supabaseClient.from('profiles').select('id', {count:'exact', head:true}),
    supabaseClient.from('couriers').select('id', {count:'exact', head:true})
  ]);
  const cards=[['Məhsullar', productsRes.count||0],['Sifarişlər', ordersRes.count||0],['İstifadəçilər', usersRes.count||0],['Kuryerlər', couriersRes.count||0]];
  statsGrid.innerHTML=cards.map(([label,val])=>`<article class="admin-card"><h3>${label}</h3><strong style="font-size:28px;">${val}</strong></article>`).join('');
  const grouped=(ordersRes.data||[]).reduce((acc,it)=>{ acc[it.status]=(acc[it.status]||0)+1; return acc; },{});
  ordersStateBox.innerHTML = Object.keys(grouped).length ? `<div class="status-grid">${Object.entries(grouped).map(([k,v])=>`<div class="status-chip"><strong>${v}</strong><span>${k}</span></div>`).join('')}</div>` : '<p class="muted">Sifariş yoxdur.</p>';
})();
