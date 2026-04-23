const orderBox = document.getElementById("orderBox");
const paymentBox = document.getElementById("paymentBox");
const paymentForm = document.getElementById("paymentForm");

function getOrderId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function renderOrder(order) {
  const itemsHtml = (order.order_items || []).map(item => `
    <div class="order-item-row">
      <div>
        <strong>${item.product_name}</strong>
        <p style="margin:6px 0 0;">${item.quantity} × ${Number(item.unit_price).toFixed(2)} ₼</p>
      </div>
      <strong>${Number(item.line_total).toFixed(2)} ₼</strong>
    </div>
  `).join("");

  return `
    <h1>Sifariş detalı</h1>
    <p><strong>Kod:</strong> ${order.order_code}</p>
    <p><strong>Status:</strong> ${order.status}</p>
    <p><strong>Ödəniş statusu:</strong> ${order.payment_status}</p>
    <p><strong>Çatdırılma ünvanı:</strong> ${order.addresses?.address_line || "-"}</p>
    <p><strong>Qeyd:</strong> ${order.customer_note || "-"}</p>

    <hr style="border:none;border-top:1px solid #edf2ee;margin:18px 0;" />

    <h3>Məhsullar</h3>
    ${itemsHtml || "<p>Məhsul yoxdur.</p>"}

    <hr style="border:none;border-top:1px solid #edf2ee;margin:18px 0;" />
    <p><strong>Ara cəm:</strong> ${Number(order.subtotal).toFixed(2)} ₼</p>
    <p><strong>Çatdırılma:</strong> ${Number(order.delivery_fee).toFixed(2)} ₼</p>
    <p><strong>Endirim:</strong> ${Number(order.discount_amount).toFixed(2)} ₼</p>
    <p><strong>Yekun:</strong> ${Number(order.total_amount).toFixed(2)} ₼</p>

    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px;">
      <a class="btn btn-primary" style="display:inline-grid;place-items:center;text-decoration:none;" href="./tracking.html?id=${order.id}">
        Tracking aç
      </a>
      <button class="btn btn-soft" onclick="openOrderChat('${order.id}')">Chat aç</button>
    </div>
  `;
}

async function openOrderChat(orderId) {
  const { data, error } = await ChatAPI.createOrGetOrderThread(orderId);
  if (error) {
    alert(error.message || "Chat açılmadı");
    return;
  }

  window.location.href = `./messages.html?thread=${data}`;
}

async function renderPayments(orderId) {
  const { data, error } = await CommerceAPI.getPaymentsByOrder(orderId);

  if (error) {
    paymentBox.innerHTML = `Xəta: ${error.message}`;
    return;
  }

  if (!data?.length) {
    paymentBox.innerHTML = `<p>Hələ payment yaradılmayıb.</p>`;
    return;
  }

  paymentBox.innerHTML = data.map(item => `
    <div class="card" style="margin-top:12px;">
      <p><strong>Provider:</strong> ${item.provider}</p>
      <p><strong>Status:</strong> ${item.status}</p>
      <p><strong>Məbləğ:</strong> ${Number(item.amount).toFixed(2)} ₼</p>
      <p><strong>Transaction ref:</strong> ${item.transaction_ref || "-"}</p>
      <p><strong>Receipt:</strong> ${item.receipt_url ? `<a href="${item.receipt_url}" target="_blank">Aç</a>` : "-"}</p>
      <p><strong>Admin note:</strong> ${item.admin_note || "-"}</p>
    </div>
  `).join("");
}

paymentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderId = getOrderId();
  const provider = document.getElementById("paymentProvider").value;
  const transactionRef = document.getElementById("transactionRef").value.trim();
  const receiptFile = document.getElementById("receiptFile").files[0];

  let receiptUrl = null;

  if (receiptFile) {
    const upload = await CommerceAPI.uploadReceipt(receiptFile);
    if (upload.error) {
      alert(upload.error.message || "Receipt yüklənmədi");
      return;
    }
    receiptUrl = upload.data;
  }

  const { data, error } = await CommerceAPI.createOrderPayment(orderId, provider, transactionRef || null, receiptUrl);
  if (error) {
    alert(error.message || "Payment yaradılmadı");
    return;
  }

  alert("Payment məlumatı göndərildi");
  await renderPayments(orderId);
});

(async function initOrderDetail() {
  const session = await requireAuth();
  if (!session) return;

  await loadComponents();

  const orderId = getOrderId();
  if (!orderId) {
    orderBox.innerHTML = "Sifariş ID tapılmadı.";
    return;
  }

  const { data, error } = await UserAPI.getOrderById(orderId);
  if (error || !data) {
    orderBox.innerHTML = `Xəta: ${error?.message || "Tapılmadı"}`;
    return;
  }

  orderBox.innerHTML = renderOrder(data);
  await renderPayments(orderId);
})();
