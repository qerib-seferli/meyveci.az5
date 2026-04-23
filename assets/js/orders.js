const ordersList = document.getElementById("ordersList");

function orderCardTemplate(order) {
  return `
    <article class="order-card">
      <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div>
          <strong>${order.order_code}</strong>
          <p style="margin:6px 0 0;">Status: ${order.status}</p>
          <p style="margin:6px 0 0;">Ödəniş: ${order.payment_status}</p>
        </div>
        <div style="text-align:right;">
          <strong>${Number(order.total_amount).toFixed(2)} ₼</strong>
          <p style="margin:6px 0 0;">${new Date(order.created_at).toLocaleString("az-AZ")}</p>
        </div>
      </div>

      <a class="btn btn-soft" style="display:inline-grid;place-items:center;text-decoration:none;margin-top:12px;" href="./order-detail.html?id=${order.id}">
        Detala bax
      </a>
    </article>
  `;
}

(async function initOrders() {
  const session = await requireAuth();
  if (!session) return;

  await loadComponents();

  const { data, error } = await UserAPI.getOrders();
  if (error) {
    ordersList.innerHTML = `<p>Xəta: ${error.message}</p>`;
    return;
  }

  if (!data?.length) {
    ordersList.innerHTML = `<p>Hələ sifariş yoxdur.</p>`;
    return;
  }

  ordersList.innerHTML = data.map(orderCardTemplate).join("");
})();
