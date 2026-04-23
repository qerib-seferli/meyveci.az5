const partnerForm = document.getElementById("partnerForm");
const partnersTableBody = document.getElementById("partnersTableBody");

async function loadPartners() {
  const { data, error } = await AdminAPI.getPartners();
  if (error) {
    partnersTableBody.innerHTML = `<tr><td colspan="4">Xəta: ${error.message}</td></tr>`;
    return;
  }

  partnersTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.website_url || "-"}</td>
      <td>${item.is_active ? "Bəli" : "Xeyr"}</td>
      <td><button class="btn btn-soft" onclick="removePartner('${item.id}')">Sil</button></td>
    </tr>
  `).join("");
}

async function removePartner(id) {
  if (!confirm("Partnyor silinsin?")) return;
  const { error } = await AdminAPI.deletePartner(id);
  if (error) return alert(error.message || "Silinmədi");
  await loadPartners();
}

partnerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let logoUrl = null;
  const file = document.getElementById("logoFile").files[0];
  if (file) {
    const upload = await AdminAPI.uploadFile("partners", file, "partner");
    if (upload.error) return alert(upload.error.message || "Logo yüklənmədi");
    logoUrl = upload.data;
  }

  const payload = {
    name: document.getElementById("name").value.trim(),
    website_url: document.getElementById("websiteUrl").value.trim(),
    sort_order: Number(document.getElementById("sortOrder").value || 0),
    is_active: document.getElementById("isActive").checked,
    logo_url: logoUrl
  };

  const { error } = await AdminAPI.createPartner(payload);
  if (error) return alert(error.message || "Yaradılmadı");

  partnerForm.reset();
  await loadPartners();
});

(async function initAdminPartners() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadPartners();
})();
