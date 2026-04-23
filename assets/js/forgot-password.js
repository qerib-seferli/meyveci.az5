const authMessage = document.getElementById("authMessage");
const forgotForm = document.getElementById("forgotForm");

function showMessage(text, type = "success") {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

forgotForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const { error } = await AuthService.forgotPassword(email);

  if (error) {
    showMessage(error.message || "Link göndərilmədi", "error");
    return;
  }

  showMessage("Şifrə bərpa linki email-ə göndərildi.", "success");
});
