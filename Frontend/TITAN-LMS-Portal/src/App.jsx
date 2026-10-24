// import { Routes, Route, Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";

// import Navbar from "./components/Navbar";
// import ProtectedRoute from "./components/ProtectedRoute";

// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import TeacherDashboard from "./pages/TeacherDashboard";
// import StudentDashboard from "./pages/StudentDashboard";
// import AdminDashboard from "./pages/AdminDashboard";
// import Payment from "./pages/Payment";
// import Profile from "./pages/Profile";

// // Feature Pages
// import Courses from "./pages/Courses";
// import Assignments from "./pages/Assignments";
// import Quizzes from "./pages/Quizzes";
// import Attendance from "./pages/Attendance";
// import Grades from "./pages/Grades";
// import Timetable from "./pages/Timetable";
// import Announcements from "./pages/Announcements";
// import Messages from "./pages/Messages";
// import Certificates from "./pages/Certificates";

// function App() {
//   const { user } = useAuth();

//   return (
//     <>
//       <Navbar />

//       <Routes>
//         {/* ==================== PUBLIC ROUTES ==================== */}

//         <Route path="/login" element={<Login />} />

//         <Route path="/register" element={<Register />} />

//         {/* ==================== SHARED PROTECTED ROUTES (any logged-in role) ==================== */}

//         <Route
//           element={
//             <ProtectedRoute allowedRoles={["admin", "teacher", "student"]} />
//           }
//         >
//           <Route
//             path="/profile"
//             element={<Profile />}
//           />
//         </Route>

//         {/* ==================== ADMIN ROUTES ==================== */}

//         <Route
//           element={
//             <ProtectedRoute allowedRoles={["admin"]} />
//           }
//         >
//           <Route
//             path="/admin/dashboard"
//             element={<AdminDashboard user={user} />}
//           />
//         </Route>

//         {/* ==================== TEACHER ROUTES ==================== */}

//         <Route
//           element={
//             <ProtectedRoute allowedRoles={["teacher"]} />
//           }
//         >
//           <Route
//             path="/teacher/dashboard"
//             element={<TeacherDashboard user={user} />}
//           />

//           <Route
//             path="/courses"
//             element={<Courses user={user} />}
//           />

//           <Route
//             path="/assignments"
//             element={<Assignments />}
//           />

//           <Route
//             path="/quizzes"
//             element={<Quizzes />}
//           />

//           <Route path="/attendance" element={<Attendance user={user} />} />

//           <Route
//             path="/grades"
//             element={<Grades />}
//           />

//           <Route path="/timetable" element={<Timetable user={user} />} />

//           <Route path="/announcements" element={<Announcements user={user} />} />

//           <Route
//             path="/messages"
//             element={<Messages />}
//           />

//           <Route
//             path="/certificates"
//             element={<Certificates />}
//           />
//         </Route>

//         {/* ==================== STUDENT ROUTES ==================== */}

//         <Route
//           element={
//             <ProtectedRoute allowedRoles={["student"]} />
//           }
//         >
//           <Route
//             path="/student/dashboard"
//             element={<StudentDashboard user={user} />}
//           />

//           <Route
//             path="/student/courses"
//             element={<Courses user={user} />}
//           />

//           <Route
//             path="/student/assignments"
//             element={<Assignments />}
//           />

//           <Route
//             path="/student/quizzes"
//             element={<Quizzes />}
//           />

//           <Route path="/student/attendance" element={<Attendance user={user} />} />

//           <Route
//             path="/student/grades"
//             element={<Grades />}
//           />

//           <Route path="/student/timetable" element={<Timetable user={user} />} />

//           <Route path="/student/announcements" element={<Announcements user={user} />} />

//           <Route
//             path="/student/messages"
//             element={<Messages />}
//           />

//           <Route
//             path="/student/certificates"
//             element={<Certificates />}
//           />

//           <Route
//             path="/student/payment"
//             element={<Payment user={user} />}
//           />
//         </Route>

//         {/* ==================== ROOT ==================== */}

//         <Route
//           path="/"
//           element={<Navigate to="/login" replace />}
//         />

//         {/* ==================== FALLBACK ==================== */}

//         <Route
//           path="*"
//           element={<Navigate to="/" replace />}
//         />
//       </Routes>
//     </>
//   );
// }

// export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Payment from "./pages/Payment";
import Profile from "./pages/Profile";

// Feature Pages
import Courses from "./pages/Courses";
import Assignments from "./pages/Assignments";
import Quizzes from "./pages/Quizzes";
import Attendance from "./pages/Attendance";
import Grades from "./pages/Grades";
import Timetable from "./pages/Timetable";
import Announcements from "./pages/Announcements";
import Messages from "./pages/Messages";
import Certificates from "./pages/Certificates";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* SHARED PROTECTED ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "teacher", "student"]} />}>
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard user={user} />} />
        </Route>

        {/* TEACHER ROUTES */}
        <Route
  element={
    <ProtectedRoute allowedRoles={["teacher", "admin"]} />
  }
>
          <Route path="/teacher/dashboard" element={<TeacherDashboard user={user} />} />
          <Route path="/courses" element={<Courses user={user} />} />
          <Route path="/assignments" element={<Assignments user={user} />} />
          <Route path="/quizzes" element={<Quizzes user={user} />} />
          <Route path="/attendance" element={<Attendance user={user} />} />
          <Route path="/grades" element={<Grades user={user} />} />
          <Route path="/timetable" element={<Timetable user={user} />} />
          <Route path="/announcements" element={<Announcements user={user} />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/certificates" element={<Certificates />} />
        </Route>

        {/* STUDENT ROUTES */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
          <Route path="/student/courses" element={<Courses user={user} />} />
          <Route path="/student/assignments" element={<Assignments user={user} />} />
          <Route path="/student/quizzes" element={<Quizzes />} />
          <Route path="/student/attendance" element={<Attendance user={user} />} />
          <Route path="/student/grades" element={<Grades user={user} />} />
          <Route path="/student/timetable" element={<Timetable user={user} />} />
          <Route path="/student/announcements" element={<Announcements user={user} />} />
          <Route path="/student/messages" element={<Messages />} />
          <Route path="/student/certificates" element={<Certificates />} />
          <Route path="/student/payment" element={<Payment user={user} />} />
        </Route>

        {/* ROOT & FALLBACK */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;