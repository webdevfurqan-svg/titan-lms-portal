import { useState, useEffect } from 'react';
import api from '../api';

const Grades = ({ user }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'student') {
      fetchStudentGrades();
    } else if (user?.role === 'teacher') {
      fetchTeacherGrades();
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchStudentGrades() {
    try {
      const res = await api.get('/students/grades');
      setGrades(res.data || []);
    } catch (err) {
      console.error('Error fetching grades', err);
      setError('Error loading your grades.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeacherGrades() {
    try {
      const assignmentsRes = await api.get('/assignments');
      const myAssignments = assignmentsRes.data.data || [];

      const rows = [];
      for (const a of myAssignments) {
        try {
          const subsRes = await api.get(`/assignments/${a._id}/submissions`);
          const subs = subsRes.data.data || [];
          subs
            .filter((s) => s.grade !== null && s.grade !== undefined)
            .forEach((s) =>
              rows.push({
                ...s,
                assignment: a,
              })
            );
        } catch {
          // skip assignments whose submissions fail to load
        }
      }
      setGrades(rows);
    } catch (err) {
      console.error('Error fetching teacher grades', err);
      setError('Error loading grade report.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading grades...</div>;

  const isStudent = user?.role === 'student';

  return (
    <div>
      <h1 style={{ color: 'var(--text-main)' }}>Grade Report</h1>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {grades.length === 0 ? (
        <div className="alert alert-info mt-3">
          {isStudent ? 'No graded assignments yet.' : 'No graded submissions yet.'}
        </div>
      ) : (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {grades.map((item) => {
            const assignment = isStudent ? item.assignment : item.assignment;
            return (
              <div
                key={item._id}
                style={{
                  background: 'var(--card-bg)',
                  color: 'var(--text-main)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ color: 'var(--text-main)', margin: 0 }}>
                    {assignment?.title || 'Assignment'}
                  </h3>
                  {!isStudent && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                      Student: {item.student?.name || 'Unknown'}
                    </p>
                  )}
                  {item.feedback && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
                      Feedback: {item.feedback}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--navy-primary)' }}>
                  {item.grade} / 100
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Grades;