import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

function dashboardPathFor(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  if (role === 'student') return '/student/dashboard';
  return '/login';
}

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main
        className="app-main-content"
        style={{ flex: 1, padding: '24px', minHeight: '100vh' }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedRoute;