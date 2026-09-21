import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { Apiresponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFile } from "../services/storage.services.js";

// Client (Vercel) and server (Render) are on different domains in
// production, so the auth cookies need sameSite: "none" (which itself
// requires secure: true) to survive a cross-site XHR. In local dev the
// client isn't served over HTTPS, so "secure" cookies would be dropped
// entirely — use the classic same-site-friendly Lax/insecure pair there.
const isProduction = process.env.NODE_ENV === "production";
const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
};

const generateAccessAndRefreshToken = (async (userId) => {
    try {
        const user = await User.findById(userId).select("-password");
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        await user.save({ validateBeforeSave: false });
        return { refreshToken, accessToken };
    } catch (error) {
        throw new ApiError(500, "error generating tokens");
    }
})

const registerUser = asyncHandler(async (req, res) => {
    try {
        const {
            name, email, password, phone, roles, bio, topics,
        } = req.body || {};

        if ([name, email, password, phone].some((field) => !field || field?.toString().trim() === "")) {
            throw new ApiError(400, "Name, email, password and phone are required")
        }

        // 10 digits, no leading zero.
        const PHONE_REGEX = /^[1-9]\d{9}$/;
        if (!PHONE_REGEX.test(phone.toString().trim())) {
            throw new ApiError(400, "Enter a valid 10-digit phone number (it cannot start with 0)")
        }

        // A user is either an interviewer or an interviewee — exactly one
        // role, self-assigned at signup. Anyone can be either — there is no
        // gatekeeping, unlike SmashSlot's host role.
        const allowedRoles = ["interviewer", "interviewee"];
        const requestedRoles = Array.isArray(roles)
            ? roles.filter((r) => allowedRoles.includes(r))
            : [];

        if (requestedRoles.length !== 1) {
            throw new ApiError(400, "Choose exactly one role: interviewer or interviewee")
        }

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            throw new ApiError(400, "User already registered")
        }

        const user = await User.create({
            name,
            email,
            password,
            phone,
            roles: requestedRoles,
            bio,
            topics: Array.isArray(topics) ? topics : [],
        })

        const createdUser = await User.findById(user._id).select("-password")
        if (!createdUser) {
            throw new ApiError(500, "Error while registering user")
        }

        // Sign the new user in straight away, returning the same shape as
        // login so the client can store the token and redirect.
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

        res.status(201)
            .cookie("accessToken", accessToken, authCookieOptions)
            .cookie("refreshToken", refreshToken, authCookieOptions)
            .json(
                new Apiresponse(
                    201,
                    { user: createdUser, accessToken, refreshToken },
                    "User registered successfully"
                )
            )
    } catch (error) {
        // Preserve specific validation errors instead of masking them.
        if (error instanceof ApiError) {
            throw error
        }

        // Surface mongoose validation/duplicate-key problems with a usable
        // message instead of a blanket 501.
        if (error?.name === "ValidationError") {
            const detail = Object.values(error.errors || {})
                .map((e) => e.message)
                .join(", ")
            throw new ApiError(400, detail || "Invalid registration details")
        }

        if (error?.code === 11000) {
            throw new ApiError(400, "User already registered")
        }

        console.error("Register failed:", error)
        throw new ApiError(500, error?.message || "Error while registering user")
    }

})

const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json(new ApiError(400, "Email and password are required"));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not registered. Please create an account first."));
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json(new ApiError(401, "Incorrect password. Please try again."));
        }

        const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password");
        res
            .cookie("accessToken", accessToken, authCookieOptions)
            .cookie("refreshToken", refreshToken, authCookieOptions)

        res
            .status(200)
            .json(new Apiresponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful"));
    } catch (error) {
        res.status(500).json(new ApiError(500, error.message));
    }
})

const logoutUser = asyncHandler(async (req, res) => {
    res.status(200)
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .json(new Apiresponse(200, {}, "User Logout Successfully"))

})

const getCurrentuser = asyncHandler(async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        res.status(200)
        .json(new Apiresponse(200, user, "Current User fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Error fetching current user");
    }
})

// Multer hands us the file as a memory buffer on req.file; push it to
// ImageKit and save the resulting URL on the user's profile.
const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, "No file uploaded");
    }

    const avatarUrl = await uploadFile(
        req.file.buffer,
        `avatar-${req.user.id}`,
        "avatars",
    );

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { avatarUrl },
        { new: true },
    ).select("-password");

    res.status(200).json(new Apiresponse(200, user, "Avatar updated successfully"));
})


export { registerUser, loginUser, logoutUser, getCurrentuser, uploadAvatar };
