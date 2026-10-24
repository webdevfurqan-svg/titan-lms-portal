require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Grade = require('./models/Grade');
const Fee = require('./models/Fee');
const Timetable = require('./models/Timetable');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const teacherPass = await bcrypt.hash('demoteacher123', 10);
  const studentPass = await bcrypt.hash('demostudent123', 10);

  let teacher = await User.findOne({ email: 'demoteacher@titanlms.com' });
  if (!teacher) {
    teacher = await User.create({ name: 'Demo Teacher', email: 'demoteacher@titanlms.com', password: teacherPass, role: 'teacher' });
    console.log('Created demo teacher');
  } else {
    teacher.password = teacherPass; await teacher.save();
    console.log('Updated demo teacher password');
  }

  let student = await User.findOne({ email: 'demostudent@titanlms.com' });
  if (!student) {
    student = await User.create({ name: 'Demo Student', email: 'demostudent@titanlms.com', password: studentPass, role: 'student' });
    console.log('Created demo student');
  } else {
    student.password = studentPass; await student.save();
    console.log('Updated demo student password');
  }

  let courses = await Course.find({ teacher: teacher._id });
  if (courses.length === 0) {
    const c1 = await Course.create({
      title: 'Demo Course 101',
      code: 'DEMO101',
      description: 'A demo course for testing teacher flows.',
      teacher: teacher._id,
      enrolledStudents: [student._id],
      modules: [{ title: 'Module 1', lessons: [{ title: 'Lesson 1', content: 'Demo content' }] }],
      isPublished: true
    });
    const c2 = await Course.create({
      title: 'Demo Course 102',
      code: 'DEMO102',
      description: 'Another demo course.',
      teacher: teacher._id,
      enrolledStudents: [student._id],
      modules: [{ title: 'Module 1', lessons: [{ title: 'Lesson 1', content: 'Demo content 2' }] }],
      isPublished: true
    });
    courses = [c1, c2];
  
    for (const c of courses) {
      await Assignment.create({ title: `${c.code} Assignment 1`, description: 'Demo assignment.', course: c._id, dueDate: new Date(Date.now()+7*24*60*60*1000), totalPoints: 100, createdBy: teacher._id });
      await Timetable.create({ course: c._id, teacher: teacher._id, day: 'Monday', startTime: '09:00', endTime: '11:00', room: 'Lab Demo', meetingLink: 'https://meet.titanlms.com/demo' });
    }
    console.log('Created demo courses, assignments, timetable');
  } else {
    for (const c of courses) {
      if (!c.enrolledStudents.some(id => id.equals(student._id))) {
        c.enrolledStudents.push(student._id);
        await c.save();
      }
    }
  }

  const allCourses = await Course.find();
  for (const c of allCourses) {
    if (!c.enrolledStudents.some(id => id.equals(student._id))) {
      c.enrolledStudents.push(student._id);
      await c.save();
    }
  }

  for (const c of allCourses) {
    const exists = await Grade.findOne({ student: student._id, course: c._id });
    if (!exists) {
      const as=75, qs=80, ms=78, fs=85, pct=Math.round((as+qs+ms+fs)/4);
      await Grade.create({ student: student._id, course: c._id, assignmentScore: as, quizScore: qs, midtermScore: ms, finalExamScore: fs, overallPercentage: pct, letterGrade: 'B' });
    }
  }

  const feeCount = await Fee.countDocuments({ student: student._id });
  if (feeCount === 0) {
    await Fee.create({ student: student._id, course: allCourses[0]._id, month: 'Oct 2026', amount: 5000, type: 'Monthly', dueDate: new Date(Date.now()+15*24*60*60*1000), status: 'UNPAID' });
    await Fee.create({ student: student._id, course: allCourses[0]._id, month: 'Sep 2026', amount: 5000, type: 'Monthly', dueDate: new Date(Date.now()-15*24*60*60*1000), status: 'PAID', paidAt: new Date() });
  }

  console.log('\nDemo accounts ready:');
  console.log('Teacher:', teacher.email, '/ demoteacher123');
  console.log('Student:', student.email, '/ demostudent123');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
