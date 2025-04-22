const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { uploadFileToS3, deleteFileFromS3 } = require("../services/s3");
const upload = multer({ storage: multer.memoryStorage() }); // dùng memory để upload lên S3

// Route lấy thông tin user
router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [users] = await pool.query(
      "SELECT id, username, email, bio, avatar_url FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User không tồn tại" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Route chỉnh sửa thông tin user (cập nhật bio và avatar URL)
router.put("/users/:id", upload.single("avatar"), async (req, res) => {
  const { id } = req.params;
  const { bio } = req.body;

  let newAvatarUrl = null;

  try {
    // 1. Truy vấn avatar_url cũ
    const [rows] = await pool.query(
      "SELECT avatar_url FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy người dùng." });
    }

    const oldAvatarUrl = rows[0].avatar_url;

    // 2. Nếu có ảnh mới → upload lên S3
    if (req.file) {
      newAvatarUrl = await uploadFileToS3(
        req.file.buffer,
        `avatars/${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );

      console.log("Đã upload avatar mới lên S3:", newAvatarUrl);

      // 3. Nếu có avatar cũ từ S3 thì xoá
      if (oldAvatarUrl && oldAvatarUrl.startsWith("https://")) {
        try {
          await deleteFileFromS3(oldAvatarUrl);
          console.log("Đã xoá avatar cũ trên S3:", oldAvatarUrl);
        } catch (err) {
          console.warn("Không thể xoá avatar cũ trên S3:", err.message);
        }
      }
    }

    // 4. Cập nhật thông tin trong DB
    let query = "UPDATE users SET bio = ?";
    let params = [bio];

    if (newAvatarUrl) {
      query += ", avatar_url = ?";
      params.push(newAvatarUrl);
    }

    query += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows > 0) {
      res.json({
        message: "Thông tin người dùng đã được cập nhật thành công!",
        avatar_url: newAvatarUrl || oldAvatarUrl,
      });
    } else {
      res.status(404).json({ error: "Không tìm thấy người dùng để cập nhật." });
    }
  } catch (error) {
    console.error("Lỗi cập nhật thông tin user:", error);
    res.status(500).json({ error: "Lỗi server khi cập nhật thông tin." });
  }
});

// Route thay đổi mật khẩu
router.put("/users/:id/change-password", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    // 1. Lấy mật khẩu hiện tại từ DB
    const [rows] = await pool.query(
      "SELECT password_hash FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const user = rows[0];
    console.log("Client gửi mật khẩu:", currentPassword);
    console.log("Mật khẩu trong DB:", user.password_hash);

    // 2. So sánh mật khẩu plain text
    if (user.password_hash !== currentPassword) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng." });
    }

    // 3. Cập nhật mật khẩu mới
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [
      newPassword,
      id,
    ]);

    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (err) {
    console.error("Lỗi khi đổi mật khẩu:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
});

module.exports = router;
