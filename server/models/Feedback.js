import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Structured rubric, each scored 1-5.
    ratings: {
      communication: { type: Number, min: 1, max: 5, required: true },
      problemSolving: { type: Number, min: 1, max: 5, required: true },
      technicalDepth: { type: Number, min: 1, max: 5, required: true },
    },
    comment: String,
  },
  { timestamps: true },
);

// One feedback per person per booking.
feedbackSchema.index({ booking: 1, from: 1 }, { unique: true });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export { Feedback };
