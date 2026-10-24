const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../config/upload');

const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');

const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');


router.get('/', requireLogin, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'teacher') {
      filter = { createdBy: req.user.id };
    }

    const assignments = await Assignment.find(filter)
      .populate('course', 'title code')
      .sort({ createdAt: -1 });
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map((a) => a._id);
      const mySubmissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: req.user.id,
      });

      const byAssignmentId = {};
      mySubmissions.forEach((s) => {
        byAssignmentId[s.assignment.toString()] = s;
      });

      const withSubmissions = assignments.map((a) => ({
        ...a.toObject(),
        mySubmission: byAssignmentId[a._id.toString()] || null,
      }));

      return res.json({ success: true, data: withSubmissions });
    }

    res.json({
      success: true,
      data: assignments
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


router.get('/course/:courseId', requireLogin, async (req, res) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId
    });

    res.json({
      success: true,
      data: assignments
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


router.post(
  '/',
  requireLogin,
  authorize('teacher', 'admin'),
  upload.single('file'),
  async (req, res) => {
    try {
      let fileUrl = '';

      if (req.file) {
        const result = await uploadBufferToCloudinary(
          req.file.buffer,
          'lms-assignments'
        );

        fileUrl = result.secure_url;
      }

      const assignment = new Assignment({
        ...req.body,
        fileUrl,
        createdBy: req.user.id   
      });

      await assignment.save();

      res.status(201).json({
        success: true,
        data: assignment
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);


router.get('/:id/submissions', requireLogin, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isOwner = assignment.createdBy.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only view submissions for your own assignments'
      });
    }

    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      data: submissions
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});
router.post(
  '/:id/submit',
  requireLogin,
  authorize('student'),
  upload.single('submissionFile'),
  async (req, res) => {
    try {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found.'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File upload required.'
        });
      }

      const existing = await Submission.findOne({
        assignment: assignment._id,
        student: req.user.id,
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'You have already submitted this assignment.'
        });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, 'lms-submissions');

      const submission = new Submission({
        assignment: assignment._id,
        student: req.user.id,
        fileUrl: result.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });

      await submission.save();

      res.status(201).json({
        success: true,
        data: submission
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);


router.put(
  '/submissions/:submissionId/grade',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { grade, feedback } = req.body;

      const submission = await Submission.findById(req.params.submissionId);
      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }

      const assignment = await Assignment.findById(submission.assignment);
      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Parent assignment not found'
        });
      }

      const isOwner = assignment.createdBy.toString() === req.user.id;
      if (req.user.role !== 'admin' && !isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You can only grade submissions for your own assignments'
        });
      }

      submission.grade = grade;
      submission.feedback = feedback;
      await submission.save();

      res.json({
        success: true,
        data: submission
      });

    } catch (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);


module.exports = router;