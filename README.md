# Interview Scheduling — Mock Interview Matcher

A simple peer mock-interview scheduler: interviewers open time slots by
topic, interviewees book them, both join a built-in video call (Jitsi Meet),
and leave structured feedback afterward.

Built as a structural mirror of the SmashSlot project — same stack, same
folder layout, same coding conventions — with the badminton-booking domain
swapped for mock-interview scheduling. See [PLAN.md](./PLAN.md) for the full
design writeup and domain mapping.

## Stack

- **Backend:** Node.js (ESM) + Express 5 + MongoDB/Mongoose + JWT auth
- **Frontend:** React 19 (Create React App) + react-router-dom + axios
- **Video:** Jitsi Meet external API (no signaling server needed)
- **Uploads:** multer + ImageKit, used only for profile pictures

## Setup

### 1. Backend

```bash
cd server
cp .env.sample .env   # fill in MONGODB_URI, JWT secrets, IMAGEKIT_PRIVATE_KEY
npm install
npm run dev            # nodemon, http://localhost:5001
```

### 2. Frontend

```bash
cd client
cp .env.sample .env   # points at the backend API
npm install
npm start               # http://localhost:3000
```

## Core flow

1. Register as an **interviewer**, **interviewee**, or both.
2. Interviewers open a slot (date, time, topic) under **Manage Slots**.
3. Interviewees browse **Find Slots** and book one.
4. At the scheduled time, either side opens the booking's **Session** page
   to join the Jitsi video call.
5. After the call, both sides leave structured **Feedback** (communication,
   problem-solving, technical depth + a comment) from the Dashboard.

## What's intentionally left out

No payments, no venue/court concept, no invite-only slots, no admin role,
no custom WebRTC signaling, no skill-matching algorithm — just
browse-and-book, kept deliberately simple.
