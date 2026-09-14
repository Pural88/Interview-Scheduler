import express from "express";
import { Slot } from "../models/Slot.js";
import {
  authMiddleware,
  interviewerMiddleware,
} from "../middleware/authMiddleware.js";
import {
  buildActiveSlotQuery,
  purgeExpiredSlots,
} from "../services/slotCleanup.services.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Get all open (bookable) slots, optionally filtered by topic/date
router.get("/available", async (req, res) => {
  try {
    // Clear out expired unbooked slots as they are browsed, so the sweep
    // does not depend solely on the periodic timer.
    await purgeExpiredSlots();

    const { date, topic } = req.query;
    const filter = {
      isAvailable: true,
      ...buildActiveSlotQuery(),
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    if (topic) filter.topic = topic;

    const slots = await Slot.find(filter)
      .populate("interviewer", "-password")
      .sort({ date: 1, startTime: 1 });
    res.status(200).json(new Apiresponse(200, slots, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// My own open slots (as an interviewer)
router.get("/", interviewerMiddleware, async (req, res) => {
  try {
    const filter = {
      interviewer: req.user.id,
      ...buildActiveSlotQuery(),
    };

    const slots = await Slot.find(filter)
      .populate("interviewer", "-password")
      .sort({ date: 1, startTime: 1 });
    res.status(200).json(new Apiresponse(200, slots, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Get slot by ID
router.get("/:id", async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id).populate(
      "interviewer",
      "-password",
    );
    if (!slot) {
      return res.status(404).json(new ApiError(404, "Slot not found"));
    }
    res.status(200).json(new Apiresponse(200, slot, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Create a slot (interviewer opens a bookable time)
router.post("/", interviewerMiddleware, async (req, res) => {
  try {
    const { date, startTime, endTime, topic, notes } = req.body;

    if (!date || !startTime || !endTime || !topic) {
      return res
        .status(400)
        .json(new ApiError(400, "date, startTime, endTime and topic are required"));
    }

    // An interviewer can only run one session at a time, so reject any
    // slot whose window overlaps one they already have on the same day.
    // Two ranges overlap when each starts before the other ends. "HH:MM"
    // strings compare correctly lexicographically.
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const conflictingSlot = await Slot.findOne({
      interviewer: req.user.id,
      date: { $gte: startDate, $lt: endDate },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflictingSlot) {
      return res.status(409).json(
        new ApiError(
          409,
          `You already have a slot from ${conflictingSlot.startTime} to ${conflictingSlot.endTime} on ${startDate.toLocaleDateString()}. Choose a time that does not overlap.`,
        ),
      );
    }

    const slot = new Slot({
      interviewer: req.user.id,
      date,
      startTime,
      endTime,
      topic,
      notes,
      isAvailable: true,
    });

    await slot.save();
    const populatedSlot = await Slot.findById(slot._id).populate(
      "interviewer",
      "-password",
    );

    res.status(201).json(new Apiresponse(201, populatedSlot, "Created"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Delete a slot (owning interviewer only, and only if still unbooked)
router.delete("/:id", interviewerMiddleware, async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json(new ApiError(404, "Slot not found"));
    }

    if (String(slot.interviewer) !== String(req.user.id)) {
      return res
        .status(403)
        .json(new ApiError(403, "You can only manage your own slots."));
    }

    if (!slot.isAvailable) {
      return res
        .status(409)
        .json(new ApiError(409, "This slot is already booked and cannot be deleted."));
    }

    await slot.deleteOne();
    res
      .status(200)
      .json(new Apiresponse(200, { message: "Slot deleted successfully" }, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

export { router as slotRouter };
