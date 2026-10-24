import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useTheme } from "../context/ThemeContext";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await api.post("/auth/register", { name, email, password, role });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    }
  }

  return (
    <div
      className="position-relative"
      style={{ minHeight: "100vh", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/titan-logo.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center 42%",
          backgroundSize: "420px",
          opacity: theme === "dark" ? 0.12 : 0.07,
          mixBlendMode: theme === "dark" ? "screen" : "multiply",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        className="container"
        style={{ maxWidth: 450, marginTop: 50, position: "relative", zIndex: 1, paddingBottom: "50px" }}
      >
        <div className="text-center mb-3">
          <img
            src="/titan-logo.png"
            alt="TAJ TITAN logo"
            style={{ width: "90px", height: "90px", objectFit: "contain" }}
          />
          <h4 className="mt-2 mb-0">TAJ Institute of Technology</h4>
          <p className="text-muted small mb-0">& Applied Networks</p>
        </div>

        <h2 className="text-center">Register</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="">-- Select Role --</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-100">Register</button>
        </form>

        <p className="mt-3">Already have an account? <Link to="/login">Login here</Link></p>
      </div>
    </div>
  );
}

export default Register;