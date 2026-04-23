async function assignCourierToOrder(orderId, courierId, note = "") {
  return await supabaseClient.rpc("assign_courier_to_order", {
    p_order_id: orderId,
    p_courier_id: courierId,
    p_note: note
  });
}
