document.addEventListener("DOMContentLoaded", async function () {
  const userId = localStorage.getItem("userId");
  const avatarImg = document.getElementById("avatarImg");
  const authButtons = document.getElementById("authButtons");
  const usernameInput = document.querySelector("#username");
  const emailInput = document.querySelector("#email");
  const bioTextarea = document.getElementById("bio");
  const bioCharCount = document.getElementById("bio-char-count");
  const uploadPhotoInput = document.getElementById("upload-photo");
  const previewPhoto = document.getElementById("preview-photo");

  // Hiển thị avatar nếu có user đăng nhập
  if (userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      const result = await response.json();

      if (response.ok) {
        authButtons.classList.add("hidden");
        if (result.avatar_url && result.avatar_url.startsWith("/")) {
          avatarImg.src = `${API_BASE_URL}${result.avatar_url}`; // Nếu là đường dẫn tương đối, thêm tiền tố backend
        } else {
          avatarImg.src = "../img/logo.png"; // Sử dụng ảnh mặc định nếu không có URL hoặc định dạng không xác định
        }
        avatarImg.classList.remove("hidden");
      } else {
        localStorage.removeItem("userId");
      }
    } catch (error) {
      console.error("Lỗi lấy avatar:", error);
    }
  }

  if (avatarImg) {
    // Dropdown avatar
    avatarImg.addEventListener("click", function () {
      const dropdown = document.getElementById("avatarDropdown");
      dropdown.classList.toggle("hidden");
    });

    // Ẩn dropdown
    window.addEventListener("click", function (e) {
      const dropdown = document.getElementById("avatarDropdown");
      if (!avatarImg.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });

    // Lấy các phần tử trong dropdown
    const dashboardDiv = avatarDropdown.children[0];
    const settingsDiv = avatarDropdown.children[1];
    const signOutDiv = avatarDropdown.children[2];

    // Dashboard
    dashboardDiv.addEventListener("click", () => {
      window.location.href = "../dashboard/dashboard.html";
    });

    // Settings
    settingsDiv.addEventListener("click", () => {
      window.location.href = "../settings/setting_edit-profile.html";
    });

    // Sign out
    signOutDiv.addEventListener("click", () => {
      localStorage.removeItem("userId");
      alert("Logged out!");
      window.location.href = "../login/login.html";
    });
  } else {
    console.error("Không tìm thấy phần tử avatarImg!");
  }

  // Hàm để lấy thông tin người dùng
  async function fetchUserProfile() {
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
        const user = await response.json();

        if (response.ok) {
          usernameInput.value = user.username || "";
          emailInput.value = user.email || "";
          bioTextarea.value = user.bio || "";
          updateBioCharCount(user.bio ? user.bio.length : 0); // Cập nhật số ký tự ban đầu

          // Kiểm tra định dạng avatar_url và xây dựng src cho previewPhoto
          if (user.avatar_url && user.avatar_url.startsWith("http")) {
            previewPhoto.src = user.avatar_url; // Nếu là URL đầy đủ, sử dụng trực tiếp
          } else if (user.avatar_url && user.avatar_url.startsWith("/")) {
            previewPhoto.src = `${API_BASE_URL}${user.avatar_url}`; // Nếu là đường dẫn tương đối, thêm tiền tố backend
          } else {
            previewPhoto.src = "../img/logo.png"; // Sử dụng ảnh mặc định nếu không có URL hoặc định dạng không xác định
          }
        } else {
          console.error("Lỗi khi lấy thông tin người dùng:", user.error);
          // Xử lý lỗi
        }
      } catch (error) {
        console.error("Lỗi kết nối khi lấy thông tin người dùng:", error);
        // Xử lý lỗi kết nối
      }
    } else {
      window.location.href = "../login/login.html";
    }
  }

  // Gọi hàm để lấy thông tin người dùng khi trang tải
  fetchUserProfile();

  // Hàm để cập nhật số ký tự còn lại của Bio
  function updateBioCharCount(currentLength) {
    const maxLength = 200;
    const remaining = maxLength - currentLength;
    bioCharCount.textContent = `${remaining} characters left`;
    if (remaining < 0) {
      bioCharCount.classList.add("text-red-500");
    } else {
      bioCharCount.classList.remove("text-red-500");
    }
  }

  // Lắng nghe sự kiện input trên textarea Bio
  bioTextarea.addEventListener("input", function () {
    updateBioCharCount(this.value.length);
  });

  // Xử lý khi tải ảnh lên (chỉ cập nhật preview)
  uploadPhotoInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        previewPhoto.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Xử lý sự kiện click nút "Update"
  const updateButton = document.querySelector(".btn-update");
  updateButton.addEventListener("click", handleUpdateProfile);

  async function handleUpdateProfile() {
    if (!userId) {
      alert("You are not logged in.");
      return;
    }

    const bio = bioTextarea.value;
    const avatarFile = uploadPhotoInput.files[0]; // Lấy tệp đã chọn

    const formData = new FormData();
    formData.append("bio", bio);
    if (avatarFile) {
      formData.append("avatar", avatarFile); // Gửi tệp với tên 'avatar' (phải khớp với backend)
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        body: formData, // Gửi FormData thay vì JSON
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        if (result.avatar_url) {
          // Cập nhật ảnh avatar trên giao diện nếu thành công
          avatarImg.src = result.avatar_url;
        }
      } else {
        alert(`Update error: ${result.error || "An error occurred."}`);
      }
    } catch (error) {
      console.error("Lỗi kết nối khi cập nhật thông tin:", error);
      alert("Connection error while updating information.");
    }
  }
});

// document.addEventListener("DOMContentLoaded", function () {
//     const editProfileBtn = document.getElementById("editProfileBtn");
//     const changePasswordBtn = document.getElementById("changePasswordBtn");
//     const editProfileSection = document.getElementById("editProfile");
//     const changePasswordSection = document.getElementById("changePassword");

//     editProfileBtn.addEventListener("click", function () {
//         editProfileSection.classList.remove("hidden");
//         changePasswordSection.classList.add("hidden");
//     });

//     changePasswordBtn.addEventListener("click", function () {
//         changePasswordSection.classList.remove("hidden");
//         editProfileSection.classList.add("hidden");
//     });
// });

// Xử lý đổi mật khẩu
const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

// Chỉ thêm event nếu đang ở trang đổi mật khẩu
if (currentPasswordInput && newPasswordInput && confirmPasswordInput) {
  const changePasswordBtn = document.querySelector(".btn-update");

  changePasswordBtn?.addEventListener("click", async () => {
    const userId = localStorage.getItem("userId");
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return alert("Please fill in all information.");
    }

    if (newPassword !== confirmPassword) {
      return alert("New password and confirmation do not match.");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users/${userId}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("Password changed successfully!");
        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";
      } else {
        alert(result.message || "An error occurred.");
      }
    } catch (err) {
      console.error("Lỗi kết nối đổi mật khẩu:", err);
      alert("Unable to connect to server.");
    }
  });
}
