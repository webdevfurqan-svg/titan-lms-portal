import { useState, useEffect } from "react";
import api from "../api";

function AdminDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
    const [fees, setFees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState("overview");

  const [viewingStudent, setViewingStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [reassigningCourse, setReassigningCourse] = useState(null);
  const [newTeacherId, setNewTeacherId] = useState("");
  
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseDuration, setCourseDuration] = useState(1);
  const [courseTeacherId, setCourseTeacherId] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [voucherMode, setVoucherMode] = useState("single"); // "single" | "bulk"
  const [courseCreateError, setCourseCreateError] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState(1000);
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [quizResults, setQuizResults] = useState([]);

  const [rejectingFee, setRejectingFee] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
const [statsRes, studentsRes, teachersRes, coursesRes, feesRes, gradesRes, quizResultsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users?role=student"),
        api.get("/admin/users?role=teacher"),
        api.get("/courses"),
        api.get("/fees"),
        api.get("/admin/grades"),
        api.get("/quizzes/admin/results"),
      ]);
      setStats(statsRes.data.data);
      setStudents(studentsRes.data.data);
      setTeachers(teachersRes.data.data);
      setCourses(coursesRes.data.data);
      setFees(feesRes.data.data);
      setGrades(gradesRes.data.data);
      setQuizResults(quizResultsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function openStudentDetail(student) {
    setViewingStudent(student);
    setDetailLoading(true);
    setStudentDetail(null);
    try {
      const res = await api.get(`/admin/students/${student._id}`);
      setStudentDetail(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Error loading student detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDeactivate(studentId) {
    if (!confirm("Deactivate this student? They will be unenrolled and unable to log in. Their academic records are preserved.")) return;
    setError("");
    setMessage("");
    try {
      await api.post(`/admin/students/${studentId}/deactivate`);
      setMessage("Student deactivated.");
      loadAll();
      setViewingStudent(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error deactivating student.");
    }
  }
  

  
async function handlePermanentDelete(student) {
  const confirmText = prompt(
    `This PERMANENTLY deletes ${student.name} and all their submissions. This cannot be undone.\n\nType DELETE to confirm:`
  );
  if (confirmText !== "DELETE") return;

  setError("");
  setMessage("");
  try {
    await api.delete(`/admin/students/${student._id}`);
    setMessage(`${student.name} has been permanently deleted.`);
    loadAll();
    setViewingStudent(null);
  } catch (err) {
    setError(err.response?.data?.message || "Error deleting student.");
  }
}

async function handleReactivate(studentId) {
  setError("");
  setMessage("");
  try {
    await api.post(`/admin/students/${studentId}/reactivate`);
    setMessage("Student reactivated.");
    loadAll();
  } catch (err) {
    setError(err.response?.data?.message || "Error reactivating student.");
  }
}

async function handleCreateVoucher(e) {
  e.preventDefault();
  setError("");
  setMessage("");

  if (!courseId || !month || !dueDate) {
    setError("Course, month, and due date are required.");
    return;
  }
  if (voucherMode === "single" && !studentId) {
    setError("Please select a student, or switch to 'All Students in Course'.");
    return;
  }

  setCreating(true);
  try {
    if (voucherMode === "bulk") {
      const res = await api.post("/fees/bulk-create", {
        course: courseId,
        month,
        amount,
        type: "Monthly",
        dueDate,
      });
      setMessage(res.data.message);
    } else {
      await api.post("/fees", {
        student: studentId,
        course: courseId,
        month,
        amount,
        type: "Monthly",
        dueDate,
      });
      setMessage("Voucher created successfully!");
    }
    setShowCreateModal(false);
    setStudentId("");
    setCourseId("");
    setMonth("");
    setAmount(1000);
    setDueDate("");
    setVoucherMode("single");
    loadAll();
  } catch (err) {
    setError(err.response?.data?.message || "Error creating voucher.");
  } finally {
    setCreating(false);
  }
}


  async function handleReassignTeacher(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.put(`/admin/courses/${reassigningCourse._id}/teacher`, { teacherId: newTeacherId });
      setMessage("Course teacher updated.");
      setReassigningCourse(null);
      setNewTeacherId("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error updating teacher.");
    }
  }

  async function handleCreateVoucher(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!studentId || !courseId || !month || !dueDate) {
      setError("All fields are required.");
      return;
    }

    setCreating(true);
    try {
      await api.post("/fees", {
        student: studentId,
        course: courseId,
        month,
        amount,
        type: "Monthly",
        dueDate,
      });
      setMessage("Voucher created successfully!");
      setShowCreateModal(false);
      setStudentId("");
      setCourseId("");
      setMonth("");
      setAmount(1000);
      setDueDate("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating voucher.");
    } finally {
      setCreating(false);
    }
  }

  async function handleApprove(feeId) {
    setError("");
    setMessage("");
    try {
      await api.put(`/fees/${feeId}/verify`, { action: "approve" });
      setMessage("Payment approved.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error approving payment.");
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.put(`/fees/${rejectingFee._id}/verify`, {
        action: "reject",
        reason: rejectReason,
      });
      setMessage("Payment rejected.");
      setRejectingFee(null);
      setRejectReason("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Error rejecting payment.");
    }
  }

  function feeBadge(status) {
    const map = {
      UNPAID: "bg-secondary",
      PENDING: "bg-warning text-dark",
      PAID: "bg-success",
      REJECTED: "bg-danger",
    };
    return <span className={"badge " + (map[status] || "bg-secondary")}>{status}</span>;
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading admin dashboard...</div>;
  }

  return (
    <div>
      <h2 style={{ color: "var(--text-main)" }}>Admin Dashboard — {user?.name || "Admin"}</h2>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {/* Institution-wide stats */}
      {stats && (
        <div className="row g-3 my-3">
          {[
            { label: "Students", value: stats.totalStudents },
            { label: "Teachers", value: stats.totalTeachers },
            { label: "Courses", value: stats.totalCourses },
            { label: "Active Enrollments", value: stats.activeEnrollments },
            { label: "Assignments", value: stats.totalAssignments },
            { label: "Pending Grading", value: stats.pendingSubmissions },
          ].map((s) => (
            <div className="col-6 col-md-2" key={s.label}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1" style={{ fontSize: "0.78rem" }}>{s.label}</h6>
                  <h4 className="mb-0">{s.value}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
            <ul className="nav nav-pills mb-3">
{["overview", "students", "teachers", "courses", "grades", "quizzes", "fees"].map((tab) => (
          <li className="nav-item" key={tab}>
            <button
              className={"nav-link " + (activeTab === tab ? "active" : "")}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: "capitalize" }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "overview" && (
        <div className="alert alert-info">
          Use the tabs above to manage students, teachers, courses, and fee vouchers institution-wide.
        </div>
      )}

      {activeTab === "students" && (
        <table className="table table-bordered bg-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>
                  {s.active === false ? (
                    <span className="badge bg-danger">Deactivated</span>
                  ) : (
                    <span className="badge bg-success">Active</span>
                  )}
                </td>
                <td>
  <div className="d-flex gap-1 flex-wrap">
    <button className="btn btn-sm btn-outline-primary" onClick={() => openStudentDetail(s)}>
      View
    </button>
    {s.active === false ? (
      <button className="btn btn-sm btn-success" onClick={() => handleReactivate(s._id)}>
        Reactivate
      </button>
    ) : (
      <button className="btn btn-sm btn-warning" onClick={() => handleDeactivate(s._id)}>
        Deactivate
      </button>
    )}
    <button className="btn btn-sm btn-danger" onClick={() => handlePermanentDelete(s)}>
      Delete
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "teachers" && (
        <table className="table table-bordered bg-white">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Courses Taught</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>
                  {courses
                    .filter((c) => c.teacher?._id === t._id)
                    .map((c) => c.title)
                    .join(", ") || <span className="text-muted">None</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "courses" && (
        <>
          <button className="btn btn-primary mb-3" onClick={() => setShowCreateCourseModal(true)}>
            + Create Course
          </button>
          <table className="table table-bordered bg-white">
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Teacher</th>
                <th>Enrolled</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td>{c.code}</td>
                  <td>{c.title}</td>
                  <td>{c.teacher?.name || "Unassigned"}</td>
                  <td>{c.enrolledStudents?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setReassigningCourse(c);
                        setNewTeacherId(c.teacher?._id || "");
                      }}
                    >
                      Reassign Teacher
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {activeTab === "grades" && (
        grades.length === 0 ? (
          <div className="alert alert-info">No graded submissions yet.</div>
        ) : (
          <table className="table table-bordered bg-white">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Assignment</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g._id}>
                  <td>{g.student?.name || "Unknown"}</td>
                  <td>{g.assignment?.course?.title || "N/A"}</td>
                  <td>{g.assignment?.title || "N/A"}</td>
                  <td>
                    <span className={"badge " + (g.grade >= 70 ? "bg-success" : g.grade >= 50 ? "bg-warning text-dark" : "bg-danger")}>
                      {g.grade} / {g.assignment?.totalPoints || 100}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === "quizzes" && (
        quizResults.length === 0 ? (
          <div className="alert alert-info">No quiz attempts yet.</div>
        ) : (
          <table className="table table-bordered bg-white">
            <thead>
              <tr><th>Student</th><th>Course</th><th>Quiz</th><th>Score</th></tr>
            </thead>
            <tbody>
              {quizResults.map((a) => (
                <tr key={a._id}>
                  <td>{a.student?.name}</td>
                  <td>{a.quiz?.course?.title}</td>
                  <td>{a.quiz?.title}</td>
                  <td>
                    <span className={"badge " + (a.percentage >= 70 ? "bg-success" : a.percentage >= 50 ? "bg-warning text-dark" : "bg-danger")}>
                      {a.score}/{a.totalQuestions} ({a.percentage}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {activeTab === "fees" && (
        <>
          <button className="btn btn-primary mb-3" onClick={() => setShowCreateModal(true)}>
            + Create Fee Voucher
          </button>

          {fees.length === 0 ? (
            <div className="alert alert-info">No vouchers created yet.</div>
          ) : (
            <table className="table table-bordered bg-white">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Voucher ID</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id}>
                    <td>{f.student?.name || "Unknown"}</td>
                    <td>{f.course?.title || "Unknown"}</td>
                    <td>{f.month}</td>
                    <td>Rs. {f.amount}/-</td>
                    <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                    <td>{f.voucherId}</td>
                    <td>{feeBadge(f.status)}</td>
                    <td>
                      {f.proofUrl ? (
                        <a href={f.proofUrl} target="_blank" rel="noreferrer">View</a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      {f.status === "PENDING" && (
                        <div className="d-flex gap-1">
                          <button className="btn btn-sm btn-success" onClick={() => handleApprove(f._id)}>
                            Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setRejectingFee(f)}>
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {viewingStudent && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{viewingStudent.name}'s Profile</h5>
                <button type="button" className="btn-close" onClick={() => setViewingStudent(null)}></button>
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <p className="text-muted">Loading...</p>
                ) : studentDetail ? (
                  <>
                    <p><strong>Email:</strong> {studentDetail.student.email}</p>
                    <p>
                      <strong>Active Enrollment:</strong>{" "}
                      {studentDetail.activeEnrollment ? (
                        <>
                          {studentDetail.activeEnrollment.course.title} (until{" "}
                          {new Date(studentDetail.activeEnrollment.endDate).toDateString()})
                        </>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </p>

                    <h6 className="mt-3">Submissions</h6>
                    {studentDetail.submissions.length === 0 ? (
                      <p className="text-muted small">No submissions yet.</p>
                    ) : (
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Assignment</th>
                            <th>Course</th>
                            <th>Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentDetail.submissions.map((s) => (
                            <tr key={s._id}>
                              <td>{s.assignment?.title}</td>
                              <td>{s.assignment?.course?.title}</td>
                              <td>
                                {s.grade !== null && s.grade !== undefined ? (
                                  `${s.grade} / 100`
                                ) : (
                                  <span className="text-muted">Ungraded</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                ) : (
                  <p className="text-danger">Could not load student detail.</p>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewingStudent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCreateCourseModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Course</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateCourseModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCourse}>
                <div className="modal-body">
                  {courseCreateError && <div className="alert alert-danger">{courseCreateError}</div>}
                  <div className="mb-3">
                    <label className="form-label">Course Title</label>
                    <input type="text" className="form-control" value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course Code</label>
                    <input type="text" className="form-control" placeholder="e.g. MWAD-101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="3" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Duration (months)</label>
                    <input type="number" min="1" className="form-control" value={courseDuration} onChange={(e) => setCourseDuration(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assign Teacher</label>
                    <select className="form-select" value={courseTeacherId} onChange={(e) => setCourseTeacherId(e.target.value)} required>
                      <option value="">Select a teacher...</option>
                      {teachers.map((t) => (
                        <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCourseModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creatingCourse}>
                    {creatingCourse ? "Creating..." : "Create Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {reassigningCourse && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reassign Teacher — {reassigningCourse.title}</h5>
                <button type="button" className="btn-close" onClick={() => setReassigningCourse(null)}></button>
              </div>
              <form onSubmit={handleReassignTeacher}>
                <div className="modal-body">
                  <label className="form-label">Teacher</label>
                  <select
                    className="form-select"
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    required
                  >
                    <option value="">Select a teacher...</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setReassigningCourse(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Fee Voucher</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateVoucher}>
                <div className="modal-body">
                  <div className="mb-3">
  <label className="form-label">Generate For</label>
  <div className="btn-group w-100" role="group">
    <button
      type="button"
      className={"btn btn-sm " + (voucherMode === "single" ? "btn-primary" : "btn-outline-primary")}
      onClick={() => setVoucherMode("single")}
    >
      Single Student
    </button>
    <button
      type="button"
      className={"btn btn-sm " + (voucherMode === "bulk" ? "btn-primary" : "btn-outline-primary")}
      onClick={() => setVoucherMode("bulk")}
    >
      All Students in Course
    </button>
  </div>
</div>

{voucherMode === "single" && (
  <div className="mb-3">
    <label className="form-label">Student</label>
    <select className="form-select" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
      <option value="">Select a student...</option>
      {students.map((s) => (
        <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
      ))}
    </select>
    <div className="form-text">Use this if a new student just enrolled and needs their own voucher.</div>
  </div>
)}

{voucherMode === "bulk" && (
  <div className="alert alert-info py-2 small">
    This creates a voucher for every student currently enrolled in the selected course. Students who already have a voucher for this exact month are skipped automatically.
  </div>
)}
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select className="form-select" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                      <option value="">Select a course...</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Month</label>
                    <input type="text" className="form-control" placeholder="e.g. Oct 2026" value={month} onChange={(e) => setMonth(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount (Rs.)</label>
                    <input type="number" min="0" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-control" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? "Creating..." : "Create Voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {rejectingFee && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Payment</h5>
                <button type="button" className="btn-close" onClick={() => setRejectingFee(null)}></button>
              </div>
              <form onSubmit={handleReject}>
                <div className="modal-body">
                  <label className="form-label">Reason</label>
                  <textarea className="form-control" rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Screenshot unclear"></textarea>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setRejectingFee(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">Reject</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;