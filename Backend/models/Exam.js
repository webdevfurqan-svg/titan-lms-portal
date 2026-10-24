const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  startTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  passingPercentage: { type: Number, default: 40 },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String }],
    correctOption: { type: Number, required: true },
    marks: { type: Number, default: 1 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Exam', ExamSchema);