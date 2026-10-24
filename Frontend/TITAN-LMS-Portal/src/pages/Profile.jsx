import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const initials = (user.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const roleColors = {
    admin: '#dc3545',
    teacher: '#0d6efd',
    student: '#198754',
  };
  const roleColor = roleColors[user.role] || '#6c757d';

  return (
    <div>
      <h1 className="mb-4">My Profile</h1>

      <div className="card shadow-sm" style={{ maxWidth: '520px' }}>
        <div className="card-body text-center p-4">
          <div
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: roleColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '0 auto 16px',
            }}
          >
            {initials}
          </div>

          <h3 className="mb-1">{user.name}</h3>
          <span
            className="badge mb-3"
            style={{ background: roleColor, textTransform: 'uppercase', fontSize: '0.75rem' }}
          >
            {user.role}
          </span>

          <hr />
<div className="text-start mt-3">
  <div className="mb-2">
    <span className="text-muted small">Email</span>
    <div style={{ color: "var(--text-main)" }}>{user.email}</div>
  </div>
  <div className="mb-2">
    <span className="text-muted small">User ID</span>
    <div className="text-break small" style={{ color: "var(--text-main)" }}>{user.id}</div>
  </div>
</div>
        </div>
      </div>
    </div>
  );
}

export default Profile;