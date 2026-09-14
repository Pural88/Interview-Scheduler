import React, { useEffect, useState } from "react";
import { slotsAPI } from "../services/api";
import Dialog, { useDialog } from "../components/Dialog";
import { FaTrash, FaCalendarAlt } from "react-icons/fa";

const TOPICS = ["DSA", "System Design", "Behavioral", "Frontend", "Backend", "Other"];

const emptyForm = { date: "", startTime: "", endTime: "", topic: "DSA", notes: "" };

export const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { dialog, showSuccess, showError, showConfirm, closeDialog } = useDialog();

  const fetchSlots = () => {
    setLoading(true);
    slotsAPI
      .getMySlots()
      .then((res) => setSlots(res.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load slots"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchSlots, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await slotsAPI.createSlot(form);
      setForm(emptyForm);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create slot");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (slot) => {
    showConfirm({
      title: "Delete this slot?",
      message: `Remove your ${slot.topic} slot on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}?`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await slotsAPI.deleteSlot(slot._id);
          showSuccess("Slot deleted");
          fetchSlots();
        } catch (err) {
          showError(err.response?.data?.message || "Failed to delete slot");
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Manage My Slots</h1>

      <div className="card" style={{ marginBottom: "30px" }}>
        <h3 style={{ marginBottom: "16px" }}>Open a new slot</h3>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Start time</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End time</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Topic</label>
              <select name="topic" value={form.topic} onChange={handleChange}>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <input
              type="text"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="e.g. Focus on graphs & trees"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Slot"}
          </button>
        </form>
      </div>

      <h2 style={{ marginBottom: "14px" }}>Your Open Slots</h2>
      {loading && <p>Loading...</p>}
      {!loading && slots.length === 0 && (
        <p style={{ color: "var(--light-text)" }}>You haven't opened any slots yet.</p>
      )}
      <div style={{ display: "grid", gap: "12px" }}>
        {slots.map((slot) => (
          <div key={slot._id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{slot.topic}</div>
              <div style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>
                <FaCalendarAlt style={{ marginRight: "6px" }} />
                {new Date(slot.date).toLocaleDateString()} · {slot.startTime}-{slot.endTime}
              </div>
              <div style={{ fontSize: "0.85rem", color: slot.isAvailable ? "var(--success-color)" : "var(--warning-color)" }}>
                {slot.isAvailable ? "Open" : "Booked"}
              </div>
            </div>
            {slot.isAvailable && (
              <button className="btn btn-outline" onClick={() => handleDelete(slot)}>
                <FaTrash style={{ marginRight: "6px" }} /> Delete
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog {...dialog} onClose={closeDialog} />
    </div>
  );
};

export default ManageSlots;
