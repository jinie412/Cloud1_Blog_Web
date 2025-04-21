const express = require("express");
const pool = require("../db");
const router = express.Router();

// === ĐĂNG NHẬP ===
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Chuẩn hóa tên người dùng
    const [users] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = ?",
      [username.toLowerCase()]
    );

    if (users.length === 0) {
      console.log("Không tìm thấy user");
      return res.status(401).json({ error: "Sai tài khoản!" });
    }

    const user = users[0];

    // So sánh mật khẩu
    if (user.password_hash !== password) {
      console.log("Mật khẩu không khớp:", user.password_hash, "!=", password);
      return res.status(401).json({ error: "Sai mật khẩu!" });
    }

    res.json({ message: "Đăng nhập thành công!", userId: user.id });
  } catch (error) {
    console.error("Lỗi trong quá trình đăng nhập:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// === ĐĂNG KÝ ===
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Kiểm tra xem username đã tồn tại chưa
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = ?",
      [username.toLowerCase()]
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ error: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác." });
    }

    // Thêm user mới vào DB
    await pool.query(
      "INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)",
      [username, password, email]
    );

    res.status(201).json({ message: "Đăng ký thành công!" });
  } catch (error) {
    console.error("Lỗi khi đăng ký:", error);
    res.status(500).json({ error: "Lỗi server khi đăng ký" });
  }
});

// router.get("/users/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const [users] = await pool.query(
//       "SELECT avatar_url FROM users WHERE id = ?",
//       [id]
//     );

//     if (users.length === 0) {
//       return res.status(404).json({ error: "User không tồn tại" });
//     }

//     res.json(users[0]);
//   } catch (error) {
//     console.error("Lỗi lấy avatar:", error);
//     res.status(500).json({ error: "Lỗi server" });
//   }
// });

module.exports = router;
