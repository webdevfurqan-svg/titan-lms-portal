const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Announcement = require('../models/Announcement');

router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      if (req.user.role === 'teacher' && req.body.course) {
        const Course = require('../models/Course');
        const course = await Course.findById(req.body.course);
        if (!course || course.teacher.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only post announcements for your own courses.',
          });
        }
      }

      const announcement = new Announcement({
        ...req.body,
        author: req.user.id
      });

      await announcement.save();

      res.status(201).json({
        success: true,
        data: announcement
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);


router.get(
  '/',
  requireLogin,
  async (req, res) => {
    try {
      const announcements = await Announcement.find({
        $or: [
          { targetRole: 'ALL' },
          { targetRole: req.user.role.toUpperCase() }
        ]
      })
        .populate('author', 'name role')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: announcements
      });

    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);


module.exports = router;