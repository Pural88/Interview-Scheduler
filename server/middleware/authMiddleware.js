import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";

const authMiddleware = async(req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json(new ApiError(401, "No token provided"));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || "your_secret_key",
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json(new ApiError(401, "Invalid token"));
  }
};

// A user needs the "interviewer" role to open/manage slots. Anyone can
// hold this role — it is self-assigned, not admin-granted (no admin role
// in this app).
const interviewerMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user.roles?.includes("interviewer")) {
      return res.status(403).json(new ApiError(403, "Access denied. Interviewers only."));
    }
    next();
  });
};

export {
  authMiddleware,
  interviewerMiddleware,
};
