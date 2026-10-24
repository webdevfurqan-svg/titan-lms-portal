import { useState, useEffect } from 'react';
import api from '../api';

const Quizzes = ({ user }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [questions, setQuestions] = useState([
    { questionText: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' },
  ]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [takingQuiz, setTakingQuiz] = useState(null);
  const [myAnswers, setMyAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const canCreate = isTeacher || isAdmin;

  useEffect(() => {
    fetchQuizzes();
    if (isTeacher) fetchMyCourses();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await api.get('/quizzes');
      if (res.data.success) setQuizzes(res.data.data);
    } catch (err) {
      console.error('Error fetching quizzes', err);
      setError('Error loading quizzes.');
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

  function addQuestion() {
    setQuestions([...questions, { questionText: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' }]);
  }

  function removeQuestion(index) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index, field, value) {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  }

  function updateOption(qIndex, optIndex, value) {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  }

  async function handleCreateQuiz(e) {
    e.preventDefault();
    setCreateError('');

    for (const q of questions) {
      if (!q.questionText || !q.correctAnswer) {
        setCreateError('Every question needs text and a correct answer selected.');
        return;
      }
    }

    setCreating(true);
    try {
      await api.post('/quizzes', { title, course: courseId, questions });
      setMessage('Quiz created successfully!');
      setShowCreateModal(false);
      setTitle('');
      setCourseId('');
      setQuestions([{ questionText: '', type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' }]);
      fetchQuizzes();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Error creating quiz.');
    } finally {
      setCreating(false);
    }
  }
  async function handleDeleteQuiz(quizId) {
  if (!confirm('Delete this quiz? Any student attempts will also be removed.')) return;
  setError('');
  setMessage('');
  try {
    await api.delete(`/quizzes/${quizId}`);
    setMessage('Quiz deleted.');
    fetchQuizzes();
  } catch (err) {
    setError(err.response?.data?.message || 'Error deleting quiz.');
  }
}



  

  function openQuiz(quiz) {
    setTakingQuiz(quiz);
    setMyAnswers({});
    setError('');
    setMessage('');
  }

  async function handleSubmitAttempt(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const answers = Object.entries(myAnswers).map(([qIndex, selectedAnswer]) => ({
        questionIndex: Number(qIndex),
        selectedAnswer,
      }));
      const res = await api.post(`/quizzes/${takingQuiz._id}/attempt`, { answers });
      setMessage(`Quiz submitted! You scored ${res.data.data.score}/${res.data.data.totalQuestions} (${res.data.data.percentage}%)`);
      setTakingQuiz(null);
      fetchQuizzes();
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading quizzes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--text-main)' }}>Quizzes & Exams</h1>
        {canCreate && (isAdmin || courses.length > 0) && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            + Create Quiz
          </button>
        )}
      </div>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      {quizzes.length === 0 ? (
        <div
          style={{
            background: 'var(--card-bg)', color: 'var(--text-muted)', padding: '32px',
            borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center', marginTop: '20px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-main)' }}>No active quizzes available</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>Check back later for upcoming assessments.</p>
        </div>
      ) : (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
  {quizzes.map((quiz) => (
    <div key={quiz._id} style={{ background: 'var(--card-bg)', color: 'var(--text-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <h3 style={{ color: 'var(--text-main)' }}>{quiz.title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{quiz.course?.title}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{quiz.questions.length} questions</p>

      {user.role === 'student' && (
        quiz.myAttempt ? (
          <span className="badge bg-success">
            Completed: {quiz.myAttempt.score}/{quiz.myAttempt.totalQuestions} ({quiz.myAttempt.percentage}%)
          </span>
        ) : (
          <button className="btn btn-sm btn-primary mt-2" onClick={() => openQuiz(quiz)}>
            Start Quiz
          </button>
        )
      )}

      {canCreate && (
        <div className="d-flex gap-1 mt-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => handleDeleteQuiz(quiz._id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  ))}
</div>
      )}

      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
  <div className="modal-dialog modal-lg" style={{ marginTop: '20px', marginBottom: '20px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Quiz</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateQuiz}>
                <div className="modal-body">
                  {createError && <div className="alert alert-danger">{createError}</div>}
                  <div className="mb-3">
                    <label className="form-label">Quiz Title</label>
                    <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course</label>
                    <select className="form-select" value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                      <option value="">Select a course...</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  </div>

                  <hr />
                  <h6>Questions</h6>
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between">
                        <label className="form-label">Question {qIndex + 1}</label>
                        {questions.length > 1 && (
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeQuestion(qIndex)}>
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Question text"
                        value={q.questionText}
                        onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                        required
                      />
                      {q.options.map((opt, optIndex) => (
                        <input
                          key={optIndex}
                          type="text"
                          className="form-control mb-1"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          required
                        />
                      ))}
                      <select
                        className="form-select mt-2"
                        value={q.correctAnswer}
                        onChange={(e) => updateQuestion(qIndex, 'correctAnswer', e.target.value)}
                        required
                      >
                        <option value="">Select correct answer...</option>
                        {q.options.filter((o) => o).map((opt, i) => (
                          <option key={i} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={addQuestion}>
                    + Add Question
                  </button>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Quiz'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {takingQuiz && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{takingQuiz.title}</h5>
                <button type="button" className="btn-close" onClick={() => setTakingQuiz(null)}></button>
              </div>
              <form onSubmit={handleSubmitAttempt}>
                <div className="modal-body">
                  {takingQuiz.questions.map((q, i) => (
                    <div key={i} className="mb-3">
                      <p className="fw-semibold">{i + 1}. {q.questionText}</p>
                      {q.options.map((opt, oi) => (
                        <div className="form-check" key={oi}>
                          <input
                            className="form-check-input"
                            type="radio"
                            name={`q-${i}`}
                            id={`q-${i}-${oi}`}
                            checked={myAnswers[i] === opt}
                            onChange={() => setMyAnswers({ ...myAnswers, [i]: opt })}
                            required
                          />
                          <label className="form-check-label" htmlFor={`q-${i}-${oi}`}>{opt}</label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setTakingQuiz(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
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

export default Quizzes;