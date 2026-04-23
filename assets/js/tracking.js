let trackingMap;
let homeMarker;
let courierMarker;
let routeLine;
let trackingChannel = null;

const trackingSummary = document.getElementById("trackingSummary");
const statusTimeline = document.getElementById("statusTimeline");
const trackingMeta = document.getElementById("trackingMeta");

function getOrderId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatStatus(status) {
  const map = {
    pending: "Gözləyir",
    confirmed: "Təsdiqləndi",
    preparing: "Hazırlanır",
    on_the_way: "Yoldadır",
    delivered: "Çatdırıldı",
    cancelled: "Ləğv edildi"
  };
  return map[status] || status;
}

function getStatusSteps(currentStatus) {
  const steps = [
    {
      key: "confirmed",
      title: "Sifariş təsdiqləndi",
      text: "Sifariş sistemdə təsdiqlənib.",
      icon: "./assets/img/icon/order-confirmed.png"
    },
    {
      key: "preparing",
      title: "Hazırlanır",
      text: "Məhsullar yığılır və hazırlanır.",
      icon: "./assets/img/icon/order-preparing.png"
    },
    {
      key: "on_the_way",
      title: "Çatdırılmaya çıxıb",
      text: "Kuryer sifarişi gətirir.",
      icon: "./assets/img/icon/order-delivery.png"
    },
    {
      key: "delivered",
      title: "Çatdırıldı",
      text: "Sifariş ünvanına təhvil verildi.",
      icon: "./assets/img/icon/order-delivered.png"
    }
  ];

  const order = ["pending", "confirmed", "preparing", "on_the_way", "delivered"];
  const currentIndex = order.indexOf(currentStatus);

  return steps.map(step => {
    const stepIndex = order.indexOf(step.key);
    return {
      ...step,
      done: currentIndex > stepIndex,
      active: currentStatus === step.key
    };
  });
}

function renderTimeline(status) {
  const steps = getStatusSteps(status);

  statusTimeline.innerHTML = steps.map(step => `
    <article class="status-step ${step.done ? "done" : ""} ${step.active ? "active" : ""}">
      <img src="${step.icon}" alt="${step.title}">
      <div>
        <h4>${step.title}</h4>
        <p>${step.text}</p>
      </div>
    </article>
  `).join("");
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateEtaMinutes(distanceKm, speedKmh = 30) {
  if (!distanceKm || distanceKm <= 0) return 0;
  const minutes = (distanceKm / speedKmh) * 60;
  return Math.max(1, Math.round(minutes));
}

function createIcon(iconUrl, size = 42) {
  return L.icon({
    iconUrl,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 8]
  });
}

function ensureMap(lat, lng) {
  if (trackingMap) return;

  trackingMap = L.map("trackingMap", {
    zoomControl: true
  }).setView([lat, lng], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap"
  }).addTo(trackingMap);
}

function updateMap(address, courierLocation) {
  const homeLat = Number(address?.lat);
  const homeLng = Number(address?.lng);

  if (!Number.isFinite(homeLat) || !Number.isFinite(homeLng)) return;

  ensureMap(homeLat, homeLng);

  const homeLatLng = [homeLat, homeLng];

  if (!homeMarker) {
    homeMarker = L.marker(homeLatLng, {
      icon: createIcon("./assets/img/icon/home-marker.png", 46)
    }).addTo(trackingMap).bindPopup("Çatdırılma ünvanı");
  } else {
    homeMarker.setLatLng(homeLatLng);
  }

  let bounds = [homeLatLng];

  if (courierLocation?.lat && courierLocation?.lng) {
    const courierLatLng = [Number(courierLocation.lat), Number(courierLocation.lng)];

    if (!courierMarker) {
      courierMarker = L.marker(courierLatLng, {
        icon: createIcon("./assets/img/icon/courier-marker.png", 50)
      }).addTo(trackingMap).bindPopup("Kuryer");
    } else {
      courierMarker.setLatLng(courierLatLng);
    }

    if (routeLine) {
      routeLine.setLatLngs([courierLatLng, homeLatLng]);
    } else {
      routeLine = L.polyline([courierLatLng, homeLatLng], {
        weight: 5,
        opacity: 0.9
      }).addTo(trackingMap);
    }

    bounds.push(courierLatLng);
  }

  trackingMap.fitBounds(bounds, {
    padding: [40, 40]
  });
}

function renderSummary(trackingData) {
  const order = trackingData?.order || {};
  const courier = trackingData?.courier || null;

  trackingSummary.innerHTML = `
    <p><strong>Sifariş kodu:</strong> ${order.order_code || "-"}</p>
    <p><strong>Status:</strong> ${formatStatus(order.status)}</p>
    <p><strong>Ödəniş:</strong> ${order.payment_status || "-"}</p>
    <p><strong>Kuryer:</strong> ${courier ? `${courier.first_name || ""} ${courier.last_name || ""}`.trim() || courier.email || "-" : "Hələ təyin olunmayıb"}</p>
    <div class="summary-badge">Canlı yenilənir</div>
  `;
}

function renderMeta(trackingData) {
  const address = trackingData?.address || {};
  const courierLocation = trackingData?.courier_location || null;

  let distance = null;
  let eta = null;

  if (courierLocation?.lat && courierLocation?.lng && address?.lat && address?.lng) {
    distance = calculateDistanceKm(
      Number(courierLocation.lat),
      Number(courierLocation.lng),
      Number(address.lat),
      Number(address.lng)
    );

    eta = estimateEtaMinutes(distance, Number(courierLocation.speed_kmh || 30));
  }

  trackingMeta.innerHTML = `
    <div class="meta-grid">
      <div class="meta-box">
        <strong>Ünvan</strong>
        <span>${address.address_line || "-"}</span>
      </div>
      <div class="meta-box">
        <strong>Məsafə</strong>
        <span>${distance !== null ? `${distance.toFixed(2)} km` : "Hesablanmır"}</span>
      </div>
      <div class="meta-box">
        <strong>Təxmini çatma vaxtı</strong>
        <span>${eta !== null ? `${eta} dəqiqə` : "Hesablanmır"}</span>
      </div>
      <div class="meta-box">
        <strong>Son lokasiya vaxtı</strong>
        <span>${courierLocation?.created_at ? new Date(courierLocation.created_at).toLocaleString("az-AZ") : "Lokasiya yoxdur"}</span>
      </div>
    </div>
  `;
}

async function loadTracking() {
  const orderId = getOrderId();
  if (!orderId) {
    trackingSummary.innerHTML = "Order ID tapılmadı";
    return;
  }

  const { data, error } = await TrackingAPI.getOrderTracking(orderId);

  if (error) {
    trackingSummary.innerHTML = `Xəta: ${error.message}`;
    return;
  }

  renderSummary(data);
  renderTimeline(data?.order?.status || "pending");
  renderMeta(data);
  updateMap(data?.address, data?.courier_location);
}

async function initRealtime() {
  const orderId = getOrderId();
  if (!orderId) return;

  trackingChannel = TrackingAPI.subscribeToTracking(orderId, {
    onOrderUpdate: async () => {
      await loadTracking();
    },
    onLocationUpdate: async () => {
      await loadTracking();
    },
    onAssignmentUpdate: async () => {
      await loadTracking();
    }
  });
}

(async function initTracking() {
  const session = await requireAuth();
  if (!session) return;

  await loadComponents();
  await loadTracking();
  await initRealtime();
})();

window.addEventListener("beforeunload", () => {
  if (trackingChannel) {
    supabaseClient.removeChannel(trackingChannel);
  }
});
