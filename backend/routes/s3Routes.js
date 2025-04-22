// routes/s3Routes.js
const express = require("express");
const router = express.Router();
const { uploadFileToS3 } = require("../services/s3");

router.post("/upload", async (req, res) => {
  try {
    const { base64Image, filename } = req.body;

    if (!base64Image || !filename) {
      return res.status(400).json({ message: "Thiếu dữ liệu ảnh." });
    }

    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      console.error(
        "Không match được định dạng base64:",
        base64Image.slice(0, 100)
      );
      return res.status(400).json({ message: "Dữ liệu ảnh không hợp lệ." });
    }

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], "base64");

    const imageUrl = await uploadFileToS3(imageBuffer, filename, mimeType);
    return res.status(200).json({ url: imageUrl });
  } catch (err) {
    console.error("Lỗi upload ảnh lên S3:", err);
    return res.status(500).json({ message: "Lỗi server khi upload ảnh." });
  }
});

module.exports = router;
