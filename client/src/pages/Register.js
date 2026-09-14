import React, { useState, useContext } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GiThink } from "react-icons/gi";

const TOPIC_OPTIONS = [
  "DSA",
  "System Design",
  "Behavioral",
  "Frontend",
  "Backend",
  "Other",
];

export const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    bio: "",
  });
  const [roles, setRoles] = useState(["interviewee"]);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleRole = (role) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const toggleTopic = (topic) => {
    setTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (roles.length === 0) {
      setError("Choose at least one role: interviewer or interviewee");
      return;
    }

    if (!acceptedTerms) {
      setError("You must accept the Terms & Conditions to register");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...rest } = formData;
      await register({ ...rest, roles, topics, acceptedTerms });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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
          maxWidth: "500px",
          width: "100%",
          boxShadow: "var(--shadow-lg), 0 0 60px rgba(168, 85, 247, 0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <GiThink
            size={40}
            style={{
              color: "var(--secondary-color)",
              marginBottom: "15px",
              filter: "drop-shadow(0 0 16px rgba(168, 85, 247, 0.5))",
            }}
          />
          <h1 style={{ marginBottom: "10px" }}>Create Account</h1>
          <p style={{ color: "var(--light-text)" }}>
            Join the mock interview community
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Jane Doe"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label>I want to be a...</label>
            <div className="checkbox-row">
              <label className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={roles.includes("interviewee")}
                  onChange={() => toggleRole("interviewee")}
                />
                Interviewee (practice being interviewed)
              </label>
              <label className="checkbox-pill">
                <input
                  type="checkbox"
                  checked={roles.includes("interviewer")}
                  onChange={() => toggleRole("interviewer")}
                />
                Interviewer (practice interviewing others)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Topics you're comfortable with (optional)</label>
            <div className="checkbox-row">
              {TOPIC_OPTIONS.map((topic) => (
                <label key={topic} className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={topics.includes(topic)}
                    onChange={() => toggleTopic(topic)}
                  />
                  {topic}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Short bio (optional)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="A sentence or two about your background"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-pill">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              I accept the Terms & Conditions
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--primary-color)", fontWeight: "bold" }}
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
