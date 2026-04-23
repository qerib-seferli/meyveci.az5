const reviewsTableBody = document.getElementById("reviewsTableBody");

async function moderateReview(id, status) {
  const { error } = await AdminAPI.updateReview(id, { status });
  if (error) return alert(error.message || "Yenilənmədi");
  await loadReviews();
}

async function removeReview(id) {
  if (!confirm("Rəy silinsin?")) return;
  const { error } = await AdminAPI.deleteReview(id);
  if (error) return alert(error.message || "Silinmədi");
  await loadReviews();
}

async function loadReviews() {
  const { data, error } = await AdminAPI.getReviews();
  if (error) {
    reviewsTableBody.innerHTML = `<tr><td colspan="6">Xəta: ${error.message}</td></tr>`;
    return;
  }

  reviewsTableBody.innerHTML = (data || []).map(item => `
    <tr>
      <td>${item.products?.name || "-"}</td>
      <td>${item.profiles?.first_name || ""} ${item.profiles?.last_name || ""}</td>
      <td>${item.rating}/5</td>
      <td>${item.review_text || "-"}</td>
      <td>${item.status}</td>
      <td>
        <div class="action-row">
          <button class="btn btn-soft" onclick="moderateReview('${item.id}','approved')">Təsdiq</button>
          <button class="btn btn-soft" onclick="moderateReview('${item.id}','hidden')">Gizlət</button>
          <button class="btn btn-outline" onclick="removeReview('${item.id}')">Sil</button>
        </div>
      </td>
    </tr>
  `).join("");
}

(async function initAdminReviews() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();
  await loadReviews();
})();
