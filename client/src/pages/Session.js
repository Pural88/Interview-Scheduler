import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { bookingsAPI } from "../services/api";

// Loads the Jitsi Meet external API script once and reuses it.
const JITSI_SCRIPT_SRC = "https://meet.jit.si/external_api.js";
let jitsiScriptPromise = null;
const loadJitsiScript = () => {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (!jitsiScriptPromise) {
    jitsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = JITSI_SCRIPT_SRC;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return jitsiScriptPromise;
};

export const Session = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    bookingsAPI
      .getBooking(id)
      .then((res) => setBooking(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load session"));
  }, [id]);

  useEffect(() => {
    if (!booking || !containerRef.current) return;

    let cancelled = false;

    loadJitsiScript().then(() => {
      if (cancelled || !containerRef.current) return;

      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: booking.jitsiRoom,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName: user?.name || "Guest" },
        configOverwrite: { prejoinPageEnabled: false },
      });
    });

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [booking, user]);

  if (error) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "0 20px" }}>
        <div className="alert alert-error">{error}</div>
        <Link to="/dashboard" className="btn btn-outline">Back to Dashboard</Link>
      </div>
    );
  }

  if (!booking) {
    return <p style={{ textAlign: "center", marginTop: "60px" }}>Loading session...</p>;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ marginBottom: "4px" }}>{booking.topic} Mock Interview</h2>
          <p style={{ color: "var(--light-text)", margin: 0 }}>
            {booking.interviewer?.name} & {booking.interviewee?.name}
          </p>
        </div>
        <Link to={`/feedback/${booking._id}`} className="btn btn-outline">
          Leave Feedback
        </Link>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "70vh",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      />
    </div>
  );
};

export default Session;
