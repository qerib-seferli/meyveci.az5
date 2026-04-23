const usersTableBody = document.getElementById('usersTableBody');

function roleOptions(current){
  return ['user','courier','admin'].map(role => `<option value="${role}" ${current===role?'selected':''}>${role}</option>`).join('');
}

function activeOptions(active){
  return `<option value="true" ${active!==false?'selected':''}>Aktiv</option><option value="false" ${active===false?'selected':''}>Passiv</option>`;
}

async function saveUserRow(id){
  const role = document.querySelector(`[data-user-role="${id}"]`)?.value || 'user';
  const isActive = document.querySelector(`[data-user-active="${id}"]`)?.value === 'true';
  const { error } = await AdminAPI.updateUser(id, { role, is_active: isActive });
  if (error) { alert(error.message || 'Yadda saxlanmadı'); return; }
  if (role === 'courier') {
    await AdminAPI.createCourier({ user_id:id, is_online:false, is_active:isActive });
  } else {
    await AdminAPI.deleteCourier(id);
  }
  alert('İstifadəçi yeniləndi');
  await loadUsersTable();
}

async function loadUsersTable() {
  const { data, error } = await AdminAPI.getUsers();
  if (error) {
    usersTableBody.innerHTML = `<tr><td colspan="6">Xəta: ${error.message}</td></tr>`;
    return;
  }
  usersTableBody.innerHTML = (data || []).map(user => `
    <tr>
      <td>${user.first_name || ''} ${user.last_name || ''}</td>
      <td>${user.email || '-'}</td>
      <td>${user.phone || '-'}</td>
      <td><select data-user-role="${user.id}">${roleOptions(user.role)}</select></td>
      <td><select data-user-active="${user.id}">${activeOptions(user.is_active)}</select></td>
      <td><button class="btn btn-soft" onclick="saveUserRow('${user.id}')">Yadda saxla</button></td>
    </tr>
  `).join('');
}

(async function initAdminUsers() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadUsersTable();
})();
