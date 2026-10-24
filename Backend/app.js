require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");

const app = express();

connectDB();

app.set("trust proxy", 1); 

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_super_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
},
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));
app.use("/api/teachers", require("./routes/teacherRoutes"));

app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/grades", require("./routes/gradeRoutes"));
app.use("/api/timetable", require("./routes/timetableRoutes"));
app.use("/api/announcements", require("./routes/announcementRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/fees", require("./routes/feeRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "TiTan LMS Portal API is running" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;