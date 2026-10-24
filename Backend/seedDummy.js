require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Course = require('./models/Course');
const Timetable = require('./models/Timetable');
const Assignment = require('./models/Assignment');
const Submission = require('./models/Submission');
const Quiz = require('./models/Quiz');
const Exam = require('./models/Exam');
const Grade = require('./models/Grade');
const Attendance = require('./models/Attendance');
const Announcement = require('./models/Announcement');
const Message = require('./models/Message');
const Certificate = require('./models/Certificate');
const Fee = require('./models/Fee');
const Notification = require('./models/Notification');

async function clearAll() {
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Timetable.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Quiz.deleteMany({}),
    Exam.deleteMany({}),
    Grade.deleteMany({}),
    Attendance.deleteMany({}),
    Announcement.deleteMany({}),
    Message.deleteMany({}),
    Certificate.deleteMany({}),
    Fee.deleteMany({}),
    Notification.deleteMany({}),
  ]);
}

function modulesFor(title) {
  return [
    {
      title: `${title} - Module 1: Foundations`,
      lessons: [
        { title: 'Lesson 1: Introduction', content: `Welcome to ${title}.`, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { title: 'Lesson 2: Core Concepts', content: 'Core concepts overview.', materialUrl: 'https://example.com/materials/intro.pdf' }
      ]
    },
    {
      title: `${title} - Module 2: Practice`,
      lessons: [
        { title: 'Lesson 3: Hands-on Exercise', content: 'Practice exercises.', videoUrl: 'https://www.youtube.com/watch?v=abc123' },
        { title: 'Lesson 4: Review & Quiz Prep', content: 'Review for upcoming assessments.' }
      ]
    }
  ];
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to', mongoose.connection.name);

  await clearAll();
  console.log('Cleared existing data.');

  const teacherPass = await bcrypt.hash('teacher123', 10);
  const studentPass = await bcrypt.hash('student123', 10);
  const adminPass = await bcrypt.hash('admin666', 10);

  const admin = await User.create({
    name: 'Titan Admin',
    email: 'admin@titanlms.com',
    password: adminPass,
    role: 'admin'
  });

  const teachers = await User.insertMany([
    { name: 'Dr. Sarah Ahmed', email: 'sarah.ahmed@titanlms.com', password: teacherPass, role: 'teacher' },
    { name: 'Prof. Michael Chen', email: 'michael.chen@titanlms.com', password: teacherPass, role: 'teacher' },
    { name: 'Ms. Ayesha Khan', email: 'ayesha.khan@titanlms.com', password: teacherPass, role: 'teacher' },
  ]);

  const studentDefs = [
    'Ali Raza', 'Fatima Noor', 'Hassan Ali', 'Zainab Malik', 'Omar Farooq',
    'Sara Ahmed', 'Bilal Hussain', 'Nadia Iqbal', 'Kamran Shah', 'Amina Tariq'
  ];
  const students = await User.insertMany(studentDefs.map((name, i) => ({
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.titanlms.com`,
    password: studentPass,
    role: 'student'
  })));

  const courseDefs = [
    { title: 'Introduction to Computer Science', code: 'CS101', teacher: teachers[0] },
    { title: 'Web Development Fundamentals', code: 'WD201', teacher: teachers[1] },
    { title: 'Database Systems', code: 'DB301', teacher: teachers[2] },
    { title: 'Data Structures & Algorithms', code: 'DSA210', teacher: teachers[0] },
    { title: 'Operating Systems', code: 'OS310', teacher: teachers[1] },
    { title: 'Software Engineering', code: 'SE401', teacher: teachers[2] },
  ];

  const enrollMap = {
    0: [0, 1, 2, 3, 4],
    1: [2, 3, 4, 5, 6],
    2: [5, 6, 7, 8, 9],
    3: [0, 4, 7, 8, 9],
    4: [1, 3, 5, 6, 8],
    5: [0, 2, 6, 7, 9],
  };

  const courses = [];
  for (let i = 0; i < courseDefs.length; i++) {
    const def = courseDefs[i];
    const enrolled = enrollMap[i].map(idx => students[idx]._id);
    const course = await Course.create({
      title: def.title,
      code: def.code,
      description: `Comprehensive course covering ${def.title.toLowerCase()} with hands-on projects and assessments.`,
      teacher: def.teacher._id,
      enrolledStudents: enrolled,
      modules: modulesFor(def.title),
      isPublished: true
    });
    courses.push(course);
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const rooms = ['Room 101', 'Lab A', 'Room 202', 'Lab B', 'Auditorium'];
  const slots = [
    { start: '09:00', end: '11:00' },
    { start: '11:30', end: '13:30' },
    { start: '14:00', end: '16:00' },
  ];
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    await Timetable.create({
      course: c._id,
      teacher: c.teacher,
      day: days[i % days.length],
      startTime: slots[i % slots.length].start,
      endTime: slots[i % slots.length].end,
      room: rooms[i % rooms.length],
      meetingLink: `https://meet.titanlms.com/${c.code.toLowerCase()}`
    });
  }

  const assignmentTitles = [
    ['Assignment 1: Fundamentals', 'Assignment 2: Mini Project'],
    ['Assignment 1: HTML/CSS Basics', 'Assignment 2: REST API'],
    ['Assignment 1: ER Diagrams', 'Assignment 2: SQL Queries'],
    ['Assignment 1: Searching & Sorting', 'Assignment 2: Linked Lists'],
    ['Assignment 1: Process Scheduling', 'Assignment 2: Memory Management'],
    ['Assignment 1: Requirements', 'Assignment 2: UML Design'],
  ];
  const assignmentsByCourse = [];
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    const teacher = teachers.find(t => t._id.equals(c.teacher));
    const list = [];
    for (let j = 0; j < 2; j++) {
      const a = await Assignment.create({
        title: assignmentTitles[i][j],
        description: `Complete the ${assignmentTitles[i][j].toLowerCase()} tasks and submit your solution as a PDF.`,
        course: c._id,
        dueDate: new Date(Date.now() + (7 + j * 7) * 24 * 60 * 60 * 1000),
        totalPoints: 100,
        createdBy: c.teacher
      });
      list.push(a);
    }
    assignmentsByCourse.push(list);
  }

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    await Quiz.create({
      title: `${c.code} Midterm Quiz`,
      course: c._id,
      timeLimitMinutes: 30,
      passingScore: 50,
      questions: [
        { questionText: 'Which of the following is correct?', type: 'MCQ', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' },
        { questionText: 'What is 2 + 2?', type: 'MCQ', options: ['3', '4', '5'], correctAnswer: '4' },
        { questionText: 'Is the statement true?', type: 'TRUE_FALSE', options: ['True', 'False'], correctAnswer: 'True' },
        { questionText: 'Select the best answer:', type: 'MCQ', options: ['Option 1', 'Option 2', 'Option 3'], correctAnswer: 'Option 2' },
        { questionText: 'Final check question:', type: 'MCQ', options: ['Yes', 'No', 'Maybe'], correctAnswer: 'Yes' },
      ]
    });
  }

  // Exams (1 per course)
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    await Exam.create({
      title: `${c.code} Final Exam`,
      course: c._id,
      startTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      durationMinutes: 120,
      totalMarks: 100,
      passingPercentage: 40,
      questions: [
        { questionText: 'Q1: Explain the core concept.', options: ['A', 'B', 'C', 'D'], correctOption: 0, marks: 10 },
        { questionText: 'Q2: Solve the problem.', options: ['1', '2', '3', '4'], correctOption: 2, marks: 10 },
        { questionText: 'Q3: Identify the issue.', options: ['Bug', 'Feature', 'None'], correctOption: 0, marks: 10 },
      ]
    });
  }

  // Submissions + some grades
  const submissionFileUrl = 'https://res.cloudinary.com/demo/image/upload/sample.pdf';
  for (let ci = 0; ci < courses.length; ci++) {
    const c = courses[ci];
    const enrolledIds = enrollMap[ci].map(idx => students[idx]._id);
    for (let ai = 0; ai < 2; ai++) {
      const assignment = assignmentsByCourse[ci][ai];
      // first 3 enrolled students submit
      for (let si = 0; si < Math.min(3, enrolledIds.length); si++) {
        const stuId = enrolledIds[si];
        let sub = await Submission.create({
          assignment: assignment._id,
          student: stuId,
          fileUrl: submissionFileUrl,
          grade: (ai === 0 && si === 0) ? null : (70 + si * 5 + ai * 3),
          feedback: (ai === 0 && si === 0) ? '' : 'Good work, keep improving.'
        });
      }
    }
  }

  // Grade (one per student per course)
  const letters = ['A', 'B', 'C', 'D', 'F'];
  for (let ci = 0; ci < courses.length; ci++) {
    const c = courses[ci];
    const enrolledIdxs = enrollMap[ci];
    for (const si of enrolledIdxs) {
      const stu = students[si];
      const as = 60 + Math.floor(Math.random() * 35);
      const qs = 60 + Math.floor(Math.random() * 35);
      const ms = 60 + Math.floor(Math.random() * 35);
      const fs = 60 + Math.floor(Math.random() * 35);
      const pct = Math.round((as + qs + ms + fs) / 4);
      let letter = 'F';
      if (pct >= 90) letter = 'A';
      else if (pct >= 80) letter = 'B';
      else if (pct >= 70) letter = 'C';
      else if (pct >= 60) letter = 'D';
      await Grade.create({
        student: stu._id,
        course: c._id,
        assignmentScore: as,
        quizScore: qs,
        midtermScore: ms,
        finalExamScore: fs,
        overallPercentage: pct,
        letterGrade: letter
      });
    }
  }

  // Attendance (3 dates per course)
  for (let ci = 0; ci < courses.length; ci++) {
    const c = courses[ci];
    const enrolledIds = enrollMap[ci].map(idx => students[idx]._id);
    for (let d = 0; d < 3; d++) {
      const date = new Date(Date.now() - (d + 1) * 7 * 24 * 60 * 60 * 1000);
      const records = enrolledIds.map(sid => ({
        student: sid,
        status: ['PRESENT', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'][Math.floor(Math.random() * 5)]
      }));
      await Attendance.create({ course: c._id, date, records });
    }
  }

  // Announcements
  const announcementDefs = [
    { title: 'Welcome to TiTan LMS', content: 'Welcome to the new semester! Explore your courses and stay on track.', targetRole: 'ALL' },
    { title: 'System Maintenance', content: 'The portal will be down for maintenance this Sunday 2am-4am.', targetRole: 'ALL', course: null },
    { title: 'Assignment Deadline Reminder', content: 'Remember to submit Assignment 1 before the due date.', targetRole: 'STUDENT' },
    { title: 'Faculty Meeting', content: 'All teachers are requested to attend the meeting on Friday.', targetRole: 'TEACHER' },
    { title: 'New Course Published', content: 'A new course has been published. Enroll now!', targetRole: 'ALL' },
  ];
  for (let i = 0; i < announcementDefs.length; i++) {
    const ad = announcementDefs[i];
    const author = i % 2 === 0 ? admin._id : teachers[i % teachers.length]._id;
    const doc = { title: ad.title, content: ad.content, author, targetRole: ad.targetRole };
    if (ad.course) doc.course = ad.course;
    await Announcement.create(doc);
  }

  // Messages
  for (let i = 0; i < 5; i++) {
    await Message.create({
      sender: students[i]._id,
      recipient: teachers[i % teachers.length]._id,
      content: `Hello, I have a question about ${courses[i % courses.length].code}.`,
      isRead: i % 2 === 0
    });
    await Message.create({
      sender: teachers[i % teachers.length]._id,
      recipient: students[i]._id,
      content: `Sure, please attend the next class and we will clarify.`,
      isRead: false
    });
  }

  for (let i = 0; i < 3; i++) {
    const stu = students[i];
    const c = courses[i];
    await Certificate.create({
      student: stu._id,
      course: c._id,
      certificateCode: `CERT-${Date.now()}-${1000 + i}`,
      pdfUrl: 'https://example.com/certificates/sample.pdf',
      issuedAt: new Date()
    });
  }

  const months = ['Sep 2026', 'Oct 2026'];
  for (let i = 0; i < 5; i++) {
    const stu = students[i];
    const c = courses[i % courses.length];
    for (let m = 0; m < months.length; m++) {
      await Fee.create({
        student: stu._id,
        course: c._id,
        month: months[m],
        amount: 5000,
        type: 'Monthly',
        dueDate: new Date(Date.now() + (m + 1) * 15 * 24 * 60 * 60 * 1000),
        status: m === 0 ? 'PAID' : 'UNPAID',
        paidAt: m === 0 ? new Date() : null
      });
    }
  }

  for (let i = 0; i < students.length; i++) {
    await Notification.create({
      recipient: students[i]._id,
      title: 'New Assignment Posted',
      message: `A new assignment has been posted in ${courses[i % courses.length].code}.`,
      type: 'ASSIGNMENT',
      isRead: false,
      link: '/assignments'
    });
    await Notification.create({
      recipient: students[i]._id,
      title: 'Grade Published',
      message: 'Your recent submission has been graded.',
      type: 'GRADE',
      isRead: i % 2 === 0
    });
  }
  await Notification.create({
    recipient: admin._id,
    title: 'System Ready',
    message: 'Dummy data seeding completed successfully.',
    type: 'SYSTEM',
    isRead: false
  });

  console.log('Seeding complete!');
  console.log('Admin:', admin.email, '/ admin666');
  console.log('Teachers: 3 (password: teacher123)');
  console.log('Students: 10 (password: student123)');
  console.log('Courses:', courses.length);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
