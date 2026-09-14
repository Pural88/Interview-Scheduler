import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    interviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: {
      type: String,
      enum: [
        "DSA",
        "System Design",
        "Behavioral",
        "Frontend",
        "Backend",
        "Other",
      ],
      required: true,
    },
    date: { type: Date, required: true },
    startTime: String,
    endTime: String,
    // Stable room name for the video call, derived from the booking id so
    // both sides land in the same Jitsi room without any signaling server.
    jitsiRoom: { type: String, required: true },
    status: {
      type: String,
      enum: ["confirmed", "completed", "cancelled"],
      default: "confirmed",
    },
  },
  { timestamps: true },
);

const Booking = mongoose.model("Booking", bookingSchema);

export { Booking };
