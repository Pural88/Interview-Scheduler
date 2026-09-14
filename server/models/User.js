import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String, // +91
    // A user can be an interviewer, an interviewee, or both — chosen
    // per-action (creating a slot vs. booking one), not fixed at signup.
    roles: {
      type: [String],
      enum: ["interviewer", "interviewee"],
      default: ["interviewee"],
    },
    // Record of the user accepting the terms at signup.
    acceptedTerms: { type: Boolean, default: false },
    acceptedTermsAt: Date,
    avatarUrl: String,
    bio: String,
    // Topics this user is comfortable interviewing/being interviewed on.
    topics: {
      type: [String],
      enum: [
        "DSA",
        "System Design",
        "Behavioral",
        "Frontend",
        "Backend",
        "Other",
      ],
      default: [],
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (this.isModified("password")) {

      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      } catch (error) {
        throw new Error("Error hashing password");
      }
  }

});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.generateAccessToken = async function (){
  return jwt.sign(
    { id: this._id, email: this.email, roles: this.roles },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" },
  )
}

userSchema.methods.generateRefreshToken = async function (){
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" },
  )
}
export const User = mongoose.model("User", userSchema);
