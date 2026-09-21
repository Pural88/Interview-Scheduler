import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { bookingsAPI } from "../services/api";
import { FaVideo, FaCalendarAlt, FaHourglassHalf, FaHistory, FaUserTag, FaTimes, FaRedo } from "react-icons/fa";
import Dialog, { useDialog } from "../components/Dialog";

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { dialog, showError, showConfirm, closeDialog } = useDialog();

  const loadBookings = () => {
    bookingsAPI
      .getMyBookings()
      .then((res) => setBookings(res.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load sessions"))
      .finally(() => setLoading(false));
  };

  useEffect(loadBookings, []);

  const handleCancel = (booking) => {
    showConfirm({
      title: "Cancel this session?",
      message: `Cancel your ${booking.topic} session on ${formatDate(booking.date)} at ${booking.startTime}? This cannot be undone.`,
      confirmLabel: "Cancel Session",
      cancelLabel: "Keep It",
      onConfirm: async () => {
        try {
          await bookingsAPI.cancelBooking(booking._id);
          loadBookings();
        } catch (err) {
          showError(err.response?.data?.message || "Failed to cancel session");
        }
      },
    });
  };

  const handleReschedule = (booking) => {
    const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
    const interviewer = isInterviewer ? user : booking.interviewer;

    showConfirm({
      title: "Reschedule this session?",
      message: `This cancels your current ${booking.topic} session on ${formatDate(booking.date)} and takes you to pick a new open slot with ${interviewer?.name}.`,
      confirmLabel: "Cancel & Pick New Slot",
      cancelLabel: "Never Mind",
      onConfirm: async () => {
        try {
          await bookingsAPI.cancelBooking(booking._id);
          const params = new URLSearchParams({
            interviewer: interviewer?._id || interviewer?.id || "",
            interviewerName: interviewer?.name || "",
            topic: booking.topic || "",
          });
          navigate(`/find-slots?${params.toString()}`);
        } catch (err) {
          showError(err.response?.data?.message || "Failed to reschedule session");
        }
      },
    });
  };

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const roleLabel = (user?.roles || []).join(" · ") || "—";

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <div className="dashboard-hero">
        <h1>Welcome, {user?.name}</h1>
        <p style={{ color: "var(--light-text)" }}>Here's what's coming up.</p>

        <div className="dashboard-hero-actions">
          {user?.roles?.includes("interviewee") && (
            <Link to="/find-slots" className="btn btn-primary">
              Find a Slot to Book
            </Link>
          )}
          {user?.roles?.includes("interviewer") && (
            <Link to="/manage-slots" className="btn btn-outline">
              Manage My Slots
            </Link>
          )}
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-tile" style={{ "--tile-accent": "var(--primary-color)" }}>
          <FaHourglassHalf style={{ color: "var(--primary-color)", marginBottom: "8px" }} />
          <div className="stat-tile-value">{upcoming.length}</div>
          <div className="stat-tile-label">Upcoming</div>
        </div>
        <div className="stat-tile" style={{ "--tile-accent": "var(--success-color)" }}>
          <FaHistory style={{ color: "var(--success-color)", marginBottom: "8px" }} />
          <div className="stat-tile-value">{completedCount}</div>
          <div className="stat-tile-label">Completed</div>
        </div>
        <div className="stat-tile" style={{ "--tile-accent": "var(--secondary-color)" }}>
          <FaUserTag style={{ color: "var(--secondary-color)", marginBottom: "8px" }} />
          <div className="stat-tile-value" style={{ fontSize: "1.1rem", textTransform: "capitalize" }}>
            {roleLabel}
          </div>
          <div className="stat-tile-label">Role</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading...</p>}

      <div className="section-heading">
        <span className="accent-bar" />
        <h2>Upcoming Sessions</h2>
      </div>
      {!loading && upcoming.length === 0 && (
        <div className="empty-state" style={{ marginBottom: "36px" }}>
          No upcoming sessions yet.
        </div>
      )}
      <div style={{ display: "grid", gap: "14px", marginBottom: "36px" }}>
        {upcoming.map((booking) => {
          const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
          const other = isInterviewer ? booking.interviewee : booking.interviewer;
          return (
            <div key={booking._id} className="card session-card">
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
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link to={`/session/${booking._id}`} className="btn btn-primary">
                    <FaVideo style={{ marginRight: "6px" }} /> Join Session
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleReschedule(booking)}
                  >
                    <FaRedo style={{ marginRight: "6px" }} /> Reschedule
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-danger-outline"
                    onClick={() => handleCancel(booking)}
                  >
                    <FaTimes style={{ marginRight: "6px" }} /> Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-heading">
        <span className="accent-bar" />
        <h2>Past Sessions</h2>
      </div>
      {!loading && past.length === 0 && (
        <div className="empty-state">No past sessions yet.</div>
      )}
      <div style={{ display: "grid", gap: "14px" }}>
        {past.map((booking) => {
          const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
          const other = isInterviewer ? booking.interviewee : booking.interviewer;
          return (
            <div key={booking._id} className="card session-card is-past">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {booking.topic}
                    <span className={`status-pill ${booking.status}`}>{booking.status}</span>
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

      <Dialog {...dialog} onClose={closeDialog} />
    </div>
  );
};

export default Dashboard;
