// ======================================================
// MEYVƏÇİ.AZ - COMMERCE API
// Reviews, payments, receipts
// ======================================================

const CommerceAPI = {
  async getApprovedReviews(productId) {
    return await supabaseClient
      .from("reviews")
      .select(`
        *,
        profiles:user_id (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("product_id", productId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
  },

  async getMyReview(productId) {
    const { data: userRes } = await supabaseClient.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return { data: null, error: null };

    return await supabaseClient
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle();
  },

  async createOrUpdateReview(productId, rating, reviewText) {
    return await supabaseClient.rpc("create_product_review", {
      p_product_id: productId,
      p_rating: rating,
      p_review_text: reviewText
    });
  },

  async getPaymentsByOrder(orderId) {
    return await supabaseClient
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
  },

  async createOrderPayment(orderId, provider = "manual", transactionRef = null, receiptUrl = null) {
    return await supabaseClient.rpc("create_order_payment", {
      p_order_id: orderId,
      p_provider: provider,
      p_transaction_ref: transactionRef,
      p_receipt_url: receiptUrl
    });
  },

  async attachReceiptToPayment(paymentId, receiptUrl, transactionRef = null) {
    return await supabaseClient.rpc("attach_receipt_to_payment", {
      p_payment_id: paymentId,
      p_receipt_url: receiptUrl,
      p_transaction_ref: transactionRef
    });
  },

  async adminUpdatePaymentStatus(paymentId, status, adminNote = "") {
    return await supabaseClient.rpc("admin_update_payment_status", {
      p_payment_id: paymentId,
      p_status: status,
      p_admin_note: adminNote
    });
  },

  async uploadReceipt(file) {
    const { data: userRes } = await supabaseClient.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) return { data: null, error: new Error("İstifadəçi tapılmadı") };

    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}-receipt.${ext}`;

    const { error } = await supabaseClient.storage
      .from("receipts")
      .upload(path, file, { upsert: true });

    if (error) return { data: null, error };

    const { data } = supabaseClient.storage
      .from("receipts")
      .getPublicUrl(path);

    return { data: data.publicUrl, error: null };
  }
};
