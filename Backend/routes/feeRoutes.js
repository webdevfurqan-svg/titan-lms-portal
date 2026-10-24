const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../config/upload');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryUpload');

const Fee = require('../models/Fee');
const Enrollment = require('../models/Enrollment');

router.post('/', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const { student, course, month, amount, type, dueDate } = req.body;

    if (!student || !course || !month || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'student, course, month, amount, and dueDate are required.',
      });
    }

    const fee = new Fee({ student, course, month, amount, type, dueDate });
    await fee.save();

    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/bulk-create', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const { course, month, amount, type, dueDate } = req.body;

    if (!course || !month || !amount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'course, month, amount, and dueDate are required.',
      });
    }

    const enrollments = await Enrollment.find({
      course,
      status: 'active',
      endDate: { $gte: new Date() },
    });

    if (enrollments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No actively enrolled students found for this course.',
      });
    }

    let created = 0;
    let skipped = 0;

    for (const enrollment of enrollments) {
      const existing = await Fee.findOne({
        student: enrollment.student,
        course,
        month,
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await Fee.create({
        student: enrollment.student,
        course,
        month,
        amount,
        type: type || 'Monthly',
        dueDate,
      });
      created += 1;
    }

    res.status(201).json({
      success: true,
      message: `${created} voucher(s) created. ${skipped} skipped (already existed for that month).`,
      data: { created, skipped },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'name email')
      .populate('course', 'title code')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', requireLogin, authorize('student'), async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.user.id })
      .populate('course', 'title code')
      .sort({ dueDate: -1 });

    res.json({ success: true, data: fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post(
  '/:id/proof',
  requireLogin,
  authorize('student'),
  upload.single('proof'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a payment screenshot or receipt.',
        });
      }

      const fee = await Fee.findById(req.params.id);
      if (!fee) {
        return res.status(404).json({ success: false, message: 'Voucher not found.' });
      }
      if (fee.student.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'This is not your voucher.' });
      }
      if (fee.status === 'PAID') {
        return res.status(400).json({ success: false, message: 'This voucher is already marked as paid.' });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, 'lms-fee-proofs');

      fee.proofUrl = result.secure_url;
      fee.status = 'PENDING';
      fee.rejectionReason = '';
      await fee.save();

      res.json({ success: true, data: fee });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);
router.put('/:id/verify', requireLogin, authorize('admin'), async (req, res) => {
  try {
    const { action, reason } = req.body;

    const fee = await Fee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Voucher not found.' });
    }

    if (action === 'approve') {
      fee.status = 'PAID';
      fee.paidAt = new Date();
      fee.rejectionReason = '';
    } else if (action === 'reject') {
      fee.status = 'REJECTED';
      fee.rejectionReason = reason || 'Payment proof rejected. Please resubmit.';
    } else {
      return res.status(400).json({ success: false, message: 'action must be "approve" or "reject".' });
    }

    await fee.save();
    res.json({ success: true, data: fee });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;