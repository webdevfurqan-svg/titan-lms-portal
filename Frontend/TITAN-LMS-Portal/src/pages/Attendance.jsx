import { useState, useEffect } from 'react';
import api from '../api';

const Attendance = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState('');
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [usingAllStudentsFallback, setUsingAllStudentsFallback] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const canMark = isTeacher || isAdmin;
  const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

  useEffect(() => {
    if (canMark) {
      loadMarkingData();
      loadSessions();
    } else if (isStudent) {
      fetchMyAttendance();
    }
  }, []);

  async function loadMarkingData() {
    try {
      const res = await api.get('/courses');
      const all = res.data.data || [];
      const list = isTeacher ? all.filter((c) => c.teacher?._id === user.id) : all;
      setCourses(list);
    } catch (err) {
      console.error('Error fetching courses', err);
      setError('Error loading courses.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSessions(courseFilter = '') {
    try {
      const url = courseFilter ? `/attendance?course=${courseFilter}` : '/attendance';
      const res = await api.get(url);
      setSessions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching attendance sessions', err);
    }
  }

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get(`/attendance/student/${user.id}`);
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching attendance', err);
      setError(err.response?.data?.message || 'Error loading attendance.');
    } finally {
      setLoading(false);
    }
  };

  async function handleCourseChange(courseId) {
    setSelectedCourse(courseId);
    setStatusMap({});
    setError('');
    setMessage('');

    if (!courseId) {
      setStudents([]);
      return;
    }

    const course = courses.find((c) => c._id === courseId);
    if (!course) return;

    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      try {
        const res = await api.get('/attendance/students');
        const all = res.data.data || [];
        const enrolledIds = course.enrolledStudents.map((s) => (s._id ? s._id : s));
        setStudents(all.filter((s) => enrolledIds.includes(s._id)));
        setUsingAllStudentsFallback(false);
      } catch (err) {
        console.error('Error resolving enrolled students', err);
      }
    } else {
      try {
        const res = await api.get('/attendance/students');
        setStudents(res.data.data || []);
        setUsingAllStudentsFallback(true);
      } catch (err) {
        console.error('Error fetching students', err);
        setError('Error loading students for this course.');
      }
    }
  }

  function setStudentStatus(studentId, status) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
  }

  async function handleSubmitAttendance(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!selectedCourse || !date) {
      setError('Please select a course and date.');
      return;
    }
    if (students.length === 0) {
      setError('No students to mark.');
      return;
    }

    const records = students.map((s) => ({
      student: s._id,
      status: statusMap[s._id] || 'PRESENT',
    }));

    setSaving(true);
    try {
      await api.post('/attendance', {
        course: selectedCourse,
        date,
        records,
      });
      setMessage('Attendance recorded successfully!');
      setSelectedCourse('');
      setDate('');
      setStudents([]);
      setStatusMap({});
      loadSessions(filterCourse);
    } catch (err) {
      setError(err.response?.data?.message || 'Error recording attendance.');
    } finally {
      setSaving(false);
    }
  }

  function handleFilterChange(courseId) {
    setFilterCourse(courseId);
    loadSessions(courseId);
  }

  if (canMark) {
    return (
      <div>
        <h1 style={{ color: 'var(--text-main)' }}>Attendance</h1>

        {message && <div className="alert alert-success mt-3 ">{message}</div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {isTeacher && courses.length === 0 && (
          <div className="alert alert-warning mt-3">
            You have no assigned courses yet. Contact the admin to be assigned a course.
          </div>
        )}

        {(isAdmin || courses.length > 0) && (
          <>
            <h5 className="mt-4 mb-3">Record Attendance</h5>
            <form onSubmit={handleSubmitAttendance}>
              <div className="row">
                <div className="col-md-6 mb-3 ">
                  <label className="form-label">Course</label>
                  <select
                    className="form-select"
                    value={selectedCourse}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                  >
                    <option value="">Select a course...</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                  {isTeacher && (
                    <div className="form-text  text-muted ">Only courses assigned to you are shown.</div>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {usingAllStudentsFallback && students.length > 0 && (
                <div className="alert alert-warning py-2 small">
                  No students are formally enrolled in this course yet, so all registered students are shown below.
                </div>
              )}

              {students.length > 0 && (
                <table className="table table-bordered bg-white mt-2">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s._id}>
                        <td>{s.name} <span className="text-muted small">({s.email})</span></td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={statusMap[s._id] || 'PRESENT'}
                            onChange={(e) => setStudentStatus(s._id, e.target.value)}
                          >
                            {statuses.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {students.length > 0 && (
                <button type="submit" className="btn btn-primary mt-2" disabled={saving}>
                  {saving ? 'Saving...' : 'Submit Attendance'}
                </button>
              )}
            </form>
          </>
        )}

        <h5 className="mt-5 mb-3">
          {isAdmin ? 'All Attendance Records' : 'My Course Attendance Records'}
        </h5>

        {isAdmin && (
          <div className="mb-3" style={{ maxWidth: '320px' }}>
            <select
              className="form-select"
              value={filterCourse}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
              ))}
            </select>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="alert alert-info">No attendance sessions recorded yet.</div>
        ) : (
          sessions.map((session) => (
            <div key={session._id} className="card mb-3">
              <div className="card-header bg-white fw-semibold">
                {session.course?.title} — {new Date(session.date).toLocaleDateString()}
              </div>
              <div className="card-body p-0">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.student?.name || 'Unknown'}</td>
                        <td>
                          <span
                            className={
                              'badge ' +
                              (r.status === 'PRESENT' ? 'bg-success' : r.status === 'ABSENT' ? 'bg-danger' : 'bg-warning text-dark')
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading attendance records...</div>;

  return (
    <div>
      <h1 style={{ color: 'var(--text-main)' }}>Attendance Records</h1>
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {history.length === 0 ? (
        <div className="alert alert-info mt-3">No attendance records yet.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'var(--card-bg)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Course</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((session) => {
              const myRecord = session.records.find(
                (r) => (r.student?._id || r.student) === user.id
              );
              return (
                <tr key={session._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px' }}>{new Date(session.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>{session.course?.title || 'N/A'}</td>
                  <td
                    style={{
                      padding: '12px',
                      color: myRecord?.status === 'PRESENT' ? 'green' : 'red',
                      fontWeight: 'bold',
                    }}
                  >
                    {myRecord?.status || 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Attendance;