const ordersTableBody = document.getElementById("ordersTableBody");

(async function initAdminOrders() {
  const ok = await adminPageGuard();
  if (!ok) return;
  await loadAdminSidebar();

  const { data, error } = await AdminAPI.getOrders();
  if (error) {
    ordersTableBody.innerHTML = `<tr><td colspan="6">Xəta: ${error.message}</td></tr>`;
    return;
  }

  ordersTableBody.innerHTML = (data || []).map(order => `
    <tr>
      <td>${order.order_code}</td>
      <td>${order.profiles?.first_name || ""} ${order.profiles?.last_name || ""}</td>
      <td><span class="badge">${order.status}</span></td>
      <td>${order.payment_status}</td>
      <td>${Number(order.total_amount).toFixed(2)} ₼</td>
      <td>
        <div class="action-row">
          <a class="btn btn-soft" href="./order-detail.html?id=${order.id}">Detala bax</a>
        </div>
      </td>
    </tr>
  `).join("");
})();
