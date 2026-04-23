let activeThreadId = null;
let threadChannel = null;

const threadList = document.getElementById("threadList");
const threadHeader = document.getElementById("threadHeader");
const messageList = document.getElementById("messageList");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

function getThreadIdFromUrl() {
  return new URLSearchParams(window.location.search).get("thread");
}

function formatPerson(person) {
  if (!person) return "-";
  return `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email || "-";
}

function threadTemplate(thread) {
  const title = thread.order?.order_code ? `Sifariş: ${thread.order.order_code}` : (thread.title || "Söhbət");
  const userName = formatPerson(thread.user);
  const courierName = formatPerson(thread.courier);

  return `
    <article class="thread-item ${activeThreadId === thread.id ? "active" : ""}" data-thread-id="${thread.id}">
      <h4>${title}</h4>
      <p>İstifadəçi: ${userName}</p>
      <p>Kuryer: ${courierName}</p>
    </article>
  `;
}

function messageTemplate(message, myUserId) {
  const mine = message.sender_id === myUserId;
  const senderName = formatPerson(message.sender);
  return `
    <article class="message-item ${mine ? "mine" : ""}">
      <div>${message.message_text}</div>
      <small class="meta">${senderName} • ${message.sender_role} • ${new Date(message.created_at).toLocaleString("az-AZ")}</small>
    </article>
  `;
}

async function loadUnreadBadge() {
  const unread = await ChatAPI.getUnreadMessageCount();
  setBadgeValue("#messageCountBadge", unread.data || 0);
}

async function loadThreads() {
  const { data, error } = await ChatAPI.getThreads();
  if (error) {
    threadList.innerHTML = `<div class="thread-item">Xəta: ${error.message}</div>`;
    return;
  }

  if (!data?.length) {
    threadList.innerHTML = `<div class="thread-item">Thread yoxdur.</div>`;
    return;
  }

  if (!activeThreadId) {
    activeThreadId = getThreadIdFromUrl() || data[0].id;
  }

  threadList.innerHTML = data.map(threadTemplate).join("");

  document.querySelectorAll(".thread-item").forEach(item => {
    item.addEventListener("click", async () => {
      activeThreadId = item.dataset.threadId;
      await loadThreads();
      await loadMessages();
    });
  });
}

async function loadMessages() {
  if (!activeThreadId) return;

  const [{ data: threadData }, { data: messageData }, userRes] = await Promise.all([
    ChatAPI.getThreadById(activeThreadId),
    ChatAPI.getMessages(activeThreadId),
    supabaseClient.auth.getUser()
  ]);

  const myUserId = userRes.data.user?.id;
  threadHeader.textContent = threadData?.order?.order_code ? `Sifariş: ${threadData.order.order_code}` : (threadData?.title || "Söhbət");
  messageList.innerHTML = (messageData || []).map(msg => messageTemplate(msg, myUserId)).join("");
  messageList.scrollTop = messageList.scrollHeight;

  await ChatAPI.markThreadRead(activeThreadId);
  await loadUnreadBadge();

  if (threadChannel) supabaseClient.removeChannel(threadChannel);
  threadChannel = ChatAPI.subscribeToThread(activeThreadId, async () => {
    await loadMessages();
  });
}

messageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = messageInput.value.trim();
  if (!text || !activeThreadId) return;

  const { error } = await ChatAPI.sendMessage(activeThreadId, text);
  if (error) {
    showToast(error.message || "Mesaj göndərilmədi", "error");
    return;
  }

  messageInput.value = "";
  await loadMessages();
});

(async function initAdminMessages() {
  const ok = await adminPageGuard();
  if (!ok) return;

  await loadAdminSidebar();
  await loadThreads();
  await loadMessages();
  await loadUnreadBadge();
})();
