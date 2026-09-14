import React, { useState, useContext } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GiThink } from "react-icons/gi";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegisterHint, setShowRegisterHint] = useState(false);

  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowRegisterHint(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      // 404 means no account exists for this email — offer to register.
      setShowRegisterHint(err.response?.status === 404);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "400px",
          width: "100%",
          boxShadow: "var(--shadow-lg), 0 0 60px rgba(0, 240, 255, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <GiThink
            size={40}
            style={{
              color: "var(--primary-color)",
              marginBottom: "15px",
              filter: "drop-shadow(0 0 16px rgba(0, 240, 255, 0.5))",
            }}
          />
          <h1 style={{ marginBottom: "10px" }}>Welcome Back!</h1>
          <p style={{ color: "var(--light-text)" }}>
            Login to book your mock interviews
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            {showRegisterHint && (
              <>
                {" "}
                <Link
                  to="/register"
                  style={{ color: "var(--primary-color)", fontWeight: 600 }}
                >
                  Register here
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "var(--primary-color)", fontWeight: "bold" }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
