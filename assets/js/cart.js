const cartList = document.getElementById("cartList");
const cartSummary = document.getElementById("cartSummary");

function calcSubtotal(items) {
  return (items || []).reduce((sum, item) => {
    return sum + (Number(item.products?.price || 0) * Number(item.quantity || 0));
  }, 0);
}

function renderSummary(items) {
  const subtotal = calcSubtotal(items);
  const delivery = items.length ? 3.50 : 0;
  const total = subtotal + delivery;

  cartSummary.innerHTML = `
    <h2>Sifariş xülasəsi</h2>
    <div class="summary-line"><span>Məhsullar</span><strong>${subtotal.toFixed(2)} ₼</strong></div>
    <div class="summary-line"><span>Çatdırılma</span><strong>${delivery.toFixed(2)} ₼</strong></div>
    <hr style="border:none;border-top:1px solid #edf2ee;margin:14px 0;" />
    <div class="summary-line"><span>Cəmi</span><strong>${total.toFixed(2)} ₼</strong></div>
    <a href="./checkout.html" class="btn btn-primary btn-full" style="display:grid;place-items:center;text-decoration:none;margin-top:16px;">
      Checkout
    </a>
  `;
}

function renderCartItems(items) {
  if (!items.length) {
    cartList.innerHTML = `<div class="card">Səbətin boşdur.</div>`;
    renderSummary([]);
    return;
  }

  cartList.innerHTML = items.map(item => `
    <article class="cart-item">
      <img src="${item.products?.image_url || './assets/img/placeholders/product-placeholder.png'}" alt="${item.products?.name || ''}" />
      <div>
        <div class="cart-row">
          <h3 style="margin:0;">${item.products?.name || "-"}</h3>
          <button class="btn btn-soft" onclick="removeItem('${item.id}')">Sil</button>
        </div>

        <p>${Number(item.products?.price || 0).toFixed(2)} ₼ / ${item.products?.unit || 'ədəd'}</p>

        <div class="cart-controls">
          <label>Miqdar</label>
          <input type="number" min="1" value="${item.quantity}" onchange="changeQty('${item.id}', this.value)" />
        </div>
      </div>
    </article>
  `).join("");

  renderSummary(items);
}

async function loadCart() {
  const session = await requireAuth();
  if (!session) return;

  const { data, error } = await UserAPI.getCart();

  if (error) {
    cartList.innerHTML = `<div class="card">Xəta: ${error.message}</div>`;
    return;
  }

  renderCartItems(data || []);
}

async function changeQty(itemId, quantity) {
  const { error } = await UserAPI.updateCartItem(itemId, Number(quantity));
  if (error) {
    alert(error.message || "Miqdar yenilənmədi");
    return;
  }
  await loadCart();
}

async function removeItem(itemId) {
  const { error } = await UserAPI.removeCartItem(itemId);
  if (error) {
    alert(error.message || "Silinmədi");
    return;
  }
  await loadCart();
}

(async function initCart() {
  await loadComponents();
  await loadCart();
})();
