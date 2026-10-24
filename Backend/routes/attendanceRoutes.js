const express = require('express');

const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Course = require('../models/Course');

router.get(
  '/students',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const students = await User.find({ role: 'student' }).select('name email');
      res.json({ success: true, data: students });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);
router.get(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      let filter = {};

      if (req.user.role === 'teacher') {
        const myCourses = await Course.find({ teacher: req.user.id }).select('_id');
        filter.course = { $in: myCourses.map((c) => c._id) };
      } else if (req.query.course) {
        filter.course = req.query.course;
      }

      const sessions = await Attendance.find(filter)
        .populate('course', 'title code')
        .populate('records.student', 'name email')
        .sort({ date: -1 });

      res.json({ success: true, data: sessions });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { course, date, records } = req.body;

      if (!course || !date || !records) {
        return res.status(400).json({
          success: false,
          message: 'Course, date, and attendance records are required.'
        });
      }

      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Attendance records must be a non-empty array.'
        });
      }

      if (req.user.role === 'teacher') {
        const courseDoc = await Course.findById(course);
        if (!courseDoc || courseDoc.teacher.toString() !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only mark attendance for your own courses.',
          });
        }
      }

      const attendance = new Attendance({
        course,
        date,
        records
      });

      await attendance.save();

      res.status(201).json({
        success: true,
        message: 'Attendance recorded successfully.',
        data: attendance
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
  '/student/:studentId',
  requireLogin,
  async (req, res) => {
    try {
      if (
        req.user.role === 'student' &&
        req.user.id !== req.params.studentId
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden access.'
        });
      }

      const history = await Attendance.find({
        'records.student': req.params.studentId
      })
        .populate('course', 'title code')
        .populate('records.student', 'name email');

      res.json({
        success: true,
        data: history
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