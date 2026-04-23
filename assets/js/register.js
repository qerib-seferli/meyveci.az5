const authMessage = document.getElementById("authMessage");
const registerForm = document.getElementById("registerForm");

function showMessage(text, type = "success") {
  authMessage.textContent = text;
  authMessage.className = `auth-message ${type}`;
}

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value
  };

  const submitBtn = registerForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Yaradılır...";

  const { error } = await AuthService.signUp(payload);

  if (error) {
    showMessage(error.message || "Qeydiyyat alınmadı", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Qeydiyyatdan keç";
    return;
  }

  showMessage("Hesab yaradıldı. Email təsdiq linkini yoxla.", "success");
  registerForm.reset();
  submitBtn.disabled = false;
  submitBtn.textContent = "Qeydiyyatdan keç";
});
