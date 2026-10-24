const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Timetable = require('../models/Timetable');


router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      // A teacher may only schedule classes for a course they actually own.
      // Admin can schedule for any course.
      if (req.user.role === 'teacher') {
        const Course = require('../models/Course');
        const course = await Course.findById(req.body.course);
        if (!course || course.teacher.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only schedule classes for your own courses.',
          });
        }
      }

      const timetable = new Timetable(req.body);

      await timetable.save();

      res.status(201).json({
        success: true,
        data: timetable
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
      const schedule = await Timetable.find()
        .populate('course', 'title code')
        .populate('teacher', 'name');

      res.json({
        success: true,
        data: schedule
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