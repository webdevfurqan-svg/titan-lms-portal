import { useState, useEffect } from "react";
import api from "../api";

function StudentDashboard({ user }) {
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [fees, setFees] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const enrollRes = await api.get("/courses/my");
      const enrollment = enrollRes.data.data;
      setMyEnrollment(enrollment);

      const [attendanceRes, feesRes, announcementsRes] = await Promise.all([
        api.get(`/attendance/student/${user.id}`),
        api.get("/fees/my"),
        api.get("/announcements"),
      ]);
      setAttendanceHistory(attendanceRes.data.data || []);
      setFees(feesRes.data.data || []);
      setAnnouncements((announcementsRes.data.data || []).slice(0, 3));

      if (enrollment) {
        const [assignmentsRes, scheduleRes] = await Promise.all([
          api.get("/assignments"),
          api.get("/timetable"),
        ]);
        const myAssignments = (assignmentsRes.data.data || []).filter(
          (a) => a.course?._id === enrollment.course._id
        );
        const mySchedule = (scheduleRes.data.data || []).filter(
          (s) => s.course?._id === enrollment.course._id
        );
        setAssignments(myAssignments);
        setSchedule(mySchedule);
      } else {
        setAssignments([]);
        setSchedule([]);
      }
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Some dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  let presentCount = 0;
  let totalSessions = 0;
  attendanceHistory.forEach((session) => {
    const myRecord = session.records.find(
      (r) => (r.student?._id || r.student) === user.id
    );
    if (myRecord) {
      totalSessions += 1;
      if (myRecord.status === "PRESENT") presentCount += 1;
    }
  });

  const upcomingAssignments = assignments.filter(
    (a) => new Date(a.dueDate) >= new Date()
  );

  const latestFee = fees[0];

  function feeBadgeClass(status) {
    const map = {
      PAID: "bg-success",
      PENDING: "bg-warning text-dark",
      REJECTED: "bg-danger",
      UNPAID: "bg-secondary",
    };
    return map[status] || "bg-secondary";
  }

  if (loading) return <div className="container mt-4">Loading dashboard...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="text-muted small">Welcome back,</div>
          <h4 className="mb-0">{user?.name || "Student"}</h4>
        </div>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {!myEnrollment && (
        <div className="alert alert-info">
          You're not enrolled in any course yet. Go to <strong>Courses</strong> to enroll.
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted mb-1">Attendance</h6>
              <h3 className="mb-0">
                {presentCount}/{totalSessions}
              </h3>
              <span className="text-muted small">sessions present</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted mb-1">Assignments</h6>
              <h3 className="mb-0">
                {upcomingAssignments.length}/{assignments.length}
              </h3>
              <span className="text-muted small">upcoming / total</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h6 className="text-muted mb-1">Latest Fee</h6>
              {latestFee ? (
                <>
                  <span className={"badge " + feeBadgeClass(latestFee.status)}>
                    {latestFee.status}
                  </span>
                  <div className="text-muted small mt-1">
                    {latestFee.month} — Rs. {latestFee.amount}/-
                  </div>
                </>
              ) : (
                <span className="text-muted small">No vouchers yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {myEnrollment && (
        <>
          <h5 className="mb-3">My Course</h5>
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h5 className="mb-0">{myEnrollment.course.title}</h5>
                {myEnrollment.course.code && (
                  <span className="badge bg-primary">{myEnrollment.course.code}</span>
                )}
              </div>
              <p className="text-muted small mb-2">
                Instructor: {myEnrollment.course.teacher?.name || "Assigned Staff"}
              </p>
              <p className="text-muted small mb-0">
                Enrolled until {new Date(myEnrollment.endDate).toDateString()}
              </p>
            </div>
          </div>
        </>
      )}

      <div className="row g-3">
        {/* Schedule */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header  fw-semibold">Class Schedule</div>
            <div className="card-body p-0 ">
              {schedule.length === 0 ? (
                <div className="p-3 text-muted small">No classes scheduled yet.</div>
              ) : (
                <table className="table mb-0 ">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item) => (
                      <tr key={item._id}>
                        <td>{item.day}</td>
                        <td>
                          {item.startTime} - {item.endTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header fw-semibold">Recent Announcements</div>
            <div className="card-body text-muted">
              {announcements.length === 0 ? (
                <div className="text-muted small">No announcements yet.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a._id} className="mb-3 pb-2 border-bottom">
                    <div className="fw-semibold">{a.title}</div>
                    <div className="small text-muted">{a.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <h5 className="mt-4 mb-3">Upcoming Assignments</h5>
      {!myEnrollment ? (
        <div className="alert alert-info">Enroll in a course to see your assignments.</div>
      ) : upcomingAssignments.length === 0 ? (
        <div className="alert alert-info">No upcoming assignments.</div>
      ) : (
        <div className="row">
          {upcomingAssignments.map((a) => (
            <div className="col-md-4 mb-3" key={a._id}>
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">{a.title}</h6>
                  <p className="text-muted small">Due: {new Date(a.dueDate).toDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;