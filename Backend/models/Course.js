const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String },
  content: { type: String },
  materialUrl: { type: String }
});

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String },
    durationMonths: { type: Number, default: 1, min: 1 },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  modules: [ModuleSchema],
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);