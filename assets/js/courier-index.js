const courierOrdersList = document.getElementById('courierOrdersList');
async function loadCourierOrders(){
  const { data: userData } = await getCachedUser();
  const user = userData.user; if(!user){ courierOrdersList.innerHTML='İstifadəçi tapılmadı'; return; }
  courierOrdersList.innerHTML='<div class="courier-order-card">Sifarişlər yüklənir...</div>';
  const { data, error } = await supabaseClient.from('orders').select(`id,order_code,status,address_id,created_at,addresses:address_id (id,address_line)`).eq('courier_id', user.id).order('created_at', { ascending: false }).limit(40);
  if(error){ courierOrdersList.innerHTML=`Xəta: ${error.message}`; return; }
  const active=(data||[]).filter(item=>['confirmed','preparing','on_the_way'].includes(item.status));
  const history=(data||[]).filter(item=>['delivered','cancelled'].includes(item.status)).slice(0,4);
  courierOrdersList.innerHTML = `
    <div class="courier-summary-grid">
      <div class="courier-mini-card"><strong>${active.length}</strong><span>Aktiv sifariş</span></div>
      <div class="courier-mini-card"><strong>${history.length}</strong><span>Son tamamlanan</span></div>
    </div>
    <h3 style="margin:18px 0 10px;">Aktiv sifarişlər</h3>
    ${active.length ? active.map(order=>`<article class="courier-order-card"><strong>${order.order_code}</strong><p>Status: ${order.status}</p><p>Ünvan: ${order.addresses?.address_line || '-'}</p><a class="btn btn-primary" style="display:inline-grid;place-items:center;text-decoration:none;" href="./tracking.html?id=${order.id}">Tracking aç</a></article>`).join('') : '<div class="courier-order-card">Hazırda aktiv sifariş yoxdur.</div>'}
    <h3 style="margin:18px 0 10px;">Tarixçə</h3>
    ${history.length ? history.map(order=>`<article class="courier-order-card"><strong>${order.order_code}</strong><p>Status: ${order.status}</p><p>Ünvan: ${order.addresses?.address_line || '-'}</p></article>`).join('') : '<div class="courier-order-card">Tarixçə boşdur.</div>'}`;
}
(async function initCourierIndex(){ const allowed=await requireRole('courier'); if(!allowed) return; await loadCourierOrders(); })();
