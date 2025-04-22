document.addEventListener("DOMContentLoaded", async function () {
  const userId = localStorage.getItem("userId");
  const avatarImg = document.getElementById("avatarImg");
  const authButtons = document.getElementById("authButtons");
  // Hiển thị avatar nếu có user đăng nhập
  if (userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
      const result = await response.json();

      if (response.ok) {
        authButtons.classList.add("hidden");

        if (result.avatar_url && result.avatar_url.startsWith("http")) {
          avatarImg.src = result.avatar_url;
        } else if (result.avatar_url && result.avatar_url.startsWith("/")) {
          avatarImg.src = `${API_BASE_URL}${result.avatar_url}`;
        } else {
          avatarImg.src = "../img/logo.png";
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
});

// Xử lí sự kiện
document.addEventListener("DOMContentLoaded", () => {
  const blogListContainer = document.querySelector(".blog-list");
  const searchInput = document.getElementById("manageSearchInput");
  const userId = localStorage.getItem("userId");

  if (!userId) {
    console.error("Không tìm thấy ID người dùng.");
    return;
  }

  let allPosts = [];

  async function fetchUserPosts() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/posts`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      allPosts = await response.json(); // Lưu toàn bộ bài viết
      displayUserPosts(allPosts);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bài viết:", error);
      blogListContainer.innerHTML = "<p>Không thể tải danh sách bài viết.</p>";
    }
  }

  function displayUserPosts(posts) {
    blogListContainer.innerHTML = "";

    if (posts.length === 0) {
      blogListContainer.innerHTML = "<p>Không tìm thấy bài viết nào.</p>";
      return;
    }

    posts.forEach((post) => {
      // Tạo blogCard tương tự như bạn đã làm
      const blogCardLink = document.createElement("a");
      blogCardLink.href = `../blog/blog.html?id=${post.id}`;
      blogCardLink.classList.add("blog-card-link");
      blogCardLink.style.textDecoration = "none";

      const blogCard = document.createElement("div");
      blogCard.classList.add("blog-card");

      const image = document.createElement("img");
      let imageUrl = post.image_url;
      if (imageUrl && imageUrl.startsWith("/uploads")) {
        imageUrl = `${API_BASE_URL}` + imageUrl;
      }
      image.src = imageUrl || "../img/default.jpg";
      image.classList.add("blog-img");

      const infoDiv = document.createElement("div");
      infoDiv.classList.add("blog-info");

      const titleHeading = document.createElement("h3");
      titleHeading.textContent = post.title;

      const dateParagraph = document.createElement("p");
      const publishedDate = new Date(post.created_at).toLocaleDateString(
        "vi-VN",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
      dateParagraph.textContent = `Published on ${publishedDate}`;

      const actionsDiv = document.createElement("div");
      actionsDiv.classList.add("blog-actions");

      const editLink = document.createElement("a");
      editLink.href = `../write/write.html?id=${post.id}`;
      editLink.classList.add("edit");
      editLink.textContent = "Edit";

      const deleteLink = document.createElement("a");
      deleteLink.href = "#";
      deleteLink.classList.add("delete");
      deleteLink.textContent = "Delete";

      deleteLink.addEventListener("click", async (e) => {
        e.preventDefault();
        if (confirm("Bạn có chắc muốn xóa bài viết này?")) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              alert("Blog deleted!");
              fetchUserPosts();
            }
          } catch (err) {
            console.error("Lỗi khi xóa bài viết:", err);
          }
        }
      });

      actionsDiv.appendChild(editLink);
      actionsDiv.appendChild(deleteLink);
      infoDiv.appendChild(titleHeading);
      infoDiv.appendChild(dateParagraph);
      infoDiv.appendChild(actionsDiv);

      blogCard.appendChild(image);
      blogCard.appendChild(infoDiv);
      blogCardLink.appendChild(blogCard);
      blogListContainer.appendChild(blogCardLink);
    });
  }

  // Sự kiện tìm kiếm theo tiêu đề
  searchInput.addEventListener("input", function () {
    const keyword = searchInput.value.toLowerCase().trim();
    const filteredPosts = allPosts.filter((post) =>
      post.title.toLowerCase().includes(keyword)
    );
    displayUserPosts(filteredPosts);
  });

  // Gọi hàm fetch bài viết ban đầu
  fetchUserPosts();
});
