const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// ============================================
// LIST QUIZZES
// Teacher: only their own courses' quizzes.
// Student: only their enrolled course's quizzes.
// Admin: all quizzes.
// Correct answers are stripped for students so they can't cheat via
// the network tab.
// ============================================
router.get('/', requireLogin, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'teacher') {
      const myCourses = await Course.find({ teacher: req.user.id }).select('_id');
      filter.course = { $in: myCourses.map((c) => c._id) };
    } else if (req.user.role === 'student') {
      const enrollment = await Enrollment.findOne({
        student: req.user.id,
        status: 'active',
        endDate: { $gte: new Date() },
      });
      if (!enrollment) {
        return res.json({ success: true, data: [] });
      }
      filter.course = enrollment.course;
    }

    const quizzes = await Quiz.find(filter).populate('course', 'title code').sort({ createdAt: -1 });

    if (req.user.role === 'student') {
      const attempts = await QuizAttempt.find({
        student: req.user.id,
        quiz: { $in: quizzes.map((q) => q._id) },
      });
      const attemptMap = {};
      attempts.forEach((a) => (attemptMap[a.quiz.toString()] = a));

      const sanitized = quizzes.map((q) => {
        const obj = q.toObject();
        const myAttempt = attemptMap[q._id.toString()] || null;
        obj.questions = obj.questions.map((qq) => ({
          questionText: qq.questionText,
          type: qq.type,
          options: qq.options,
          // correctAnswer deliberately omitted for students
        }));
        obj.myAttempt = myAttempt;
        return obj;
      });
      return res.json({ success: true, data: sanitized });
    }

    res.json({ success: true, data: quizzes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// CREATE QUIZ
// Teacher (own course only) or Admin.
// ============================================
router.post('/', requireLogin, authorize('teacher', 'admin'), async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const course = await Course.findById(req.body.course);
      if (!course || course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only create quizzes for your own courses.',
        });
      }
    }

    const quiz = new Quiz(req.body);
    await quiz.save();
    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', requireLogin, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    if (req.user.role === 'teacher' && quiz.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit quizzes for your own courses.',
      });
    }

    const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id });
    if (attemptCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This quiz already has student attempts and cannot be edited. Delete it and create a new one instead.',
      });
    }

    const { title, questions } = req.body;
    if (title) quiz.title = title;
    if (questions) quiz.questions = questions;
    await quiz.save();

    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', requireLogin, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course');
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    if (req.user.role === 'teacher' && quiz.course.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete quizzes for your own courses.',
      });
    }

    await QuizAttempt.deleteMany({ quiz: quiz._id });
    await quiz.deleteOne();

    res.json({ success: true, message: 'Quiz deleted.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/:id/attempt', requireLogin, authorize('student'), async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const existing = await QuizAttempt.findOne({ quiz: quiz._id, student: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already attempted this quiz.' });
    }

    const { answers } = req.body; 
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Answers are required.' });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      const given = answers.find((a) => a.questionIndex === i);
      if (given && given.selectedAnswer === q.correctAnswer) score += 1;
    });

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user.id,
      answers,
      score,
      totalQuestions,
      percentage,
    });

    res.status(201).json({ success: true, data: attempt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/admin/results', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const attempts = await QuizAttempt.find()
      .populate('student', 'name email')
      .populate({ path: 'quiz', select: 'title course', populate: { path: 'course', select: 'title code' } })
      .sort({ percentage: -1 });

    res.json({ success: true, data: attempts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;