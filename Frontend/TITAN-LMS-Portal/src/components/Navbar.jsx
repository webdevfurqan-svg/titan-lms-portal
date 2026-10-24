import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  return (
    <nav className="navbar navbar-expand navbar-dark bg-dark px-4">

      <Link to="/" className="navbar-brand d-flex align-items-center gap-2 m-0">
        <img
          src="/titan-logo.png"
          alt="TiTan Logo"
          style={{ width: "30px", height: "30px", objectFit: "contain" }}
        />
        <span className="fw-bold fs-5">TITAN LMS</span>
      </Link>

      <div className="ms-auto">
        {user?.role === "teacher" && (
          <Link
            to="/teacher/dashboard"
            className="btn btn-outline-light btn-sm me-2"
          >
            Dashboard
          </Link>
        )}

        {user?.role === "student" && (
          <>
            <Link
              to="/student/dashboard"
              className="btn btn-outline-light btn-sm me-2"
            >
              Dashboard
            </Link>

            <Link
              to="/student/grades"
              className="btn btn-outline-light btn-sm me-2"
            >
              My Grades
            </Link>
          </>
        )}

        {user && (
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;