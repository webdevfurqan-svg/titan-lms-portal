import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

useEffect(() => {
  function handleResize() {
    setIsCollapsed(window.innerWidth < 768);
  }
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role;

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      style={{ 
        width: isCollapsed ? '72px' : '230px', 
        background: '#161722', 
        color: '#e2e8f0', 
        minHeight: '100vh', 
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        whiteSpace: 'nowrap',
        borderRight: '1px solid #232533'
      }}
    >
      <div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-end', marginBottom: '16px', padding: '0 4px' }}>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8a8d9b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? <path d="m9 18 6-6-6-6"/> : <path d="m15 18-6-6 6-6"/>}
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <div style={{ fontSize: '0.75rem', color: '#6c7293', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '16px', paddingLeft: '8px' }}>
            Role: <span style={{ color: '#ffffff' }}>{role}</span>
          </div>
        )}

        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {role === 'teacher' && (
            <>
              <SidebarLink to="/teacher/dashboard" label="Dashboard" active={isActive('/teacher/dashboard')} isCollapsed={isCollapsed} icon={<DashboardIcon />} />
              <SidebarLink to="/profile" label="Profile" active={isActive('/profile')} isCollapsed={isCollapsed} icon={<ProfileIcon />} />
              <SidebarLink to="/courses" label="Courses" active={isActive('/courses')} isCollapsed={isCollapsed} icon={<CoursesIcon />} />
              <SidebarLink to="/assignments" label="Assignments" active={isActive('/assignments')} isCollapsed={isCollapsed} icon={<AssignmentsIcon />} />
              <SidebarLink to="/quizzes" label="Quizzes & Exams" active={isActive('/quizzes')} isCollapsed={isCollapsed} icon={<QuizzesIcon />} />
              <SidebarLink to="/attendance" label="Attendance" active={isActive('/attendance')} isCollapsed={isCollapsed} icon={<AttendanceIcon />} />
              <SidebarLink to="/grades" label="Grades" active={isActive('/grades')} isCollapsed={isCollapsed} icon={<GradesIcon />} />
              <SidebarLink to="/timetable" label="Timetable" active={isActive('/timetable')} isCollapsed={isCollapsed} icon={<TimetableIcon />} />
              <SidebarLink to="/announcements" label="Announcements" active={isActive('/announcements')} isCollapsed={isCollapsed} icon={<AnnouncementsIcon />} />
              {/* <SidebarLink to="/messages" label="Messages" active={isActive('/messages')} isCollapsed={isCollapsed} icon={<MessagesIcon />} /> */}
              {/* <SidebarLink to="/certificates" label="Certificates" active={isActive('/certificates')} isCollapsed={isCollapsed} icon={<CertificatesIcon />} /> */}
            </>
          )}

          {role === 'student' && (
            <>
              <SidebarLink to="/student/dashboard" label="Dashboard" active={isActive('/student/dashboard')} isCollapsed={isCollapsed} icon={<DashboardIcon />} />
              <SidebarLink to="/profile" label="Profile" active={isActive('/profile')} isCollapsed={isCollapsed} icon={<ProfileIcon />} />
              <SidebarLink to="/student/courses" label="Courses" active={isActive('/student/courses')} isCollapsed={isCollapsed} icon={<CoursesIcon />} />
              <SidebarLink to="/student/assignments" label="Assignments" active={isActive('/student/assignments')} isCollapsed={isCollapsed} icon={<AssignmentsIcon />} />
              <SidebarLink to="/student/quizzes" label="Quizzes & Exams" active={isActive('/student/quizzes')} isCollapsed={isCollapsed} icon={<QuizzesIcon />} />
              <SidebarLink to="/student/attendance" label="Attendance" active={isActive('/student/attendance')} isCollapsed={isCollapsed} icon={<AttendanceIcon />} />
              <SidebarLink to="/student/payment" label="Payment" active={isActive('/student/payment')} isCollapsed={isCollapsed} icon={<PaymentIcon />} />
              <SidebarLink to="/student/grades" label="Grades" active={isActive('/student/grades')} isCollapsed={isCollapsed} icon={<GradesIcon />} />
              <SidebarLink to="/student/timetable" label="Timetable" active={isActive('/student/timetable')} isCollapsed={isCollapsed} icon={<TimetableIcon />} />
              <SidebarLink to="/student/announcements" label="Announcements" active={isActive('/student/announcements')} isCollapsed={isCollapsed} icon={<AnnouncementsIcon />} />
              {/* <SidebarLink to="/student/messages" label="Messages" active={isActive('/student/messages')} isCollapsed={isCollapsed} icon={<MessagesIcon />} /> */}
              {/* <SidebarLink to="/student/certificates" label="Certificates" active={isActive('/student/certificates')} isCollapsed={isCollapsed} icon={<CertificatesIcon />} /> */}
            </>
          )}
{role === 'admin' && (
  <>
    <SidebarLink to="/admin/dashboard" label="Dashboard" active={isActive('/admin/dashboard')} isCollapsed={isCollapsed} icon={<DashboardIcon />} />
    <SidebarLink to="/profile" label="Profile" active={isActive('/profile')} isCollapsed={isCollapsed} icon={<ProfileIcon />} />
    <SidebarLink to="/attendance" label="Attendance" active={isActive('/attendance')} isCollapsed={isCollapsed} icon={<AttendanceIcon />} />
    <SidebarLink to="/announcements" label="Announcements" active={isActive('/announcements')} isCollapsed={isCollapsed} icon={<AnnouncementsIcon />} />
    <SidebarLink to="/timetable" label="Timetable" active={isActive('/timetable')} isCollapsed={isCollapsed} icon={<TimetableIcon />} />
    <SidebarLink to="/quizzes" label="Quizzes & Exams" active={isActive('/quizzes')} isCollapsed={isCollapsed} icon={<QuizzesIcon />} />
  </>
)}
        </nav>
      </div>

      {/* Bottom User Info & Logout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px solid #232533' }}>
        <button
          onClick={toggleTheme}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '10px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
            transition: 'background 0.15s ease'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        {!isCollapsed && user?.name && (
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', paddingLeft: '8px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </div>
        )}
        <button 
          onClick={handleLogout} 
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            padding: '10px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
            transition: 'background 0.15s ease'
          }}
          title="Logout"
        >
          <LogoutIcon />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

// Reusable Professional Sidebar Link
const SidebarLink = ({ to, label, active, isCollapsed, icon }) => (
  <Link 
    to={to} 
    title={isCollapsed ? label : ''}
    style={{
      color: active ? '#ffffff' : '#94a3b8',
      background: active ? '#252736' : 'transparent',
      textDecoration: 'none',
      fontSize: '0.88rem',
      fontWeight: active ? '600' : '500',
      padding: '10px 12px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      transition: 'all 0.15s ease'
    }}
  >
    <span style={{ color: active ? '#60a5fa' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
      {icon}
    </span>
    {!isCollapsed && <span>{label}</span>}
  </Link>
);


const DashboardIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
const ProfileIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const CoursesIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const AssignmentsIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>);
const QuizzesIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const AttendanceIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const PaymentIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const GradesIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const TimetableIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const AnnouncementsIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>);
const LogoutIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const MoonIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>);
const SunIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>);

export default Sidebar;