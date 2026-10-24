const mongoose = require('mongoose');

const AttendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], required: true }
});

const AttendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  records: [AttendanceRecordSchema]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);