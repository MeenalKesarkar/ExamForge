const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");


dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);

connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "ExamForge Backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`ExamForge server running on http://localhost:${PORT}`);
});