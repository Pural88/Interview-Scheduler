import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/authRoutes.js";
import { userRouter } from "./routes/userRoutes.js";
import { slotRouter } from "./routes/slotRoutes.js";
import { bookingRouter } from "./routes/bookingRoutes.js";
import { feedbackRouter } from "./routes/feedbackRoutes.js";
import {
  purgeExpiredSlots,
  completePastBookings,
} from "./services/slotCleanup.services.js";
import { Apiresponse } from "./utils/ApiResponse.js";
import { ApiError } from "./utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
// Configure CORS
// Create React App falls back to 3001, 3002, ... when 3000 is already in
// use, so allow the common local dev ports as well as FRONTEND_URL.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (curl, mobile apps) which send no origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// How often expired slots are swept away.
const SLOT_CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

const runSlotCleanup = async () => {
  try {
    // Mark past bookings completed before removing the expired slots, so a
    // booking is never left showing "confirmed" in the past.
    const completed = await completePastBookings();
    if (completed > 0) {
      console.log(`Marked ${completed} past booking(s) as completed`);
    }

    const removed = await purgeExpiredSlots();
    if (removed > 0) {
      console.log(`Removed ${removed} expired slot(s)`);
    }
  } catch (error) {
    console.error("Slot cleanup failed:", error.message);
  }
};

mongoose.set("bufferCommands", false);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Atlas's TLS handshake frequently fails on the first several attempts
// (SSL alert 80 / "internal error") against newer Node/OpenSSL builds —
// a known flaky-handshake rough edge, not a config problem. Observed up to
// 3 consecutive failures before success, so give it real headroom rather
// than crashing the whole process over a transient handshake blip.
const MONGO_CONNECT_RETRIES = 6;
const MONGO_CONNECT_RETRY_DELAY_MS = 3000;

const connectWithRetry = async () => {
  for (let attempt = 1; attempt <= MONGO_CONNECT_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      return;
    } catch (err) {
      const isLastAttempt = attempt === MONGO_CONNECT_RETRIES;
      console.error(
        `MongoDB connection attempt ${attempt}/${MONGO_CONNECT_RETRIES} failed:`,
        err.message,
      );

      if (isLastAttempt) {
        throw err;
      }

      console.log(`Retrying in ${MONGO_CONNECT_RETRY_DELAY_MS / 1000}s...`);
      await sleep(MONGO_CONNECT_RETRY_DELAY_MS);
    }
  }
};

const startServer = async () => {
  if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in server/.env");
    process.exit(1);
  }

  try {
    await connectWithRetry();
    console.log("MongoDB connected");

    // Sweep once on boot, then periodically while the server runs.
    await runSlotCleanup();
    setInterval(runSlotCleanup, SLOT_CLEANUP_INTERVAL_MS);

    // Use PORT env if set; default to 5001 to avoid common macOS service conflicts on 5000
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    if (String(err.message || "").includes("querySrv")) {
      console.error(
        "Atlas SRV lookup failed. Check internet/DNS, Atlas network access rules, and your MONGODB_URI cluster host.",
      );
    }
    if (String(err.message || "").toLowerCase().includes("bad auth")) {
      console.error(
        "Mongo auth failed. Verify MONGODB_URI credentials, URL-encode special characters in password, and ensure Atlas DB user permissions are correct.",
      );
    }
    process.exit(1);
  }
};

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/slots", slotRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/feedback", feedbackRouter);

// Basic route
app.get("/", (req, res) => {
  res.status(200).json(new Apiresponse(200, null, "Mock Interview Scheduler API"));
});

// Return thrown ApiErrors as JSON so the client can read `message`
// instead of receiving Express's default HTML error page.
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res
    .status(statusCode)
    .json(
      new ApiError(
        statusCode,
        err.message || "Internal server error",
        err.errors || [],
      ),
    );
});

startServer();
