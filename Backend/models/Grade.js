const mongoose = require('mongoose');

const GradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assignmentScore: { type: Number, default: 0 },
  quizScore: { type: Number, default: 0 },
  midtermScore: { type: Number, default: 0 },
  finalExamScore: { type: Number, default: 0 },
  overallPercentage: { type: Number, default: 0 },
  letterGrade: { type: String, default: 'F' }
}, { timestamps: true });

module.exports = mongoose.model('Grade', GradeSchema);