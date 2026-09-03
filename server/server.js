const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const groupRoutes = require("./routes/groupRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    res.status(503).json({ message: "Database unavailable" });
  }
});
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;