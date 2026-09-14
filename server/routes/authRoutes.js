import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentuser,
} from "../controllers.js/user.controller.js";

const router = express.Router();

// Register
router.route("/register").post(registerUser);

// Login
router.route("/login").post(loginUser);

// logout
router.get("/logout", authMiddleware, logoutUser);

// Get current user
router.get("/me", authMiddleware, getCurrentuser);

export { router as authRouter };
