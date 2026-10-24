import { useState, useEffect } from "react";
import api from "../api";

const Assignments = ({ user }) => {
  const [assignments, setAssignments] = useState([]);
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [submittingId, setSubmittingId] = useState(null);
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState("");
  const [uploading, setUploading] = useState(false);

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      if (isStudent) {
        const enrollRes = await api.get("/courses/my");
        const enrollment = enrollRes.data.data;
        setMyEnrollment(enrollment);

        if (!enrollment) {
          setAssignments([]);
          setLoading(false);
          return;
        }

        const res = await api.get("/assignments");
        if (res.data.success) {
          const mine = (res.data.data || []).filter(
            (a) => a.course?._id === enrollment.course._id
          );
          setAssignments(mine);
        }
      } else {
        const res = await api.get("/assignments");
        if (res.data.success) {
          setAssignments(res.data.data);
        }
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError("Error loading assignments.");
    } finally {
      setLoading(false);
    }
  }

  function openSubmitForm(assignmentId) {
    setSubmittingId(assignmentId);
    setFile(null);
    setComments("");
    setError("");
    setMessage("");
  }

  async function handleSubmit(e, assignmentId) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("submissionFile", file);
    if (comments) formData.append("comments", comments);

    setUploading(true);
    try {
      await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Assignment submitted successfully!");
      setSubmittingId(null);
      setFile(null);
      setComments("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Error submitting assignment.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)" }}>Loading assignments...</div>;
  }

  const totalAssigned = assignments.length;
  const totalSubmitted = assignments.filter((a) => a.mySubmission).length;
  const totalPending = totalAssigned - totalSubmitted;

  return (
    <div>
      <h1 style={{ color: "var(--text-main)" }}>Assignments</h1>

      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {message && <div className="alert alert-success mt-3">{message}</div>}

      {isStudent && !myEnrollment && (
        <div className="alert alert-warning mt-3">
          You're not enrolled in any course yet. Enroll in a course to see its assignments.
        </div>
      )}

      {isStudent && myEnrollment && (
        <>
          <div className="row g-3 my-2">
            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Assigned</h6>
                  <h3 className="mb-0">{totalAssigned}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Submitted</h6>
                  <h3 className="mb-0">{totalSubmitted}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Pending</h6>
                  <h3 className="mb-0">{totalPending}</h3>
                </div>
              </div>
            </div>
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Showing assignments for <strong style={{ color: "var(--text-main)" }}>{myEnrollment.course.title}</strong>
          </p>
        </>
      )}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {(!isStudent || myEnrollment) && assignments.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No assignments available.</p>
        ) : (
          assignments.map((item) => (
            <div
              key={item._id}
              style={{
                background: "var(--card-bg)",
                color: "var(--text-main)",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ color: "var(--text-main)", margin: 0 }}>{item.title}</h3>
                {isStudent && (
                  <span className={"badge " + (item.mySubmission ? "bg-success" : "bg-secondary")}>
                    {item.mySubmission ? "Submitted" : "Not Submitted"}
                  </span>
                )}
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {item.description}
              </p>

              <p style={{ color: "var(--text-main)" }}>
                <strong>Course:</strong>{" "}
                {item.course?.title || "Unknown course"}
              </p>

              <p style={{ color: "var(--text-main)" }}>
                <strong>Due Date:</strong>{" "}
                {item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString()
                  : "No due date"}
              </p>

              <p style={{ color: "var(--text-main)" }}>
                <strong>Total Points:</strong> {item.totalPoints}
              </p>

              {item.fileUrl && (
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                  View Attachment
                </a>
              )}

              {isStudent && (
                <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                  {item.mySubmission ? (
                    <div style={{ fontSize: "0.88rem" }}>
                      <a href={item.mySubmission.fileUrl} target="_blank" rel="noopener noreferrer">
  {item.mySubmission.fileName || "View Your Submission"}
</a>
{item.mySubmission.fileSize > 0 && (
  <span className="text-muted ms-1" style={{ fontSize: "0.78rem" }}>
    ({(item.mySubmission.fileSize / 1024).toFixed(0)} KB)
  </span>
)}
                      {item.mySubmission.grade !== null && item.mySubmission.grade !== undefined ? (
                        <span className="badge bg-success ms-2">
                          Grade: {item.mySubmission.grade} / 100
                        </span>
                      ) : (
                        <span className="badge bg-secondary ms-2">Not graded yet</span>
                      )}
                      {item.mySubmission.feedback && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
                          Feedback: {item.mySubmission.feedback}
                        </p>
                      )}
                    </div>
                  ) : submittingId === item._id ? (
                    <form onSubmit={(e) => handleSubmit(e, item._id)}>
                      <div className="mb-2">
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          onChange={(e) => setFile(e.target.files[0])}
                          required
                        />
                      </div>
                      <div className="mb-2">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Optional comment..."
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-sm btn-success" disabled={uploading}>
                          {uploading ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSubmittingId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openSubmitForm(item._id)}
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Assignments;