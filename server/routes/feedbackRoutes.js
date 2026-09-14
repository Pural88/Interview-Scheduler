import express from "express";
import { Feedback } from "../models/Feedback.js";
import { Booking } from "../models/Booking.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Submit feedback about the other participant after a session
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { bookingId, ratings, comment } = req.body;

    if (!bookingId || !ratings) {
      return res
        .status(400)
        .json(new ApiError(400, "bookingId and ratings are required"));
    }

    const { communication, problemSolving, technicalDepth } = ratings;
    if (!communication || !problemSolving || !technicalDepth) {
      return res.status(400).json(
        new ApiError(
          400,
          "communication, problemSolving and technicalDepth are all required, each 1-5",
        ),
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json(new ApiError(404, "Booking not found"));
    }

    const isInterviewer = String(booking.interviewer) === String(req.user.id);
    const isInterviewee = String(booking.interviewee) === String(req.user.id);

    if (!isInterviewer && !isInterviewee) {
      return res.status(403).json(new ApiError(403, "Access denied."));
    }

    const to = isInterviewer ? booking.interviewee : booking.interviewer;

    const feedback = await Feedback.create({
      booking: booking._id,
      from: req.user.id,
      to,
      ratings: { communication, problemSolving, technicalDepth },
      comment,
    });

    res.status(201).json(new Apiresponse(201, feedback, "Feedback submitted"));
  } catch (error) {
    if (error?.code === 11000) {
      return res
        .status(400)
        .json(new ApiError(400, "You already submitted feedback for this session."));
    }
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Feedback for a given booking (either participant can view both sides)
router.get("/booking/:bookingId", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json(new ApiError(404, "Booking not found"));
    }

    const isParticipant =
      String(booking.interviewer) === String(req.user.id) ||
      String(booking.interviewee) === String(req.user.id);

    if (!isParticipant) {
      return res.status(403).json(new ApiError(403, "Access denied."));
    }

    const feedback = await Feedback.find({ booking: booking._id })
      .populate("from", "-password")
      .populate("to", "-password");

    res.status(200).json(new Apiresponse(200, feedback, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// All feedback received by a user (shown on their profile)
router.get("/user/:userId", async (req, res) => {
  try {
    const feedback = await Feedback.find({ to: req.params.userId })
      .populate("from", "name avatarUrl")
      .sort({ createdAt: -1 });

    res.status(200).json(new Apiresponse(200, feedback, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

export { router as feedbackRouter };
