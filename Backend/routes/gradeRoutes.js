const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Grade = require('../models/Grade');


router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const {
        student,
        course,
        assignmentScore,
        quizScore,
        midtermScore,
        finalExamScore
      } = req.body;

      const overallPercentage =
        (assignmentScore +
          quizScore +
          midtermScore +
          finalExamScore) / 4;

      let letterGrade = 'F';

      if (overallPercentage >= 90) {
        letterGrade = 'A';
      } else if (overallPercentage >= 80) {
        letterGrade = 'B';
      } else if (overallPercentage >= 70) {
        letterGrade = 'C';
      } else if (overallPercentage >= 60) {
        letterGrade = 'D';
      }

      const grade = await Grade.findOneAndUpdate(
        { student, course },
        {
          assignmentScore,
          quizScore,
          midtermScore,
          finalExamScore,
          overallPercentage,
          letterGrade
        },
        {
          upsert: true,
          new: true
        }
      );

      res.status(200).json({
        success: true,
        data: grade
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
          message: 'Access denied'
        });
      }

      const grades = await Grade.find({
        student: req.params.studentId
      }).populate('course', 'title code');

      res.json({
        success: true,
        data: grades
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