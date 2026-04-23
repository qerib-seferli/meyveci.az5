const settingsTableBody = document.getElementById("settingsTableBody");

(async function initAdminSettings() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();

  const { data, error } = await AdminAPI.getSettings();
  if (error) {
    settingsTableBody.innerHTML = `<tr><td colspan="3">Xəta: ${error.message}</td></tr>`;
    return;
  }

  settingsTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.setting_key}</td>
      <td><pre style="white-space:pre-wrap;margin:0;">${JSON.stringify(item.setting_value, null, 2)}</pre></td>
      <td>${item.description || "-"}</td>
    </tr>
  `).join("");
})();
