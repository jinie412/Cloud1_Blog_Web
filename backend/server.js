const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

// ====== CORS ======
app.use(
  cors({
    origin: ["http://cloud-blog-web.s3-website-ap-southeast-1.amazonaws.com"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ====== CORS Preflight cho các route PUT/POST ======
app.options("*", cors());
// phục vụ frontend (nếu cần)
app.use(express.static(path.join(__dirname, "../frontend")));

// Phục vụ thư mục 'uploads' tại đường dẫn '/uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const categoryRoutes = require("./routes/categoriesRoutes");

// routes API
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", postRoutes);
app.use("/api", userRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
