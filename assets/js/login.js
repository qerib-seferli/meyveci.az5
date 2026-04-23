// ======================================================
// LOGIN PAGE LOGIC
// ======================================================

const authMessage = document.getElementById("authMessage");
const loginForm = document.getElementById("loginForm");
const otpForm = document.getElementById("otpForm");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const appleLoginBtn = document.getElementById("appleLoginBtn");

function showMessage(text, type = "success") {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Yoxlanılır...";

  const { error } = await AuthService.signIn({ email, password });

  if (error) {
    showMessage(error.message || "Daxilolma alınmadı", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Daxil ol";
    return;
  }

  showMessage("Uğurla daxil oldun. Yönləndirilirsən...", "success");
  await redirectAfterLogin();
});

otpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("otpEmail").value.trim();
  const { error } = await AuthService.sendOtp(email);

  if (error) {
    showMessage(error.message || "OTP göndərilmədi", "error");
    return;
  }

  showMessage("OTP / magic link email-ə göndərildi.", "success");
});

googleLoginBtn?.addEventListener("click", async () => {
  const { error } = await AuthService.signInWithGoogle();
  if (error) showMessage(error.message || "Google login xətası", "error");
});

appleLoginBtn?.addEventListener("click", async () => {
  const { error } = await AuthService.signInWithApple();
  if (error) showMessage(error.message || "Apple login xətası", "error");
});
