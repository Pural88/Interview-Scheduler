import express from "express";
import multer from "multer";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../controllers.js/user.controller.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

const router = express.Router();

// Memory storage: the file never touches disk, it's forwarded straight to
// ImageKit as a buffer. A small size limit is enough for a profile photo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Get a public profile by id
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -email");
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    res.status(200).json(new Apiresponse(200, user, "Success"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Update own profile (name, bio, topics, roles)
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name, bio, topics, roles, phone } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (topics !== undefined) updates.topics = topics;
    if (phone !== undefined) {
      const PHONE_REGEX = /^[1-9]\d{9}$/;
      if (!PHONE_REGEX.test(phone.toString().trim())) {
        return res
          .status(400)
          .json(new ApiError(400, "Enter a valid 10-digit phone number (it cannot start with 0)"));
      }
      updates.phone = phone;
    }
    if (roles !== undefined) {
      const allowedRoles = ["interviewer", "interviewee"];
      const filteredRoles = (roles || []).filter((r) => allowedRoles.includes(r));
      if (filteredRoles.length !== 1) {
        return res
          .status(400)
          .json(new ApiError(400, "Choose exactly one role: interviewer or interviewee"));
      }
      updates.roles = filteredRoles;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json(new Apiresponse(200, user, "Profile updated"));
  } catch (error) {
    res.status(500).json(new ApiError(500, error.message));
  }
});

// Upload/replace profile picture
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar,
);

// My upcoming + past sessions, as either interviewer or interviewee
router.get("/me/sessions", authMiddleware, async (req, res) => {
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

export { router as userRouter };
