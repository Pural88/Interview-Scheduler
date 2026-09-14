import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { usersAPI, feedbackAPI } from "../services/api";
import StarRating from "../components/StarRating";
import { FaUserCircle } from "react-icons/fa";

const RUBRIC_FIELDS = [
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem Solving" },
  { key: "technicalDepth", label: "Technical Depth" },
];

const averageOf = (feedback, key) => {
  if (feedback.length === 0) return 0;
  const sum = feedback.reduce((acc, f) => acc + (f.ratings?.[key] || 0), 0);
  return sum / feedback.length;
};

export const UserProfile = () => {
  const { id } = useParams();
  const { user: currentUser, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = String(currentUser?.id) === String(id);

  const load = () => {
    usersAPI
      .getUser(id)
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load profile"));

    feedbackAPI
      .getForUser(id)
      .then((res) => setFeedback(res.data || []))
      .catch(() => {});
  };

  useEffect(load, [id]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await usersAPI.uploadAvatar(file);
      setUser((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return <div className="alert alert-error" style={{ maxWidth: "500px", margin: "40px auto" }}>{error}</div>;
  }

  if (!profile) {
    return <p style={{ textAlign: "center", marginTop: "60px" }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}>
      <div className="card" style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap", marginBottom: "24px" }}>
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <FaUserCircle size={80} style={{ color: "var(--light-text)" }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: "4px" }}>{profile.name}</h1>
          <p style={{ color: "var(--light-text)", marginBottom: "8px" }}>
            {(profile.roles || []).join(" · ")}
          </p>
          {profile.bio && <p>{profile.bio}</p>}
          {profile.topics?.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              {profile.topics.map((t) => (
                <span key={t} className="tag-pill">{t}</span>
              ))}
            </div>
          )}
          {isOwnProfile && (
            <div style={{ marginTop: "14px" }}>
              <label className="btn btn-outline" style={{ cursor: "pointer" }}>
                {uploading ? "Uploading..." : "Change Profile Picture"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <h2 style={{ marginBottom: "10px" }}>Feedback Received</h2>
      {feedback.length === 0 ? (
        <p style={{ color: "var(--light-text)" }}>No feedback yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: "24px", marginBottom: "18px", flexWrap: "wrap" }}>
            {RUBRIC_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <div style={{ fontSize: "0.85rem", color: "var(--light-text)", marginBottom: "4px" }}>{label}</div>
                <StarRating value={averageOf(feedback, key)} count={feedback.length} />
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {feedback.map((f) => (
              <div key={f._id} className="card">
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{f.from?.name}</div>
                {f.comment && <p style={{ color: "var(--light-text)" }}>{f.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
