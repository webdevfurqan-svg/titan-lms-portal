import { useState, useEffect } from 'react';
import api from '../api';

const Timetable = ({ user }) => {
  const [schedule, setSchedule] = useState([]);
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [room, setRoom] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const canCreate = isTeacher || isAdmin;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const fullSchedule = await fetchTimetable();

      if (isStudent) {
        const enrollRes = await api.get('/courses/my');
        const enrollment = enrollRes.data.data;
        setMyEnrollment(enrollment);

        if (enrollment) {
          setSchedule(
            fullSchedule.filter((item) => item.course?._id === enrollment.course._id)
          );
        } else {
          setSchedule([]);
        }
      } else if (isTeacher) {
        setSchedule(fullSchedule.filter((item) => item.teacher?._id === user.id));
        await fetchMyCourses();
      } else {
        // admin sees everything
        setSchedule(fullSchedule);
        await fetchCourses();
        await fetchTeachers();
      }
    } catch (err) {
      console.error('Error loading timetable:', err);
      setError('Error loading timetable.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimetable() {
    const res = await api.get('/timetable');
    return res.data.success ? res.data.data : [];
  }

  async function fetchCourses() {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data || []);
    } catch (err) {
      console.error('Error fetching courses', err);
    }
  }

  async function fetchMyCourses() {
    try {
      const res = await api.get('/courses');
      const mine = (res.data.data || []).filter((c) => c.teacher?._id === user.id);
      setCourses(mine);
    } catch (err) {
      console.error('Error fetching courses', err);
    }
  }

  async function fetchTeachers() {
    try {
      const res = await api.get('/admin/users?role=teacher');
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching teachers', err);
    }
  }

  async function handleCreateSlot(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    const effectiveTeacherId = isTeacher ? user.id : teacherId;

    if (!courseId || !effectiveTeacherId || !day || !startTime || !endTime || !room) {
      setError('All fields except meeting link are required.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/timetable', {
        course: courseId,
        teacher: effectiveTeacherId,
        day,
        startTime,
        endTime,
        room,
        meetingLink,
      });
      setMessage('Class slot added successfully!');
      setShowCreateModal(false);
      setCourseId('');
      setTeacherId('');
      setDay('Monday');
      setStartTime('');
      setEndTime('');
      setRoom('');
      setMeetingLink('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding class slot.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading timetable...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-main)' }}>Class Timetable</h1>
        {canCreate && (isAdmin || courses.length > 0) && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowCreateModal(true);
              setError('');
              setMessage('');
            }}
          >
            + Add Class Slot
          </button>
        )}
      </div>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {isStudent && !myEnrollment && (
        <div className="alert alert-warning mt-3">
          You're not enrolled in any course yet. Enroll in a course to see its timetable.
        </div>
      )}

      {isTeacher && courses.length === 0 && (
        <div className="alert alert-warning mt-3">
          You have no assigned courses yet. Contact the admin to be assigned a course before scheduling classes.
        </div>
      )}

      {(!isStudent || myEnrollment) && schedule.length === 0 ? (
        <div className="alert alert-info mt-3">No classes scheduled yet.</div>
      ) : schedule.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', background: 'var(--card-bg)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-light)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Day</th>
              <th style={{ padding: '12px' }}>Time</th>
              <th style={{ padding: '12px' }}>Course</th>
              <th style={{ padding: '12px' }}>Teacher</th>
              <th style={{ padding: '12px' }}>Room</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item) => (
              <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px' }}>{item.day}</td>
                <td style={{ padding: '12px' }}>{item.startTime} - {item.endTime}</td>
                <td style={{ padding: '12px' }}>{item.course?.title || 'N/A'}</td>
                <td style={{ padding: '12px' }}>{item.teacher?.name || 'N/A'}</td>
                <td style={{ padding: '12px' }}>{item.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Class Slot</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateSlot}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select
                      className="form-select"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
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
                      <div className="form-text">Only courses assigned to you are shown.</div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="mb-3">
                      <label className="form-label">Teacher</label>
                      <select
                        className="form-select"
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        required
                      >
                        <option value="">Select a teacher...</option>
                        {teachers.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} ({t.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Day</label>
                    <select
                      className="form-select"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      required
                    >
                      {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col mb-3">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col mb-3">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Room</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lab 3 or Online"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Meeting Link (optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Zoom/Meet link"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
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
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Adding...' : 'Add Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;