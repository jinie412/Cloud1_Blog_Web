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

  const form = document.getElementById("signupForm");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!username || !password || !email) {
      alert("Please enter complete information.");
      return;
    }
    if (!email.includes("@")) {
      alert("Invalid email!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, email }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          "Registration successful! You will be redirected to the login page."
        );
        window.location.href = "./login.html";
      } else {
        // Hiển thị thông báo tùy vào loại lỗi trả về từ server
        if (result.error && result.error.includes("tồn tại")) {
          alert("The username is already in use. Please choose another one.");
        } else {
          alert("Registration failed. Please try again later!");
        }
      }
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Unable to connect to server.");
    }
  });
});
