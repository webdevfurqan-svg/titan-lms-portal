import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(formData);

      if (!data?.success) {
        setError(data?.message || "Invalid email or password.");
        return;
      }

      const loggedInUser = data.user;

      if (!loggedInUser) {
        setError("Login succeeded, but user information was not returned.");
        return;
      }

      if (loggedInUser.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (loggedInUser.role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else if (loggedInUser.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        setError("Your account has an unsupported role.");
      }
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid py-5"
      style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
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
        className="card shadow-sm mx-auto"
        style={{ maxWidth: "450px", position: "relative", zIndex: 1 }}
      >
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <img
              src="/titan-logo.png"
              alt="TAJ TITAN logo"
              style={{ width: "90px", height: "90px", objectFit: "contain" }}
            />
            <h4 className="mt-2 mb-0">TAJ Institute of Technology</h4>
            <p className="text-muted small mb-0">& Applied Networks</p>
          </div>

          <h2 className="text-center mb-4">Login</h2>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                Email
              </label>

              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Password
              </label>

              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;