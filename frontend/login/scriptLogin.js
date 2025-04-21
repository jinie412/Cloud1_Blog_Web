document.addEventListener("DOMContentLoaded", function () {
  // Toggle mật khẩu
  const togglePassword = document.getElementById("togglePassword");
  const inputPass = document.getElementById("password");

  if (togglePassword && inputPass) {
    togglePassword.addEventListener("click", function () {
      togglePassword.classList.toggle("fa-eye-slash");
      inputPass.type = inputPass.type === "password" ? "text" : "password";
    });
  }

  // Xử lý submit login
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value.trim();

    if (!username || !password) {
      alert("Please enter Username or Password!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("userId", result.userId);
        window.location.href = "../home/home.html";
      } else {
        alert(result.error || "Wrong account or password.");
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Unable to connect to server.");
    }
  });
});
