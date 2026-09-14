import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { bookingsAPI } from "../services/api";
import { FaVideo, FaCalendarAlt } from "react-icons/fa";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    bookingsAPI
      .getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "6px" }}>Welcome, {user?.name}</h1>
      <p style={{ color: "var(--light-text)", marginBottom: "30px" }}>
        Here's what's coming up.
      </p>

      <div style={{ display: "flex", gap: "14px", marginBottom: "30px" }}>
        <Link to="/find-slots" className="btn btn-primary">
          Find a Slot to Book
        </Link>
        {user?.roles?.includes("interviewer") && (
          <Link to="/manage-slots" className="btn btn-outline">
            Manage My Slots
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading...</p>}

      <h2 style={{ marginBottom: "14px" }}>Upcoming Sessions</h2>
      {!loading && upcoming.length === 0 && (
        <p style={{ color: "var(--light-text)" }}>No upcoming sessions yet.</p>
      )}
      <div style={{ display: "grid", gap: "14px", marginBottom: "36px" }}>
        {upcoming.map((booking) => {
          const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
          const other = isInterviewer ? booking.interviewee : booking.interviewer;
          return (
            <div key={booking._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{booking.topic}</div>
                  <div style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>
                    <FaCalendarAlt style={{ marginRight: "6px" }} />
                    {formatDate(booking.date)} · {booking.startTime}-{booking.endTime}
                  </div>
                  <div style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>
                    With {other?.name} ({isInterviewer ? "interviewee" : "interviewer"})
                  </div>
                </div>
                <Link to={`/session/${booking._id}`} className="btn btn-primary">
                  <FaVideo style={{ marginRight: "6px" }} /> Join Session
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginBottom: "14px" }}>Past Sessions</h2>
      {!loading && past.length === 0 && (
        <p style={{ color: "var(--light-text)" }}>No past sessions yet.</p>
      )}
      <div style={{ display: "grid", gap: "14px" }}>
        {past.map((booking) => {
          const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
          const other = isInterviewer ? booking.interviewee : booking.interviewer;
          return (
            <div key={booking._id} className="card" style={{ opacity: 0.85 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {booking.topic}{" "}
                    <span style={{ fontSize: "0.8rem", color: "var(--light-text)" }}>
                      ({booking.status})
                    </span>
                  </div>
                  <div style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>
                    {formatDate(booking.date)} · With {other?.name}
                  </div>
                </div>
                {booking.status === "completed" && (
                  <Link to={`/feedback/${booking._id}`} className="btn btn-outline">
                    Leave Feedback
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
