const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);