import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { slotsAPI, bookingsAPI } from "../services/api";
import SlotCard from "../components/SlotCard";
import Dialog, { useDialog } from "../components/Dialog";

const TOPICS = ["DSA", "System Design", "Behavioral", "Frontend", "Backend", "Other"];

export const FindSlots = () => {
  const { user } = useContext(AuthContext);
  const [slots, setSlots] = useState([]);
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { dialog, showSuccess, showError, showConfirm, closeDialog } = useDialog();

  const fetchSlots = () => {
    setLoading(true);
    slotsAPI
      .getAvailableSlots({ topic: topic || undefined, date: date || undefined })
      .then((res) => setSlots(res.data || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load slots"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, date]);

  const handleBook = (slot) => {
    showConfirm({
      title: "Book this slot?",
      message: `Book ${slot.topic} with ${slot.interviewer?.name} on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}?`,
      confirmLabel: "Book",
      onConfirm: async () => {
        try {
          await bookingsAPI.createBooking(slot._id);
          showSuccess("Slot booked! Check your dashboard for the video call link.");
          fetchSlots();
        } catch (err) {
          showError(err.response?.data?.message || "Failed to book slot");
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Find a Slot</h1>

      <div style={{ display: "flex", gap: "14px", marginBottom: "26px", flexWrap: "wrap" }}>
        <div className="form-group" style={{ minWidth: "200px" }}>
          <label>Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">All topics</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: "200px" }}>
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p>Loading...</p>}
      {!loading && slots.length === 0 && (
        <p style={{ color: "var(--light-text)" }}>No open slots match your filters yet.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "18px" }}>
        {slots.map((slot) => (
          <SlotCard key={slot._id} slot={slot} onBook={handleBook} currentUserId={user?.id} />
        ))}
      </div>

      <Dialog {...dialog} onClose={closeDialog} />
    </div>
  );
};

export default FindSlots;
