const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

router.get('/', requireLogin, async (req, res) => {
  try {
    const courses = await Course.find().populate('teacher', 'name email');
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', requireLogin, authorize('student'), async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      status: 'active',
      endDate: { $gte: new Date() },
    }).populate({ path: 'course', populate: { path: 'teacher', select: 'name email' } });

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const { teacherId, ...rest } = req.body;

    if (!teacherId) {
      return res.status(400).json({ success: false, message: 'A teacher must be assigned to the course.' });
    }

    const User = require('../models/User');
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(400).json({ success: false, message: 'Invalid teacher selected.' });
    }

    const newCourse = new Course({ ...rest, teacher: teacherId });
    await newCourse.save();
    res.status(201).json({ success: true, data: newCourse });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/enroll', requireLogin, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const existing = await Enrollment.findOne({
      student: req.user.id,
      status: 'active',
      endDate: { $gte: new Date() },
    }).populate('course', 'title');

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You're already enrolled in "${existing.course.title}" until ${existing.endDate.toDateString()}. You can't join another course until that ends.`,
      });
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (course.durationMonths || 1));

    const enrollment = await Enrollment.create({
      student: req.user.id,
      course: course._id,
      endDate,
    });

    await Course.updateOne({ _id: course._id }, { $addToSet: { enrolledStudents: req.user.id } });

    res.status(201).json({ success: true, data: enrollment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
router.post('/:id/unenroll/:studentId', requireLogin, authorize('admin'), async (req, res) => {
  try {
    await Enrollment.updateMany(
      { course: req.params.id, student: req.params.studentId, status: 'active' },
      { status: 'removed' }
    );
    await Course.updateOne(
      { _id: req.params.id },
      { $pull: { enrolledStudents: req.params.studentId } }
    );
    res.json({ success: true, message: 'Student removed from course' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
router.get('/:id/roster', requireLogin, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your course' });
    }

    const roster = await Enrollment.find({ course: req.params.id, status: 'active' }).populate(
      'student',
      'name email'
    );
    res.json({ success: true, data: roster });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/admin/enrollments', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ status: 'active' })
      .populate('student', 'name email')
      .populate({ path: 'course', populate: { path: 'teacher', select: 'name' } });
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;