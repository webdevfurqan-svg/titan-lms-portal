const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

// ============================================
// LIST USERS (optionally filtered by role)
// Access: Admin only
// ============================================
router.get('/users', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('name email role');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// INSTITUTION-WIDE DASHBOARD STATS
// Access: Admin only
// Real counts from the database — no hardcoded numbers.
// ============================================
router.get('/stats', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      activeEnrollments,
      totalAssignments,
      totalSubmissions,
      gradedSubmissions,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments(),
      Enrollment.countDocuments({ status: 'active', endDate: { $gte: new Date() } }),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ grade: { $ne: null } }),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalCourses,
        activeEnrollments,
        totalAssignments,
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions: totalSubmissions - gradedSubmissions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// ONE STUDENT'S FULL PROFILE (enrollment, assignments, submissions)
// Access: Admin only
// ============================================
router.get('/students/:id', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' }).select(
      'name email'
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const enrollment = await Enrollment.findOne({
      student: student._id,
      status: 'active',
      endDate: { $gte: new Date() },
    }).populate({ path: 'course', populate: { path: 'teacher', select: 'name email' } });

    const submissions = await Submission.find({ student: student._id })
      .populate({ path: 'assignment', select: 'title course', populate: { path: 'course', select: 'title' } })
      .sort({ submittedAt: -1 });

    const enrollmentHistory = await Enrollment.find({ student: student._id })
      .populate('course', 'title code')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { student, activeEnrollment: enrollment, submissions, enrollmentHistory },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// DEACTIVATE / REMOVE A STUDENT
// Access: Admin only
// Does NOT delete the user record or their academic history — only ends
// their active enrollment and marks the account inactive, preserving
// submissions/grades/attendance for institutional record-keeping.
// ============================================
router.post('/students/:id/deactivate', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await Enrollment.updateMany(
      { student: student._id, status: 'active' },
      { status: 'removed' }
    );

    const activeEnrollments = await Enrollment.find({ student: student._id, status: 'removed' });
    await Promise.all(
      activeEnrollments.map((e) =>
        Course.updateOne({ _id: e.course }, { $pull: { enrolledStudents: student._id } })
      )
    );

    student.active = false;
    await student.save();

    res.json({ success: true, message: 'Student deactivated and unenrolled from all courses.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// REACTIVATE A STUDENT
// Access: Admin only
// ============================================
router.post('/students/:id/reactivate', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    student.active = true;
    await student.save();

    res.json({ success: true, message: 'Student reactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Access: Admin only

router.get('/grades', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const submissions = await Submission.find({ grade: { $ne: null } })
      .populate('student', 'name email')
      .populate({ path: 'assignment', select: 'title course totalPoints', populate: { path: 'course', select: 'title code' } })
      .sort({ grade: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/courses/:id/teacher', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const { teacherId } = req.body;
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) return res.status(400).json({ success: false, message: 'Invalid teacher' });

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { teacher: teacherId },
      { new: true }
    ).populate('teacher', 'name email');

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


router.delete('/students/:id', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const enrollments = await Enrollment.find({ student: student._id });
    await Promise.all(
      enrollments.map((e) =>
        Course.updateOne({ _id: e.course }, { $pull: { enrolledStudents: student._id } })
      )
    );

    await Enrollment.deleteMany({ student: student._id });
    await Submission.deleteMany({ student: student._id });
    await User.deleteOne({ _id: student._id });

    res.json({ success: true, message: 'Student permanently deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;