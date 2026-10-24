const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middleware/auth');
const authorize = require('../middleware/role');

const Certificate = require('../models/Certificate');


router.post(
  '/issue',
  requireLogin,
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const {
        student,
        course,
        pdfUrl
      } = req.body;

      const certificateCode = `CERT-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const cert = new Certificate({
        student,
        course,
        certificateCode,
        pdfUrl
      });

      await cert.save();

      res.status(201).json({
        success: true,
        data: cert
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
      const certs = await Certificate.find({
        student: req.params.studentId
      }).populate('course', 'title code');

      res.json({
        success: true,
        data: certs
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