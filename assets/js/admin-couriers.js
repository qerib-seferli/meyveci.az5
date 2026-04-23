const couriersTableBody = document.getElementById('couriersTableBody');
const courierForm = document.getElementById('courierForm');
const courierProfileSelect = document.getElementById('courierProfileId');
let editingCourierId = null;

function fillCourierForm(item){
  editingCourierId = item.id;
  courierProfileSelect.value = item.id || '';
  document.getElementById('vehicleType').value = item.vehicle_type || '';
  document.getElementById('vehiclePlate').value = item.vehicle_plate || '';
  document.getElementById('isOnline').checked = !!item.is_online;
  document.getElementById('isCourierActive').checked = item.is_active !== false;
  courierForm.querySelector('button[type="submit"]').textContent = 'Redaktəni yadda saxla';
}

function resetCourierForm(){
  editingCourierId = null;
  courierForm.reset();
  courierProfileSelect.value = '';
  document.getElementById('isCourierActive').checked = true;
  courierForm.querySelector('button[type="submit"]').textContent = 'Kuryeri yadda saxla';
}

async function loadCourierCandidates(){
  const { data, error } = await AdminAPI.getEligibleCourierUsers();
  if (error) return;
  courierProfileSelect.innerHTML = '<option value="">İstifadəçi seç</option>' + (data || []).map(item => `<option value="${item.id}">${item.first_name || ''} ${item.last_name || ''} — ${item.email || '-'}</option>`).join('');
}

async function loadCouriersTable() {
  const { data, error } = await AdminAPI.getCouriers();
  if (error) {
    couriersTableBody.innerHTML = `<tr><td colspan="6">Xəta: ${error.message}</td></tr>`;
    return;
  }
  window.__couriersRows = data || [];
  couriersTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}<div class="muted">${item.profiles?.email || '-'}</div></td>
      <td>${item.vehicle_type || '-'}</td>
      <td>${item.vehicle_plate || '-'}</td>
      <td>${item.is_online ? 'Online' : 'Offline'}</td>
      <td>${item.total_deliveries || 0}</td>
      <td><button class="btn btn-soft" onclick="editCourier('${item.id}')">Redaktə</button> <button class="btn btn-soft" onclick="removeCourier('${item.id}')">Sil</button></td>
    </tr>
  `).join('');
}

function editCourier(id){
  const item=(window.__couriersRows||[]).find(x=>x.id===id);
  if(item) fillCourierForm(item);
}

async function removeCourier(id){
  if(!confirm('Kuryer silinsin?')) return;
  await AdminAPI.updateUser(id, { role:'user' });
  const { error } = await AdminAPI.deleteCourier(id);
  if(error){ alert(error.message || 'Silinmədi'); return; }
  resetCourierForm();
  await loadCouriersTable();
}

courierForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const profileId = courierProfileSelect.value.trim();
  if(!profileId){ alert('İstifadəçi seç'); return; }
  const payload = { user_id: profileId, vehicle_type: document.getElementById('vehicleType').value.trim(), vehicle_plate: document.getElementById('vehiclePlate').value.trim(), is_online: document.getElementById('isOnline').checked, is_active: document.getElementById('isCourierActive').checked };
  const activePayload = { is_active: document.getElementById('isCourierActive').checked, role: 'courier' };
  const { error: profileError } = await AdminAPI.updateUser(profileId, activePayload);
  if(profileError){ alert(profileError.message || 'Profil rolu yenilənmədi'); return; }
  const { error } = editingCourierId ? await AdminAPI.updateCourier(editingCourierId, payload) : await AdminAPI.createCourier(payload);
  if(error){ alert(error.message || 'Kuryer yadda saxlanmadı'); return; }
  resetCourierForm();
  await loadCourierCandidates();
  await loadCouriersTable();
});

(async function initAdminCouriers() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadCourierCandidates();
  await loadCouriersTable();
})();
