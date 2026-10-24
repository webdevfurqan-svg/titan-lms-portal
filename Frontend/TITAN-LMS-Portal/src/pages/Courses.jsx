import { useState, useEffect } from 'react';
import api from '../api';

const Courses = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [myEnrollment, setMyEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const [enrollMessage, setEnrollMessage] = useState('');
  const [enrollError, setEnrollError] = useState('');


  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    fetchCourses();
    if (isStudent) fetchMyEnrollment();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.data);
      } else {
        setError('Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'Error loading course list');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollment = async () => {
    try {
      const res = await api.get('/courses/my');
      setMyEnrollment(res.data.data || null);
    } catch (err) {
      console.error('Error fetching enrollment:', err);
    }
  };

  async function handleEnroll(courseId) {
    setEnrollError('');
    setEnrollMessage('');
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrollMessage('Enrolled successfully!');
      await fetchMyEnrollment();
    } catch (err) {
      setEnrollError(err.response?.data?.message || 'Error enrolling in course.');
    } finally {
      setEnrollingId(null);
    }
  }

  

  if (loading) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading courses...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#e53e3e' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>Course Catalog</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0' }}>Explore available courses and modules.</p>
        </div>

      </div>

      {isStudent && myEnrollment && (
        <div
          className="alert alert-info"
          style={{ marginBottom: '16px' }}
        >
          You're currently enrolled in <strong>{myEnrollment.course?.title}</strong> until{' '}
          {new Date(myEnrollment.endDate).toDateString()}. You can't join another course until then.
        </div>
      )}
      {enrollMessage && <div className="alert alert-success">{enrollMessage}</div>}
      {enrollError && <div className="alert alert-danger">{enrollError}</div>}

      {courses.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px' }}>
          No courses available at the moment.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
            marginTop: '20px',
          }}
        >
          {courses.map((course) => {
            const isMyCourse = myEnrollment?.course?._id === course._id;
            return (
              <div
                key={course._id}
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  border: isMyCourse ? '2px solid #3182ce' : '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#3182ce',
                        background: '#ebf8ff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {course.code || 'COURSE'}
                    </span>
                    {isMyCourse && (
                      <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>Enrolled</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: '12px 0 8px 0' }}>
                    {course.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {course.description || 'No description provided.'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Duration: {course.durationMonths || 1} month{(course.durationMonths || 1) > 1 ? 's' : ''}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Instructor: {course.teacher?.name || 'Assigned Staff'}
                  </span>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button
                      onClick={() =>
                        setExpandedCourseId(expandedCourseId === course._id ? null : course._id)
                      }
                      style={{
                        padding: '6px 12px',
                        background: '#3182ce',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                      }}
                    >
                      {expandedCourseId === course._id ? 'Hide Details' : 'View Details'}
                    </button>

                    {isStudent && !isMyCourse && (
                      <button
                        onClick={() => handleEnroll(course._id)}
                        disabled={Boolean(myEnrollment) || enrollingId === course._id}
                        title={myEnrollment ? 'You already have an active enrollment' : ''}
                        style={{
                          padding: '6px 12px',
                          background: myEnrollment ? '#a0aec0' : '#38a169',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          cursor: myEnrollment ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {enrollingId === course._id ? 'Enrolling...' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>

                {expandedCourseId === course._id && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <h5 style={{ fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                      Modules
                    </h5>
                    {(!course.modules || course.modules.length === 0) ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No modules added yet for this course.
                      </p>
                    ) : (
                      course.modules.map((mod, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
                            {mod.title}
                          </strong>
                          {mod.lessons && mod.lessons.length > 0 && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                              {mod.lessons.map((lesson, j) => (
                                <li key={j} style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                  {lesson.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Courses;