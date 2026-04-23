// ======================================================
// MEYVƏÇİ.AZ - CHAT API
// Thread, mesaj, unread, notifications, realtime
// ======================================================

const ChatAPI = {
  async createOrGetOrderThread(orderId) {
    return await supabaseClient.rpc("create_or_get_order_thread", {
      p_order_id: orderId
    });
  },

  async getThreads() {
    return await supabaseClient
      .from("chat_threads")
      .select(`
        *,
        order:order_id (id, order_code),
        user:user_id (id, first_name, last_name, email),
        courier:courier_id (id, first_name, last_name, email),
        admin:admin_id (id, first_name, last_name, email)
      `)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }).limit(100);
  },

  async getThreadById(threadId) {
    return await supabaseClient
      .from("chat_threads")
      .select(`
        *,
        order:order_id (id, order_code),
        user:user_id (id, first_name, last_name, email),
        courier:courier_id (id, first_name, last_name, email),
        admin:admin_id (id, first_name, last_name, email)
      `)
      .eq("id", threadId)
      .single();
  },

  async getMessages(threadId) {
    return await supabaseClient
      .from("chat_messages")
      .select(`
        *,
        sender:sender_id (id, first_name, last_name, email, avatar_url)
      `)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
  },

  async sendMessage(threadId, messageText, attachmentUrl = null) {
    return await supabaseClient.rpc("send_chat_message", {
      p_thread_id: threadId,
      p_message_text: messageText,
      p_attachment_url: attachmentUrl
    });
  },

  async markThreadRead(threadId) {
    return await supabaseClient.rpc("mark_thread_read", {
      p_thread_id: threadId
    });
  },

  async getUnreadMessageCount() {
    return await supabaseClient.rpc("get_my_unread_message_count");
  },

  async getNotifications() {
    return await supabaseClient
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
  },

  async getUnreadNotificationCount() {
    return await supabaseClient.rpc("get_my_unread_notification_count");
  },

  async markNotificationRead(id) {
    return await supabaseClient
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
  },

  async markAllNotificationsRead() {
    return await supabaseClient
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", (await supabaseClient.auth.getUser()).data.user?.id)
      .eq("is_read", false);
  },

  subscribeToThread(threadId, onMessage) {
    const key = `thread-${threadId}`;
    if (window.__meyveciRealtime.threads.has(key)) {
      return window.__meyveciRealtime.threads.get(key);
    }
    const channel = supabaseClient.channel(key);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `thread_id=eq.${threadId}`
      },
      payload => {
        if (typeof onMessage === "function") onMessage(payload);
      }
    );
    channel.subscribe();
    window.__meyveciRealtime.threads.set(key, channel);
    return channel;
  },

  subscribeToNotifications(userId, onNotification) {
    const key = `notifications-${userId}`;
    if (window.__meyveciRealtime.notifications.has(key)) {
      return window.__meyveciRealtime.notifications.get(key);
    }
    const channel = supabaseClient.channel(key);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      payload => {
        if (typeof onNotification === "function") onNotification(payload);
      }
    );
    channel.subscribe();
    window.__meyveciRealtime.notifications.set(key, channel);
    return channel;
  }
};


window.__meyveciRealtime = window.__meyveciRealtime || { notifications: new Map(), threads: new Map() };
