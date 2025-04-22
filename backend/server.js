const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// phục vụ frontend (nếu cần)
app.use(express.static(path.join(__dirname, "../frontend")));

// Phục vụ thư mục 'uploads' tại đường dẫn '/uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const categoryRoutes = require("./routes/categoriesRoutes");
const s3Routes = require("./routes/s3Routes");

// routes API
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", postRoutes);
app.use("/api", userRoutes);
app.use("/api/s3", s3Routes);

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
