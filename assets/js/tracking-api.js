// ======================================================
// MEYVƏÇİ.AZ - TRACKING API
// Tracking və courier realtime əməliyyatları
// ======================================================

const TrackingAPI = {
  async getOrderTracking(orderId) {
    return await supabaseClient.rpc("get_order_tracking", {
      p_order_id: orderId
    });
  },

  async updateCourierLocation({
    orderId,
    lat,
    lng,
    heading = null,
    speedKmh = null,
    accuracyM = null
  }) {
    return await supabaseClient.rpc("upsert_courier_location", {
      p_order_id: orderId,
      p_lat: lat,
      p_lng: lng,
      p_heading: heading,
      p_speed_kmh: speedKmh,
      p_accuracy_m: accuracyM
    });
  },

  async updateOrderStatus(orderId, status) {
    return await supabaseClient.rpc("courier_update_order_status", {
      p_order_id: orderId,
      p_status: status
    });
  },

  subscribeToTracking(orderId, { onOrderUpdate, onLocationUpdate, onAssignmentUpdate }) {
    const channel = supabaseClient.channel(`tracking-${orderId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `id=eq.${orderId}`
      },
      payload => {
        if (typeof onOrderUpdate === "function") onOrderUpdate(payload);
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courier_locations",
        filter: `order_id=eq.${orderId}`
      },
      payload => {
        if (typeof onLocationUpdate === "function") onLocationUpdate(payload);
      }
    );

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "courier_assignments",
        filter: `order_id=eq.${orderId}`
      },
      payload => {
        if (typeof onAssignmentUpdate === "function") onAssignmentUpdate(payload);
      }
    );

    channel.subscribe();
    return channel;
  }
};
