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

const TOPIC_OPTIONS = [
  "DSA",
  "System Design",
  "Behavioral",
  "Frontend",
  "Backend",
  "Other",
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", bio: "", topics: [] });

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

  const startEditing = () => {
    setEditForm({
      name: profile.name || "",
      bio: profile.bio || "",
      topics: profile.topics || [],
    });
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const toggleEditTopic = (topic) => {
    setEditForm((prev) => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter((t) => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await usersAPI.updateMyProfile(editForm);
      setUser((prev) => ({ ...prev, name: res.data.name }));
      setEditing(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

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
          {isOwnProfile && !editing && (
            <div style={{ marginTop: "14px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" onClick={startEditing}>
                Edit Profile
              </button>
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

      {isOwnProfile && editing && (
        <form onSubmit={saveProfile} className="card" style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "16px" }}>Edit Profile</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Short bio</label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              rows={3}
              placeholder="A sentence or two about your background"
            />
          </div>

          <div className="form-group">
            <label>Topics you're comfortable with</label>
            <div className="checkbox-row">
              {TOPIC_OPTIONS.map((topic) => (
                <label key={topic} className="checkbox-pill">
                  <input
                    type="checkbox"
                    checked={editForm.topics.includes(topic)}
                    onChange={() => toggleEditTopic(topic)}
                  />
                  {topic}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="btn btn-outline" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

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
