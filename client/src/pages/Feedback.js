import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { bookingsAPI, feedbackAPI } from "../services/api";
import StarRating from "../components/StarRating";

const RUBRIC_FIELDS = [
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem Solving" },
  { key: "technicalDepth", label: "Technical Depth" },
];

export const Feedback = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [ratings, setRatings] = useState({ communication: 0, problemSolving: 0, technicalDepth: 0 });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingsAPI
      .getBooking(id)
      .then((res) => setBooking(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load session"));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.values(ratings).some((v) => !v)) {
      setError("Please rate all three categories.");
      return;
    }

    setSubmitting(true);
    try {
      await feedbackAPI.submitFeedback({ bookingId: id, ratings, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) {
    return <p style={{ textAlign: "center", marginTop: "60px" }}>Loading...</p>;
  }

  const isInterviewer = String(booking.interviewer?._id) === String(user?.id);
  const other = isInterviewer ? booking.interviewee : booking.interviewer;

  if (submitted) {
    return (
      <div style={{ maxWidth: "500px", margin: "60px auto", padding: "0 20px", textAlign: "center" }}>
        <div className="card">
          <h2 style={{ marginBottom: "10px" }}>Thanks for the feedback!</h2>
          <p style={{ color: "var(--light-text)", marginBottom: "20px" }}>
            It's been sent to {other?.name}.
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", padding: "0 20px" }}>
      <div className="card">
        <h1 style={{ marginBottom: "6px" }}>Feedback for {other?.name}</h1>
        <p style={{ color: "var(--light-text)", marginBottom: "24px" }}>
          {booking.topic} session on {new Date(booking.date).toLocaleDateString()}
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {RUBRIC_FIELDS.map(({ key, label }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <StarRating
                value={ratings[key]}
                editable
                showValue={false}
                onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}

          <div className="form-group">
            <label>Comments (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="What went well, what to work on..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
