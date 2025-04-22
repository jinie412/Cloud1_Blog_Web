document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get("id");

  const avatarImg = document.getElementById("avatarImg");
  const authButtons = document.getElementById("authButtons");
  const dropdown = document.getElementById("avatarDropdown");

  const userId = localStorage.getItem("userId");

  // Avatar hoặc nút đăng nhập
  if (userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      const user = await res.json();
      if (user.avatar_url && user.avatar_url.startsWith("http")) {
        avatarImg.src = user.avatar_url;
      } else if (user.avatar_url && user.avatar_url.startsWith("/")) {
        avatarImg.src = `${API_BASE_URL}${user.avatar_url}`;
      } else {
        avatarImg.src = "../img/logo.png";
      }
      avatarImg.classList.remove("hidden");
      authButtons.classList.add("hidden");
    } catch (e) {
      console.log("Lỗi lấy avatar");
    }
  }

  avatarImg.addEventListener("click", () => {
    dropdown.classList.toggle("hidden");
  });

  window.addEventListener("click", (e) => {
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

  // Load bài viết
  const container = document.getElementById("blogContainer");
  if (!postId) {
    container.innerHTML =
      "<p class='text-center text-red-500'>No posts found.</p>";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
    const post = await response.json();

    container.innerHTML = `
  <div class="max-w-3xl mx-auto">
      <img src="${
        post.image_url ? post.image_url : "../img/default.jpg"
      }" alt="Banner" class="w-full rounded-xl h-auto object-cover mb-8 mx-auto" />

      <h1 class="text-4xl font-bold mb-6 text-center">${post.title}</h1>

      <div class="flex items-center justify-between mb-5 px-2 md:px-0 border-b-[0.2px]">
          <div class="flex items-center gap-4 mb-3">
              <img src="${
                post.avatar_url
                  ? post.avatar_url.startsWith("http")
                    ? post.avatar_url
                    : post.avatar_url.startsWith("/")
                      ? `${API_BASE_URL}${post.avatar_url}`
                      : "../img/logo.png"
                  : "../img/logo.png"
              }" alt="Avatar" class="w-10 h-10 rounded-full object-cover border border-gray-300" />
              <div class="text-sm">
                  <p class="font-semibold">${post.username || "Tác giả"}</p>
                  <p class="text-gray-500 text-xs">@${
                    post.username || "user"
                  }</p>
              </div>
          </div>

          <div class="text-sm text-gray-500">
              <p>Published on ${new Date(
                post.created_at
              ).toLocaleDateString()}</p>
          </div>
      </div>

      <div class="text-lg leading-relaxed text-justify px-2 md:px-0">
          ${post.content}
      </div>
  </div>
`;
  } catch (error) {
    container.innerHTML =
      "<p class='text-red-500 text-center'>Lỗi tải bài viết.</p>";
  }

  // Chuyển đến Write Page
  const writeLink = document.querySelector("a.hidden.md\\:flex.gap-2");

  if (writeLink) {
    writeLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "../write/write.html";
    });
  } else {
    console.error("Không tìm thấy thẻ 'a' Write trong DOM.");
  }
});
