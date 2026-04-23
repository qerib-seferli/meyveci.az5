const notificationList = document.getElementById("notificationList");
const markAllReadBtn = document.getElementById("markAllReadBtn");

function notificationTemplate(item) {
  return `
    <article class="notification-item ${item.is_read ? "" : "unread"}" data-id="${item.id}" data-link="${item.link_url || ""}">
      <h4>${item.title}</h4>
      <p>${item.body || ""}</p>
      <small>${new Date(item.created_at).toLocaleString("az-AZ")}</small>
    </article>
  `;
}

async function loadNotifications() {
  const { data, error } = await ChatAPI.getNotifications();

  if (error) {
    notificationList.innerHTML = `<div class="notification-item">Xəta: ${error.message}</div>`;
    return;
  }

  if (!data?.length) {
    notificationList.innerHTML = `<div class="notification-item">Bildiriş yoxdur.</div>`;
    return;
  }

  notificationList.innerHTML = data.map(notificationTemplate).join("");

  document.querySelectorAll(".notification-item").forEach(item => {
    item.addEventListener("click", async () => {
      const id = item.dataset.id;
      const link = item.dataset.link;

      await ChatAPI.markNotificationRead(id);

      if (link) {
        const normalized = link.startsWith("/") ? `.${link}` : link;
        window.location.href = normalized;
      } else {
        await loadNotifications();
      }
    });
  });
}

markAllReadBtn?.addEventListener("click", async () => {
  const { error } = await ChatAPI.markAllNotificationsRead();
  if (error) {
    showToast(error.message || "Əməliyyat alınmadı", "error");
    return;
  }

  showToast("Bütün bildirişlər oxundu", "success");
  await loadNotifications();
});

(async function initNotifications() {
  const session = await requireAuth();
  if (!session) return;

  await loadComponents();
  await loadNotifications();
})();
