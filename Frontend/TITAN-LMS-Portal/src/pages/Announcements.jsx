import { useState, useEffect } from 'react';
import api from '../api';

const Announcements = ({ user }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [courseId, setCourseId] = useState('');
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const canPost = isTeacher || isAdmin;

  useEffect(() => {
    fetchAnnouncements();
    if (isTeacher) fetchMyCourses();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching announcements', err);
      setError(err.response?.data?.message || 'Error loading announcements.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const res = await api.get('/courses');
      const mine = (res.data.data || []).filter((c) => c.teacher?._id === user.id);
      setCourses(mine);
    } catch (err) {
      console.error('Error fetching courses', err);
    }
  };

  async function handleCreateAnnouncement(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }

    if (isTeacher && !courseId) {
      setError('Please select which of your courses this announcement is for.');
      return;
    }

    setCreating(true);
    try {
      const body = { title, content, targetRole };
      if (isTeacher) {
        body.course = courseId;
        body.targetRole = 'STUDENT'; // a teacher's announcement always targets their course's students
      }
      await api.post('/announcements', body);
      setMessage('Announcement posted successfully!');
      setShowCreateModal(false);
      setTitle('');
      setContent('');
      setTargetRole('ALL');
      setCourseId('');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.message || 'Error posting announcement.');
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading announcements...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-main)' }}>Announcements</h1>
        {canPost && (isAdmin || courses.length > 0) && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setShowCreateModal(true);
              setError('');
              setMessage('');
            }}
          >
            + New Announcement
          </button>
        )}
      </div>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {isTeacher && courses.length === 0 && (
        <div className="alert alert-warning mt-3">
          You have no assigned courses yet, so you can't post announcements until the admin assigns you one.
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="alert alert-info mt-3">No announcements yet.</div>
      ) : (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.map((item) => (
            <div key={item._id} style={{ background: 'var(--card-bg)', color: 'var(--text-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{item.title}</h3>
                {item.targetRole !== 'ALL' && (
                  <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                    {item.targetRole} ONLY
                  </span>
                )}
              </div>
              <p style={{ marginTop: '8px', color: 'var(--text-main)' }}>{item.content}</p>
              {item.course?.title && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Course: {item.course.title}
                </p>
              )}
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>By: {item.author?.name || 'Admin'} ({item.author?.role || 'staff'})</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">New Announcement</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateAnnouncement}>
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
                    <label className="form-label">Content</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {isTeacher && (
                    <div className="mb-3">
                      <label className="form-label">Course</label>
                      <select
                        className="form-select"
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        required
                      >
                        <option value="">Select your course...</option>
                        {courses.map((c) => (
                          <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
                        ))}
                      </select>
                      <div className="form-text">This will be visible to students enrolled in this course.</div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mb-3">
                      <label className="form-label">Visible To</label>
                      <select
                        className="form-select"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      >
                        <option value="ALL">Everyone</option>
                        <option value="STUDENT">All Students</option>
                        <option value="TEACHER">All Teachers</option>
                      </select>
                    </div>
                  )}
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
                    {creating ? 'Posting...' : 'Post Announcement'}
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

export default Announcements;