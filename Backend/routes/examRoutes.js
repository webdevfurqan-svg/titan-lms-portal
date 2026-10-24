const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Exam = require('../models/Exam');


router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const exam = new Exam(req.body);

      await exam.save();

      res.status(201).json({
        success: true,
        data: exam
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
  '/course/:courseId',
  requireLogin,
  async (req, res) => {
    try {
      const exams = await Exam.find({
        course: req.params.courseId
      });

      res.json({
        success: true,
        data: exams
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