const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  certificateCode: { type: String, required: true, unique: true },
  issuedAt: { type: Date, default: Date.now },
  pdfUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);