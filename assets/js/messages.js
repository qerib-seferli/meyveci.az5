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
  const title =
    thread.order?.order_code
      ? `Sifariş: ${thread.order.order_code}`
      : thread.title || "Söhbət";

  return `
    <article class="thread-item ${activeThreadId === thread.id ? "active" : ""}" data-thread-id="${thread.id}">
      <h4>${title}</h4>
      <p>${thread.thread_type}</p>
    </article>
  `;
}

function messageTemplate(message, myUserId) {
  const mine = message.sender_id === myUserId;
  const senderName = formatPerson(message.sender);

  return `
    <article class="message-item ${mine ? "mine" : ""}">
      <div>${message.message_text}</div>
      <small class="meta">${senderName} • ${new Date(message.created_at).toLocaleString("az-AZ")}</small>
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
    threadList.innerHTML = `<div class="thread-item">Hələ thread yoxdur.</div>`;
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
  if (!activeThreadId) {
    threadHeader.textContent = "Thread seç";
    messageList.innerHTML = "";
    return;
  }

  const [{ data: threadData, error: threadError }, { data: messageData, error: messageError }, userRes] =
    await Promise.all([
      ChatAPI.getThreadById(activeThreadId),
      ChatAPI.getMessages(activeThreadId),
      getCachedUser()
    ]);

  if (threadError || messageError) {
    messageList.innerHTML = `<div class="message-item">Xəta baş verdi.</div>`;
    return;
  }

  const myUserId = userRes.data.user?.id;
  const title =
    threadData.order?.order_code
      ? `Sifariş: ${threadData.order.order_code}`
      : threadData.title || "Söhbət";

  threadHeader.textContent = title;
  messageList.innerHTML = (messageData || []).map(msg => messageTemplate(msg, myUserId)).join("");
  messageList.scrollTop = messageList.scrollHeight;

  await ChatAPI.markThreadRead(activeThreadId);
  await loadUnreadBadge();

  if (threadChannel) {
    supabaseClient.removeChannel(threadChannel);
  }

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

(async function initMessages() {
  const session = await requireAuth();
  if (!session) return;

  await loadComponents();
  await loadThreads();
  await loadMessages();
  await loadUnreadBadge();
})();

window.addEventListener("beforeunload", () => {
  if (threadChannel) supabaseClient.removeChannel(threadChannel);
});
