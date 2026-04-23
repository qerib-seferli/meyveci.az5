const categoryForm = document.getElementById("categoryForm");
const categoriesTableBody = document.getElementById("categoriesTableBody");

async function loadCategoriesTable() {
  const { data, error } = await AdminAPI.getCategories();
  if (error) {
    categoriesTableBody.innerHTML = `<tr><td colspan="4">Xəta: ${error.message}</td></tr>`;
    return;
  }

  categoriesTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.slug}</td>
      <td>${item.is_active ? "Bəli" : "Xeyr"}</td>
      <td><button class="btn btn-soft" onclick="removeCategory('${item.id}')">Sil</button></td>
    </tr>
  `).join("");
}

async function removeCategory(id) {
  if (!confirm("Kateqoriya silinsin?")) return;
  const { error } = await AdminAPI.deleteCategory(id);
  if (error) return alert(error.message || "Silinmədi");
  await loadCategoriesTable();
}

categoryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let imageUrl = null;
  const file = document.getElementById("imageFile").files[0];
  if (file) {
    const upload = await AdminAPI.uploadFile("categories", file, "category");
    if (upload.error) return alert(upload.error.message || "Şəkil yüklənmədi");
    imageUrl = upload.data;
  }

  const payload = {
    name: document.getElementById("name").value.trim(),
    sort_order: Number(document.getElementById("sortOrder").value || 0),
    description: document.getElementById("description").value.trim(),
    image_url: imageUrl,
    is_active: document.getElementById("isActive").checked
  };

  const { error } = await AdminAPI.createCategory(payload);
  if (error) return alert(error.message || "Yaradılmadı");

  categoryForm.reset();
  await loadCategoriesTable();
  alert("Kateqoriya yaradıldı");
});

(async function initAdminCategories() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadCategoriesTable();
})();
