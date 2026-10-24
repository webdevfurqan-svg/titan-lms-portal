const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");


router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (role !== "teacher" && role !== "student") {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registered successfully.",
    });
  } catch (err) {
    console.error("Register error:", err);

    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    
    if (user.active === false) {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated. Contact the institute admin.",
      });
    }

    req.session.userId = user._id.toString();
    req.session.role = user.role;
    req.session.name = user.name;

    res.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Not logged in.",
      });
    }

    const user = await User.findById(req.session.userId).select(
      "-password"
    );

    if (!user) {
      req.session.destroy(() => {});

      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Auth check error:", err);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
});


router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);

      return res.status(500).json({
        success: false,
        message: "Logout failed.",
      });
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  });
});

module.exports = router;