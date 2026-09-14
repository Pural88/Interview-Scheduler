import mongoose from "mongoose";

const slotSchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // HH:MM format
    endTime: { type: String, required: true },
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
    notes: String, // optional free-text: "focus on graphs", etc.
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Slot = mongoose.model("Slot", slotSchema);

export { Slot };
