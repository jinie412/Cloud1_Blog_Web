const express = require("express");
const pool = require("../db");
const router = express.Router();

router.post("/get-id", async (req, res) => {
  const topicName = req.body.topic;
  if (!topicName) {
    return res.status(400).json({ message: "Vui lòng cung cấp tên topic." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id FROM blogWeb.categories WHERE topic = ?",
      [topicName]
    );

    if (rows.length > 0) {
      return res.json({ id: rows[0].id });
    } else {
      const [insertResult] = await pool.execute(
        "INSERT INTO blogWeb.categories (topic) VALUES (?)",
        [topicName]
      );

      if (insertResult.insertId) {
        return res.status(201).json({ id: insertResult.insertId });
      } else {
        return res
          .status(500)
          .json({ message: "Lỗi khi thêm topic vào bảng." });
      }
    }
  } catch (error) {
    console.error("Lỗi khi xử lý topic ID:", error);
    return res.status(500).json({ message: "Lỗi server khi xử lý topic ID" });
  }
});

router.post("/get-name", async (req, res) => {
  const topicId = req.body.id;
  if (!topicId) {
    return res.status(400).json({ message: "Vui lòng cung cấp topic ID." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT topic FROM blogWeb.categories WHERE id = ?",
      [topicId]
    );

    if (rows.length > 0) {
      return res.json({ topic: rows[0].topic });
    } else {
      return res
        .status(404)
        .json({ message: "Không tìm thấy topic với ID này." });
    }
  } catch (error) {
    console.error("Lỗi khi lấy tên topic theo ID:", error);
    return res.status(500).json({ message: "Lỗi server khi lấy tên topic." });
  }
});

module.exports = router;
