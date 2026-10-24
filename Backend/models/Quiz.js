const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'TRUE_FALSE'], required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true }
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  timeLimitMinutes: { type: Number, default: 30 },
  passingScore: { type: Number, default: 50 },
  questions: [QuestionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);