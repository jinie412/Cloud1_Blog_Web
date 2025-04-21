const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = require("fs").promises;
const { uploadFileToS3 } = require("../services/s3");
const { deleteFileFromS3 } = require("../services/s3");
const uploadBanner = multer({ storage: multer.memoryStorage() });

// ========== TẠO BÀI VIẾT MỚI ==========
router.post("/posts", uploadBanner.single("banner"), async (req, res) => {
  const { title, content, des, user_id, topic_id } = req.body;
  let imageUrl = null;

  if (!title || !content || !user_id) {
    return res
      .status(400)
      .json({ message: "Tiêu đề, nội dung và ID người dùng là bắt buộc." });
  }

  try {
    if (req.file) {
      console.log("Đã nhận được file ảnh:", req.file.originalname);
      imageUrl = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } else {
      console.log("Không có ảnh được gửi lên.");
      imageUrl = null;
    }

    const [result] = await pool.execute(
      "INSERT INTO blogWeb.posts (title, content, image_url, des, user_id, topic_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [title, content, imageUrl, des, user_id, topic_id]
    );

    if (result.insertId) {
      return res.status(201).json({
        message: "Bài viết đã được tạo thành công!",
        postId: result.insertId,
      });
    } else {
      return res.status(500).json({ message: "Lỗi khi tạo bài viết." });
    }
  } catch (error) {
    console.error("Lỗi tạo bài viết:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo bài viết." });
  }
});

// ========== CẬP NHẬT BÀI VIẾT ==========
router.put("/posts/:id", uploadBanner.single("banner"), async (req, res) => {
  const { id } = req.params;
  const { title, content, des, topic_id } = req.body;
  let imageUrl = null;

  try {
    const [existingPost] = await pool.execute(
      "SELECT image_url FROM blogWeb.posts WHERE id = ?",
      [id]
    );
    const oldImageUrl = existingPost[0]?.image_url;

    if (req.file) {
      imageUrl = await uploadFileToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } else {
      imageUrl = oldImageUrl; // Giữ lại ảnh cũ nếu không có ảnh mới
    }

    const [result] = await pool.execute(
      "UPDATE blogWeb.posts SET title = ?, content = ?, image_url = ?, des = ?, topic_id = ?, updated_at = NOW() WHERE id = ?",
      [title, content, imageUrl, des, topic_id, id]
    );

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Bài viết đã được cập nhật thành công!" });
    } else {
      return res
        .status(404)
        .json({ message: "Không tìm thấy bài viết để cập nhật." });
    }
  } catch (error) {
    console.error("Lỗi cập nhật bài viết:", error);
    return res
      .status(500)
      .json({ message: "Lỗi server khi cập nhật bài viết." });
  }
});

// ========== XOÁ BÀI VIẾT ==========
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Lấy topic_id và image_url của bài viết
    const [[post]] = await pool.query(
      "SELECT topic_id, image_url FROM posts WHERE id = ?",
      [id]
    );

    if (!post) {
      return res.status(404).json({ message: "Không tìm thấy bài viết." });
    }

    const { topic_id, image_url } = post;

    // 2. Xoá ảnh trên S3 (nếu có và là link S3)
    if (image_url && image_url.startsWith("https://")) {
      try {
        await deleteFileFromS3(image_url);
        console.log("Đã xoá ảnh S3:", image_url);
      } catch (err) {
        console.warn("Không thể xoá ảnh trên S3:", err.message);
      }
    }

    // 3. Xoá bài viết trong DB
    const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Không xóa được bài viết." });
    }

    // 4. Xoá topic nếu không còn bài viết nào
    if (topic_id) {
      const [[{ count }]] = await pool.query(
        "SELECT COUNT(*) AS count FROM posts WHERE topic_id = ?",
        [topic_id]
      );
      if (count === 0) {
        await pool.query("DELETE FROM categories WHERE id = ?", [topic_id]);
        console.log("Đã xoá topic vì không còn bài viết:", topic_id);
      }
    }

    res.json({ message: "Đã xóa bài viết và ảnh S3 (nếu có)." });
  } catch (err) {
    console.error("Lỗi khi xóa bài viết:", err);
    res.status(500).json({ message: "Lỗi server khi xóa bài viết." });
  }
});

// ===================== LẤY BÀI VIẾT CỦA MỘT USER =====================

router.get("/users/:userId/posts", async (req, res) => {
  const { userId } = req.params;
  try {
    const [posts] = await pool.query(
      `
          SELECT posts.id, posts.title, posts.des, posts.image_url, categories.topic,
                 posts.created_at, posts.updated_at
          FROM posts
          LEFT JOIN categories ON posts.topic_id = categories.id
          WHERE posts.user_id = ?
          ORDER BY posts.created_at DESC
          `,
      [userId]
    );
    res.json(posts);
  } catch (err) {
    console.error("Lỗi lấy bài viết của user:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ===================== LẤY TẤT CẢ BÀI VIẾT =====================

router.get("/posts", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT posts.id, posts.title, posts.des, posts.image_url, categories.topic,
             users.username, users.avatar_url, posts.created_at, posts.updated_at
      FROM posts
      LEFT JOIN categories ON posts.topic_id = categories.id
      LEFT JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC
    `);

    res.json(posts);
  } catch (err) {
    console.error("Lỗi lấy danh sách bài viết:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

router.get("/posts/topic/:topicId", async (req, res) => {
  const { topicId } = req.params;
  try {
    const [posts] = await pool.query(
      `
        SELECT posts.id, posts.title, posts.des, posts.image_url, categories.topic,
               users.username, users.avatar_url, posts.created_at, posts.updated_at
        FROM posts
        LEFT JOIN categories ON posts.topic_id = categories.id
        LEFT JOIN users ON posts.user_id = users.id
        WHERE topic_id = ?
        ORDER BY posts.created_at DESC
      `,
      [topicId]
    );

    res.json(posts);
  } catch (err) {
    console.error("Lỗi lấy bài theo topic:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ======================= LẤY CÁC TOPICS ==========================

router.get("/topics", async (req, res) => {
  try {
    const [topics] = await pool.query(
      "SELECT * FROM categories ORDER BY topic ASC"
    );
    res.json(topics);
  } catch (err) {
    console.error("Lỗi lấy topics:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// ======================= CHI TIẾT 1 BÀI VIẾT =======================

router.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT posts.*, users.username, users.avatar_url
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Không tìm thấy bài viết" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
