document.addEventListener("DOMContentLoaded", () => {
  let selectedBannerFile = null; // Biến toàn cục lưu ảnh

  const bannerUpload = document.getElementById("bannerUpload");
  const bannerInput = document.getElementById("bannerInput"); // Input trên trang Write
  const blogTitleInput = document.getElementById("blogTitle");
  const blogContentInput = document.getElementById("blogContent");
  const publishBtnWritePage = document.getElementById("publish");
  const previewTitleDisplay = document.getElementById("displayTitle");
  const previewImage = document.getElementById("previewImage");
  const closePreviewBtn = document.getElementById("closePreview");
  const publishBtnPreviewPage = document.querySelector(".publish-btn");
  const topicInputWritePage = document.getElementById("blogTopic"); // Input trên trang Write
  const descriptionInputPreview = document.getElementById("blogDescription");
  const descriptionCountDisplay = document.getElementById("descriptionCount");

  function updateCharCount() {
    const countSpan = document.getElementById("descriptionCount");
    if (countSpan && descriptionInputPreview) {
      countSpan.textContent =
        descriptionInputPreview.value.length + "/200 characters";
    }
  }
  // Mới thêm
  async function uploadBase64ImageToS3(base64Data, filename = "banner.jpg") {
    try {
      const response = await fetch(`${API_BASE_URL}/api/s3/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base64Image: base64Data,
          filename,
        }),
      });

      const result = await response.json();

      if (response.ok && result.url) {
        return result.url; // Trả về URL đã upload lên S3
      } else {
        console.error("Upload ảnh S3 thất bại:", result);
        return null;
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh S3:", error);
      return null;
    }
  }

  // Lưu trạng thái ban đầu của trang Write khi tải
  const initialWriteState = {
    title: blogTitleInput ? blogTitleInput.value : "",
    content: blogContentInput ? blogContentInput.value : "",
    banner: bannerUpload ? bannerUpload.style.backgroundImage : "",
    bannerText: bannerUpload ? bannerUpload.textContent : "",
  };

  // Handle banner upload on Write Page (chỉ hiển thị preview và lưu tệp vào biến)
  if (bannerUpload && bannerInput) {
    bannerUpload.addEventListener("click", () => bannerInput.click());
    bannerInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        selectedBannerFile = file; // Lưu tệp vào biến
        const reader = new FileReader();
        reader.onload = (e) => {
          bannerUpload.style.backgroundImage = `url(${e.target.result})`;
          bannerUpload.style.backgroundSize = "cover";
          bannerUpload.style.backgroundPosition = "center";
          bannerUpload.textContent = "";
          //localStorage.setItem("blogImageForPreview", e.target.result); // Vẫn giữ để hiển thị preview - Hân cmt lại
        };
        reader.readAsDataURL(file);
      } else {
        selectedBannerFile = null; // Xóa biến nếu không có tệp nào được chọn
        bannerUpload.style.backgroundImage = "";
        bannerUpload.style.backgroundColor = "#e5e7eb";
        bannerUpload.textContent = "Upload Banner";
        //localStorage.removeItem("blogImageForPreview");
      }
    });
  }

  const urlParamsWrite = new URLSearchParams(window.location.search);
  const editPostId = urlParamsWrite.get("id");
  const isWritePage = window.location.pathname.includes("write.html");
  const urlParams = new URLSearchParams(window.location.search);

  const descriptionFromUrl = urlParams.get("des");

  // Kiểm tra xem có từ trang Preview quay lại không - trang write
  const fromPreviewBack = localStorage.getItem("fromPreviewBack") === "true";

  if (localStorage.getItem("justPublished")) {
    localStorage.removeItem("justPublished");
  } else if (isWritePage && !editPostId && !fromPreviewBack) {
    // Viết bài mới thực sự: reset form
    localStorage.removeItem("blogTitle");
    localStorage.removeItem("blogContent");
    localStorage.removeItem("currentBannerPreview");
    localStorage.removeItem("blogTopic");
    sessionStorage.removeItem("rawBannerFile");
    localStorage.removeItem("blogDescription");

    if (blogTitleInput) blogTitleInput.value = "";
    if (blogContentInput) blogContentInput.value = "";
    if (bannerUpload) {
      bannerUpload.style.backgroundImage = "";
      bannerUpload.textContent = "Click to upload a banner";
      bannerUpload.style.backgroundColor = "#e5e7eb";
    }
    if (topicInputWritePage) topicInputWritePage.value = "";
  }

  if (!editPostId && fromPreviewBack && isWritePage) {
    localStorage.removeItem("fromPreviewBack");

    if (blogTitleInput)
      blogTitleInput.value = localStorage.getItem("blogTitle") || "";
    if (blogContentInput)
      blogContentInput.value = localStorage.getItem("blogContent") || "";
    if (topicInputWritePage)
      topicInputWritePage.value = localStorage.getItem("blogTopic") || "";

    const rawBanner = sessionStorage.getItem("rawBannerFile");
    if (bannerUpload && rawBanner) {
      // Ẩn tạm để reset ảnh trước khi set
      bannerUpload.style.opacity = "0";
      setTimeout(() => {
        bannerUpload.style.backgroundImage = `url(${rawBanner})`;
        bannerUpload.style.backgroundSize = "cover";
        bannerUpload.style.backgroundPosition = "center";
        bannerUpload.textContent = "";
        bannerUpload.style.opacity = "1";
      }, 50);
    }
  }

  let loadedDescription = "";
  let loadedTopicId = "";
  let loadedTopicName = "";

  // Khi edit bài blog
  async function loadBlogForEdit(postId) {
    if (postId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
        const blogData = await response.json();
        //console.log("Dữ liệu nhận được từ API:", blogData);

        if (response.ok) {
          // Gán nội dung bài viết
          if (blogTitleInput) blogTitleInput.value = blogData.title || "";
          if (blogContentInput) blogContentInput.value = blogData.content || "";

          // Gán các biến mô tả và topic
          loadedDescription = blogData.des || "";
          loadedTopicId = blogData.topic_id || "";
          loadedTopicName = await getTopicNameFromBackend(loadedTopicId);
          if (topicInputWritePage) {
            topicInputWritePage.value = loadedTopicName;
          }

          if (bannerUpload && blogData.image_url) {
            const isInternal = blogData.image_url.startsWith("/");
            const imageUrl = isInternal
              ? `${API_BASE_URL}${blogData.image_url}`
              : blogData.image_url;

            bannerUpload.style.backgroundImage = `url(${imageUrl})`;
            bannerUpload.style.backgroundSize = "cover";
            bannerUpload.style.backgroundPosition = "center";
            bannerUpload.textContent = "";

            // ✅ Chỉ fetch nếu là ảnh nội bộ (local), tránh lỗi CORS với ảnh từ S3
            if (isInternal) {
              fetch(imageUrl)
                .then((res) => res.blob())
                .then((blob) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    localStorage.setItem("currentBannerPreview", reader.result);
                  };
                  reader.readAsDataURL(blob);
                });
            } else {
              // Với ảnh từ S3, dùng trực tiếp URL (nếu cần preview sau có thể đọc từ link)
              localStorage.setItem("currentBannerPreview", imageUrl);
            }
          }
        } else {
          console.error("Lỗi khi tải bài viết để chỉnh sửa:", blogData.error);
          alert("Unable to load blog for editing.");
        }
      } catch (error) {
        console.error("Lỗi:", error);
        alert("Connection error while loading blog.");
      }
    }
  }

  // Kiểm tra xem có từ trang preview quay lại không - Phần edit
  if (editPostId && !fromPreviewBack) {
    loadBlogForEdit(editPostId);
  }

  if (fromPreviewBack) {
    localStorage.removeItem("fromPreviewBack");

    if (editPostId) {
      //  Đây là khi QUAY LẠI từ preview ở CHẾ ĐỘ EDIT
      if (blogTitleInput)
        blogTitleInput.value = localStorage.getItem("blogTitle") || "";
      if (blogContentInput)
        blogContentInput.value = localStorage.getItem("blogContent") || "";
      if (topicInputWritePage)
        topicInputWritePage.value =
          decodeURIComponent(urlParams.get("topic")) || "";

      const rawBanner = sessionStorage.getItem("rawBannerFile");

      if (bannerUpload && rawBanner) {
        bannerUpload.style.opacity = "0";
        setTimeout(() => {
          bannerUpload.style.backgroundImage = `url(${rawBanner})`;
          bannerUpload.style.backgroundSize = "cover";
          bannerUpload.style.backgroundPosition = "center";
          bannerUpload.textContent = "";
          bannerUpload.style.opacity = "1";
        }, 50);
      }
    }
  }

  // Publish on Write Page (lưu Data URL cho Preview)
  if (publishBtnWritePage) {
    publishBtnWritePage.addEventListener("click", function () {
      let title = blogTitleInput.value.trim();
      let content = blogContentInput.value.trim();
      let previewUrl = "preview.html";

      localStorage.setItem("blogTitle", title || "Untitled Blog");
      localStorage.setItem("blogContent", content);
      if (topicInputWritePage) {
        localStorage.setItem("blogTopic", topicInputWritePage.value.trim());
      }

      // Lưu ảnh thật vào sessionStorage (dùng FileReader & Blob base64)
      if (selectedBannerFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
          sessionStorage.setItem("rawBannerFile", e.target.result);
          window.location.href =
            previewUrl +
            (editPostId
              ? `?id=${editPostId}&des=${encodeURIComponent(
                  loadedDescription
                )}&topic=${encodeURIComponent(loadedTopicName)}`
              : "");
        };
        reader.readAsDataURL(selectedBannerFile);
      } else {
        // KHÔNG xoá nếu đã có rawBannerFile từ trước để cho phần edit <-> preview không bị mất dữ liệu ảnh
        const existing = sessionStorage.getItem("rawBannerFile");
        if (!existing) {
          sessionStorage.removeItem("rawBannerFile");
        }

        window.location.href =
          previewUrl +
          (editPostId
            ? `?id=${editPostId}&des=${encodeURIComponent(
                loadedDescription
              )}&topic=${encodeURIComponent(loadedTopicName)}`
            : "");
      }
    });
  }

  // Xử lý dữ liệu trên Preview Page (hiển thị preview từ localStorage)
  if (previewTitleDisplay && previewImage) {
    previewTitleDisplay.innerText =
      localStorage.getItem("blogTitle") || "Untitled Blog";

    const previewImageData =
      sessionStorage.getItem("rawBannerFile") ||
      localStorage.getItem("currentBannerPreview") ||
      "../img/default.jpg";
    previewImage.src = previewImageData;

    // Lấy des và topic từ URL parameters và hiển thị trên Preview
    const urlParamsPreview = new URLSearchParams(window.location.search);
    const descriptionFromUrl = urlParamsPreview.get("des");
    const topicFromUrl = urlParamsPreview.get("topic");
    const descriptionInputPreview = document.getElementById("blogDescription");
    const topicInputPreview = document.getElementById("blogTopic");

    if (descriptionInputPreview && descriptionFromUrl) {
      descriptionInputPreview.value = decodeURIComponent(descriptionFromUrl);
      updateCharCount();
    }
    if (topicInputPreview && topicFromUrl) {
      topicInputPreview.value = decodeURIComponent(topicFromUrl);
    }
  }

  // Theo dõi số lượng ký tự trong Description (trên trang Preview)
  if (descriptionInputPreview && descriptionCountDisplay) {
    descriptionInputPreview.addEventListener("input", function () {
      const text = this.value;
      const charCount = text.length;
      descriptionCountDisplay.innerText = `${charCount}/200 characters`;
    });
  }

  // Xử lý nút đóng Preview Page (khôi phục preview)
  if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", function () {
      const storedTitle = localStorage.getItem("blogTitle");
      const storedContent = localStorage.getItem("blogContent");
      const storedBannerPreview = localStorage.getItem("currentBannerPreview");

      if (blogTitleInput)
        blogTitleInput.value = storedTitle || initialWriteState.title;
      if (blogContentInput)
        blogContentInput.value = storedContent || initialWriteState.content;
      if (
        bannerUpload &&
        storedBannerPreview &&
        storedBannerPreview !== "../img/default.jpg"
      ) {
        bannerUpload.style.backgroundImage = `url(${storedBannerPreview})`;

        bannerUpload.style.backgroundSize = "cover";
        bannerUpload.style.backgroundPosition = "center";
        bannerUpload.textContent = "";
      } else if (bannerUpload) {
        bannerUpload.style.backgroundImage = initialWriteState.banner;
        bannerUpload.textContent = initialWriteState.bannerText;
        if (!initialWriteState.banner)
          bannerUpload.style.backgroundColor = "#e5e7eb";
      }
      // Flag để lấy lại dữ liệu cũ của phần edit
      const previewDescriptionInput =
        document.getElementById("blogDescription");
      if (previewDescriptionInput) {
        const description = previewDescriptionInput.value.trim();
        localStorage.setItem("blogDescription", description);
      }

      localStorage.setItem("fromPreviewBack", "true");
      window.location.href =
        "write.html" + (editPostId ? `?id=${editPostId}` : "");
    });
  }

  // Xử lý nút Publish ở trang Preview
  if (publishBtnPreviewPage) {
    publishBtnPreviewPage.addEventListener("click", async function (e) {
      e.preventDefault(); // Chặn reload mặc định

      const title = localStorage.getItem("blogTitle");
      const content = localStorage.getItem("blogContent");
      const description = document
        .getElementById("blogDescription")
        .value.trim();

      localStorage.setItem("blogDescription", description);

      const userId = localStorage.getItem("userId");
      const currentTopic = document.getElementById("blogTopic").value.trim();
      if (!currentTopic) {
        alert("Topic không được để trống!");
        return;
      }
      const topicId = await getTopicIdFromBackend(
        currentTopic ? [currentTopic] : []
      );

      if (!title || !content || !userId) {
        alert("Title, content and user ID cannot be empty.");
        return;
      }

      // Chuyển base64 sang File
      function dataURLtoFile(dataurl, filename) {
        let arr = dataurl.split(",");
        let mime = arr[0].match(/:(.*?);/)[1];
        let bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("des", description || "");
      formData.append("user_id", userId);
      formData.append("topic_id", topicId || null);

      // Lấy banner từ sessionStorage (base64) và localStorage
      const rawBase64 = sessionStorage.getItem("rawBannerFile");
      const fallbackBase64 = localStorage.getItem("currentBannerPreview");
      const bannerBase64 = rawBase64 || fallbackBase64;
      // mới cmt
      // if (bannerBase64 && bannerBase64.startsWith("data:image")) {
      //   const fileFromBase64 = dataURLtoFile(bannerBase64, "banner.jpg");
      //   formData.append("banner", fileFromBase64);
      // }
      let bannerUrl = null;
      if (bannerBase64 && bannerBase64.startsWith("data:image")) {
        bannerUrl = await uploadBase64ImageToS3(bannerBase64);
        if (bannerUrl) {
          formData.append("image_url", bannerUrl); // gửi URL thay vì file
        }
      }

      const method = editPostId ? "PUT" : "POST";
      const url = editPostId
        ? `${API_BASE_URL}/api/posts/${editPostId}`
        : `${API_BASE_URL}/api/posts`;
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      try {
        const response = await fetch(url, {
          method: method,
          body: formData,
        });

        if (response.ok) {
          setTimeout(() => {
            window.location.href = "../home/home.html";
          }, 100);

          // ✅ Xóa dữ liệu trước khi chuyển trang
          localStorage.removeItem("blogTitle");
          localStorage.removeItem("blogContent");
          localStorage.removeItem("currentBannerPreview");
          sessionStorage.removeItem("rawBannerFile");
          localStorage.removeItem("blogDescription");

          // window.location.href = "../home/home.html";
        }

        const result = await response.json();
        console.error("Kết quả trả về khi lấy topic ID:", result);
        if (response.ok) {
          alert(editPostId ? "The blog has been updated!" : "Published!");
        } else {
          alert(`Publishing failure: ${result.message || response.statusText}`);
        }
      } catch (error) {
        console.error("Error sending post data:", error);
        alert(
          "An error occurred while publishing the post. Please try again later."
        );
      }
    });
  }

  async function getTopicIdFromBackend(topics) {
    if (topics && topics.length > 0) {
      const firstTopic = topics[0];
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/get-id`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topic: firstTopic }),
        });
        const result = await response.json();
        if (response.ok) {
          return result.id || null;
        } else if (response.status === 404) {
          console.log(`Không tìm thấy topic: ${firstTopic}`);
          return null;
        } else {
          console.error("Lỗi khi lấy topic ID từ backend:", result);
          return null;
        }
      } catch (error) {
        console.error("Lỗi khi gửi yêu cầu lấy topic ID:", error);
        return null;
      }
    } else {
      return null;
    }
  }

  async function getTopicNameFromBackend(topicId) {
    if (topicId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/categories/get-name`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: topicId }),
          }
        );
        const result = await response.json();
        if (response.ok && result.topic) {
          return result.topic;
        } else {
          console.error("Lỗi khi lấy tên topic từ backend:", result);
          return "";
        }
      } catch (error) {
        console.error("Lỗi kết nối khi lấy tên topic:", error);
        return "";
      }
    }
    return "";
  }

  // Khôi phục trạng thái trang Write khi tải lại (ví dụ sau khi đóng Preview)
  const storedTitleOnLoad = localStorage.getItem("blogTitle");
  const storedContentOnLoad = localStorage.getItem("blogContent");
  const storedBannerOnLoad = localStorage.getItem("currentBannerPreview");

  if (blogTitleInput && storedTitleOnLoad) {
    blogTitleInput.value = storedTitleOnLoad;
  }
  if (blogContentInput && storedContentOnLoad) {
    blogContentInput.value = storedContentOnLoad;
  }
  if (
    bannerUpload &&
    storedBannerOnLoad &&
    storedBannerOnLoad !== "../img/default.jpg"
  ) {
    bannerUpload.style.backgroundImage = `url(${storedBannerOnLoad})`;
    bannerUpload.style.backgroundSize = "cover";
    bannerUpload.style.backgroundPosition = "center";
    bannerUpload.textContent = "";
  } else if (bannerUpload && !storedBannerOnLoad) {
    bannerUpload.style.backgroundImage = initialWriteState.banner;
    bannerUpload.textContent = initialWriteState.bannerText;
    if (!initialWriteState.banner) {
      bannerUpload.style.backgroundColor = "#e5e7eb";
    }
  }

  const blogDescription = localStorage.getItem("blogDescription");
  if (blogDescription) {
    const descriptionInput = document.getElementById("blogDescription");
    if (descriptionInput) {
      descriptionInput.value = blogDescription;
      updateCharCount();
    }
  }
});
