import { useState, useEffect } from "react";
import api from "../api";

function TeacherDashboard({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [totalPoints, setTotalPoints] = useState(100);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOverview();
    fetchCourses();
  }, []);

  async function loadOverview() {
    setOverviewLoading(true);
    try {
      const [assignmentsRes, coursesRes, scheduleRes, announcementsRes] = await Promise.all([
        api.get("/assignments"),
        api.get("/courses"),
        api.get("/timetable"),
        api.get("/announcements"),
      ]);

      const myAssignments = assignmentsRes.data.data || [];
      setAssignments(myAssignments);

      const myCourses = (coursesRes.data.data || []).filter(
        (c) => c.teacher?._id === user?.id
      );
      setCourses(myCourses);

      const mySchedule = (scheduleRes.data.data || []).filter(
        (s) => s.teacher?._id === user?.id || s.teacher === user?.id
      );
      setSchedule(mySchedule);

      setAnnouncements((announcementsRes.data.data || []).slice(0, 3));

      // Pending-to-grade count: check submissions per assignment
      let pending = 0;
      for (const a of myAssignments) {
        try {
          const subRes = await api.get(`/assignments/${a._id}/submissions`);
          const subs = subRes.data.data || [];
          pending += subs.filter((s) => s.grade === null || s.grade === undefined).length;
        } catch {
          // if one assignment's submissions fail to load, skip it rather than breaking the whole count
        }
      }
      setPendingCount(pending);
    } catch (err) {
      console.error("Error loading overview:", err);
    } finally {
      setOverviewLoading(false);
    }
  }

  function fetchAssignments() {
    api
      .get("/assignments")
      .then((res) => setAssignments(res.data.data))
      .catch((err) => console.log("Error fetching assignments:", err));
  }

  function fetchCourses() {
    api
      .get("/courses")
      .then((res) => {
        const all = res.data.data || [];
        const mine = user?.id ? all.filter((c) => c.teacher?._id === user.id) : all;
        setCourses(mine);
      })
      .catch((err) => console.log("Error fetching courses:", err));
  }

  async function handleCreateAssignment(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!course) {
      setError("Please select a course.");
      return;
    }

    try {
      await api.post("/assignments", {
        title,
        description,
        course,
        dueDate,
        totalPoints,
      });
      setMessage("Assignment created successfully!");
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setCourse("");
      setDueDate("");
      setTotalPoints(100);
      fetchAssignments();
      loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating assignment.");
    }
  }

  async function handleViewSubmissions(assignment) {
    setSelectedAssignment(assignment);
    setError("");
    try {
      const res = await api.get("/assignments/" + assignment._id + "/submissions");
      setSubmissions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading submissions.");
    }
  }

  async function handleGradeSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await api.put("/assignments/submissions/" + gradingSubmission._id + "/grade", {
        grade,
        feedback,
      });
      setMessage("Grade saved successfully!");
      setGradingSubmission(null);
      setGrade("");
      setFeedback("");
      if (selectedAssignment) {
        handleViewSubmissions(selectedAssignment);
      }
      loadOverview();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving grade.");
    }
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
  <div>
    <div className="text-muted small">Welcome back,</div>
    <h4 className="mb-0">{user?.name || "Teacher"}</h4>
  </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShowCreateModal(true);
            setError("");
            setMessage("");
          }}
        >
          + Create Assignment
        </button>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Overview widgets */}
      {!overviewLoading && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">My Courses</h6>
                  <h3 className="mb-0">{courses.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">My Assignments</h6>
                  <h3 className="mb-0">{assignments.length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Pending to Grade</h6>
                  <h3 className="mb-0">
                    {pendingCount > 0 ? (
                      <span className="text-danger">{pendingCount}</span>
                    ) : (
                      pendingCount
                    )}
                  </h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Class Slots</h6>
                  <h3 className="mb-0">{schedule.length}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-lg-6">
              <div className="card shadow-sm h-100">
                <div className="card-header fw-semibold">My Class Schedule</div>
                <div className="card-body p-0">
                  {schedule.length === 0 ? (
                    <div className="p-3 text-muted small">No classes scheduled yet.</div>
                  ) : (
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Course</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((item) => (
                          <tr key={item._id}>
                            <td>{item.day}</td>
                            <td>
                              {item.startTime} - {item.endTime}
                            </td>
                            <td>{item.course?.title || "N/A"}</td>
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
                <div className="card-header bg-white fw-semibold">Recent Announcements</div>
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
        </>
      )}

      <h5 className="mb-3">My Assignments</h5>

      {assignments.length === 0 ? (
        <div className="alert alert-info">You haven't created any assignments yet.</div>
      ) : (
        <div className="row">
          {assignments.map((a) => (
            <div className="col-md-4 mb-3" key={a._id}>
              <div className="card h-100">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{a.title}</h5>
                  <p className="card-text text-muted">{a.description}</p>
                  <p className="text-muted small">
                    Due: {new Date(a.dueDate).toDateString()}
                  </p>
                  <button
                    onClick={() => handleViewSubmissions(a)}
                    className="btn btn-outline-primary btn-sm mt-auto"
                  >
                    View Submissions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAssignment && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submissions for {selectedAssignment.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAssignment(null)}
                ></button>
              </div>
              <div className="modal-body">
                {submissions.length === 0 ? (
                  <p className="text-muted">No submissions for this assignment yet.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>File</th>
                        <th>Submitted At</th>
                        <th>Grade</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr key={sub._id}>
                          <td>{sub.student?.name || "Student"}</td>
                          <td>
                            <a
  href={sub.fileUrl}
  target="_blank"
  rel="noreferrer"
  className="btn btn-sm btn-link"
>
  {sub.fileName || "View File"}
  {sub.fileSize > 0 && (
    <span className="text-muted ms-1" style={{ fontSize: "0.75rem" }}>
      ({(sub.fileSize / 1024).toFixed(0)} KB)
    </span>
  )}
</a>
                          </td>
                          <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                          <td>
                            {sub.grade !== null && sub.grade !== undefined ? (
                              <span className="badge bg-success">{sub.grade} / 100</span>
                            ) : (
                              <span className="badge bg-secondary">Ungraded</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGrade(
                                  sub.grade !== null && sub.grade !== undefined ? sub.grade : ""
                                );
                                setFeedback(sub.feedback || "");
                              }}
                            >
                              Grade / Feedback
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAssignment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Assignment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateAssignment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select
                      className="form-select"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      required
                    >
                      <option value="">Select a course...</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.code ? `${c.code} — ${c.title}` : c.title}
                        </option>
                      ))}
                    </select>
                    {courses.length === 0 && (
                      <div className="form-text text-warning">
                        You have no courses yet. Create a course before adding an assignment.
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Total Points</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {gradingSubmission && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Grade Submission: {gradingSubmission.student?.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setGradingSubmission(null)}
                ></button>
              </div>
              <form onSubmit={handleGradeSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Grade (out of 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Feedback</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Optional feedback..."
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setGradingSubmission(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Save Grade & Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;