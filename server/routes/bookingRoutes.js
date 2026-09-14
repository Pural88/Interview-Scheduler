import express from "express";
import { Booking } from "../models/Booking.js";
import { Slot } from "../models/Slot.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Book an open slot (becomes a scheduled session)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json(new ApiError(400, "slotId is required"));
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json(new ApiError(404, "Slot not found"));
    }

    if (!slot.isAvailable) {
      return res.status(409).json(new ApiError(409, "This slot is already booked."));
    }

    if (String(slot.interviewer) === String(req.user.id)) {
      return res
        .status(400)
        .json(new ApiError(400, "You cannot book your own slot."));
    }

    slot.isAvailable = false;
    await slot.save();

    const booking = await Booking.create({
      slot: slot._id,
      interviewer: slot.interviewer,
      interviewee: req.user.id,
      topic: slot.topic,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      // Room name derived from the slot id up front, then reconfirmed once
      // the booking exists so it's unique and stable for both sides.
      jitsiRoom: `interview-${slot._id}`,
      status: "confirmed",
    });

    booking.jitsiRoom = `interview-${booking._id}`;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate("interviewer", "-password")
      .populate("interviewee", "-password");

    res.status(201).json(new Apiresponse(201, populatedBooking, "Booked"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// My bookings (as interviewer or interviewee)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ interviewer: req.user.id }, { interviewee: req.user.id }],
    })
      .populate("interviewer", "-password")
      .populate("interviewee", "-password")
      .sort({ date: 1, startTime: 1 });

    res.status(200).json(new Apiresponse(200, bookings, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Get a single booking (either participant only)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("interviewer", "-password")
      .populate("interviewee", "-password");

    if (!booking) {
      return res.status(404).json(new ApiError(404, "Booking not found"));
    }

    const isParticipant =
      String(booking.interviewer._id) === String(req.user.id) ||
      String(booking.interviewee._id) === String(req.user.id);

    if (!isParticipant) {
      return res.status(403).json(new ApiError(403, "Access denied."));
    }

    res.status(200).json(new Apiresponse(200, booking, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Cancel a booking (either participant), reopens the slot
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json(new ApiError(404, "Booking not found"));
    }

    const isParticipant =
      String(booking.interviewer) === String(req.user.id) ||
      String(booking.interviewee) === String(req.user.id);

    if (!isParticipant) {
      return res.status(403).json(new ApiError(403, "Access denied."));
    }

    booking.status = "cancelled";
    await booking.save();

    // Reopen the slot so someone else can book it, if it still exists.
    await Slot.findByIdAndUpdate(booking.slot, { isAvailable: true });

    res.status(200).json(new Apiresponse(200, booking, "Booking cancelled"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

export { router as bookingRouter };
