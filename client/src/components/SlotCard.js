import React from "react";
import { Link } from "react-router-dom";
import { FaClock, FaCalendarAlt, FaTag } from "react-icons/fa";

export const SlotCard = ({ slot, onBook, currentUserId }) => {
  const isAvailable = slot.isAvailable;
  const isOwnSlot = String(slot.interviewer?._id) === String(currentUserId);

  const slotDate = slot.date
    ? new Date(slot.date).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div className="slot-card">
      <div style={{ marginBottom: "8px" }}>
        {slot.interviewer?._id ? (
          <Link
            to={`/profile/${slot.interviewer._id}`}
            className="slot-court-link"
          >
            {slot.interviewer?.name || "Interviewer"}
          </Link>
        ) : (
          <span style={{ color: "var(--light-text)", fontSize: "0.9rem" }}>
            Interviewer
          </span>
        )}
      </div>

      <div className="slot-type">
        <FaTag size={12} style={{ marginRight: "6px" }} />
        {slot.topic}
      </div>

      <div className="slot-date">
        <FaCalendarAlt size={13} style={{ marginRight: "8px" }} />
        {slotDate}
      </div>

      <div className="slot-time">
        <FaClock size={13} style={{ marginRight: "8px" }} />
        {slot.startTime} - {slot.endTime}
      </div>

      {slot.notes && (
        <div style={{ marginTop: "10px", color: "var(--light-text)", fontSize: "0.9rem" }}>
          {slot.notes}
        </div>
      )}

      <div style={{ marginTop: "15px" }}>
        {isOwnSlot ? (
          <span className="slot-full">This is your slot</span>
        ) : isAvailable ? (
          <>
            <span className="slot-available">✓ Available</span>
            <button
              className="btn btn-primary"
              onClick={() => onBook(slot)}
              style={{ width: "100%", marginTop: "10px" }}
            >
              Book This Slot
            </button>
          </>
        ) : (
          <span className="slot-full">✗ Already Booked</span>
        )}
      </div>
    </div>
  );
};

export default SlotCard;
