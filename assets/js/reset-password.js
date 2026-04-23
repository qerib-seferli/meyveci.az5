const authMessage = document.getElementById("authMessage");
const resetForm = document.getElementById("resetForm");

function showMessage(text, type = "success") {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

resetForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const newPassword = document.getElementById("newPassword").value;
  const { error } = await AuthService.updatePassword(newPassword);

  if (error) {
    showMessage(error.message || "Şifrə yenilənmədi", "error");
    return;
  }

  showMessage("Şifrə uğurla yeniləndi. İndi daxil ola bilərsən.", "success");
  setTimeout(() => {
    window.location.href = "./login.html";
  }, 1200);
});
