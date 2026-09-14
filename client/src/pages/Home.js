import React, { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { GiThink } from "react-icons/gi";
import { FaVideo, FaCalendarCheck, FaClipboardList } from "react-icons/fa";

export const Home = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
      <GiThink
        size={56}
        style={{
          color: "var(--primary-color)",
          filter: "drop-shadow(0 0 20px rgba(0, 240, 255, 0.5))",
          marginBottom: "20px",
        }}
      />
      <h1 style={{ fontSize: "2.4rem", marginBottom: "16px" }}>
        Practice Interviews with Real Peers
      </h1>
      <p style={{ color: "var(--light-text)", fontSize: "1.1rem", marginBottom: "36px" }}>
        Schedule a mock interview slot, hop on a video call, and get
        structured feedback — no fluff, just practice.
      </p>

      <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginBottom: "50px" }}>
        <Link to="/register" className="btn btn-primary">
          Get Started
        </Link>
        <Link to="/login" className="btn btn-outline">
          Login
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          textAlign: "left",
        }}
      >
        <div className="card">
          <FaCalendarCheck size={26} style={{ color: "var(--primary-color)", marginBottom: "12px" }} />
          <h3 style={{ marginBottom: "8px" }}>Schedule a slot</h3>
          <p style={{ color: "var(--light-text)" }}>
            Interviewers open time slots by topic. Interviewees browse and
            book the one that fits.
          </p>
        </div>
        <div className="card">
          <FaVideo size={26} style={{ color: "var(--secondary-color)", marginBottom: "12px" }} />
          <h3 style={{ marginBottom: "8px" }}>Video call built in</h3>
          <p style={{ color: "var(--light-text)" }}>
            Every booking gets its own video room, powered by Jitsi Meet —
            no setup needed.
          </p>
        </div>
        <div className="card">
          <FaClipboardList size={26} style={{ color: "var(--accent-color)", marginBottom: "12px" }} />
          <h3 style={{ marginBottom: "8px" }}>Structured feedback</h3>
          <p style={{ color: "var(--light-text)" }}>
            Rate communication, problem-solving and technical depth after
            every session.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
