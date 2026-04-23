const bannerForm = document.getElementById("bannerForm");
const bannersTableBody = document.getElementById("bannersTableBody");

async function loadBanners() {
  const { data, error } = await AdminAPI.getBanners();
  if (error) {
    bannersTableBody.innerHTML = `<tr><td colspan="4">Xəta: ${error.message}</td></tr>`;
    return;
  }

  bannersTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.title}</td>
      <td>${item.status}</td>
      <td>${item.sort_order}</td>
      <td><button class="btn btn-soft" onclick="removeBanner('${item.id}')">Sil</button></td>
    </tr>
  `).join("");
}

async function removeBanner(id) {
  if (!confirm("Banner silinsin?")) return;
  const { error } = await AdminAPI.deleteBanner(id);
  if (error) return alert(error.message || "Silinmədi");
  await loadBanners();
}

bannerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let imageUrl = null;
  const file = document.getElementById("imageFile").files[0];
  if (file) {
    const upload = await AdminAPI.uploadFile("banners", file, "banner");
    if (upload.error) return alert(upload.error.message || "Şəkil yüklənmədi");
    imageUrl = upload.data;
  }

  const payload = {
    title: document.getElementById("title").value.trim(),
    subtitle: document.getElementById("subtitle").value.trim(),
    link_url: document.getElementById("linkUrl").value.trim(),
    button_text: document.getElementById("buttonText").value.trim(),
    sort_order: Number(document.getElementById("sortOrder").value || 0),
    status: document.getElementById("status").value,
    image_url: imageUrl
  };

  const { error } = await AdminAPI.createBanner(payload);
  if (error) return alert(error.message || "Yaradılmadı");

  bannerForm.reset();
  await loadBanners();
});

(async function initAdminBanners() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadBanners();
})();
