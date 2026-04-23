const newsForm = document.getElementById("newsForm");
const newsTableBody = document.getElementById("newsTableBody");

async function loadNews() {
  const { data, error } = await AdminAPI.getNews();
  if (error) {
    newsTableBody.innerHTML = `<tr><td colspan="4">Xəta: ${error.message}</td></tr>`;
    return;
  }

  newsTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.title}</td>
      <td>${item.slug}</td>
      <td>${item.status}</td>
      <td><button class="btn btn-soft" onclick="removeNews('${item.id}')">Sil</button></td>
    </tr>
  `).join("");
}

async function removeNews(id) {
  if (!confirm("Xəbər silinsin?")) return;
  const { error } = await AdminAPI.deleteNews(id);
  if (error) return alert(error.message || "Silinmədi");
  await loadNews();
}

newsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let coverImage = null;
  const file = document.getElementById("imageFile").files[0];
  if (file) {
    const upload = await AdminAPI.uploadFile("news", file, "news");
    if (upload.error) return alert(upload.error.message || "Şəkil yüklənmədi");
    coverImage = upload.data;
  }

  const { data: userData } = await supabaseClient.auth.getUser();

  const payload = {
    title: document.getElementById("title").value.trim(),
    excerpt: document.getElementById("excerpt").value.trim(),
    content: document.getElementById("content").value.trim(),
    status: document.getElementById("status").value,
    cover_image: coverImage,
    created_by: userData.user?.id || null,
    published_at: document.getElementById("status").value === "published" ? new Date().toISOString() : null
  };

  const { error } = await AdminAPI.createNews(payload);
  if (error) return alert(error.message || "Yaradılmadı");

  newsForm.reset();
  await loadNews();
});

(async function initAdminNews() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadNews();
})();
