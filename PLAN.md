# Interview Scheduling & Mock-Interview Matcher — Plan

Simple MERN app, structured **exactly like SmashSlot** (same folders, same file
naming, same layered style), swapping court-booking domain concepts for
mock-interview ones. No fancy features — auth, scheduled slots, Jitsi video
call, structured feedback. That's it.

---

## 1. Stack (identical to SmashSlot)

| Layer | Tech |
|---|---|
| Runtime | Node.js, ES Modules (`"type": "module"`) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs`, cookie-based via `cookie-parser` |
| Client | React 19 (Create React App) + `react-router-dom` + `axios` |
| Video | **Jitsi Meet API** (`react-jitsi` or the raw `JitsiMeetExternalAPI` script) — no custom WebRTC signaling server needed |
| Uploads | `multer` (memory storage) → **ImageKit** CDN — profile pictures only |
| Dev | `nodemon` |

No payments — that's dropped. Uploads (`multer` + ImageKit) are **kept**, scoped to one thing: profile pictures.

---

## 2. Domain mapping (SmashSlot → this app)

| SmashSlot concept | This app's equivalent |
|---|---|
| `Court` (a venue) | *(dropped — no physical resource to book)* |
| `Slot` (host opens a bookable time) | `Slot` — an **interviewer** opens a time slot for a given topic |
| `Booking` (player books a slot) | `Booking` — an **interviewee** books an interviewer's slot → becomes a scheduled session |
| `gameType` (singles/doubles) | `topic` (DSA / System Design / Behavioral / Frontend / Backend / Other) |
| `Rating` (post-match rating) | `Feedback` — structured rubric (communication, problem-solving, technical depth, each 1–5) + free-text comment, submitted by each side about the other |
| `Invitation` (invite-only booking) | *(dropped — keep it simple, all slots public)* |
| Host/player roles | **interviewer** / **interviewee** roles, per user (a user can hold either or both — chosen when creating vs. booking a slot) |
| Revenue/payout fields on Booking | *(dropped — no money involved)* |
| `HostEarnings` page | *(dropped)* |
| Video call | New: Jitsi room auto-generated per confirmed `Booking`, embedded on a `Session` page |
| `storage.services.js` (multer → ImageKit) | Kept as-is, used only for `User.avatarUrl` (profile picture upload) |

---

## 3. Folder structure (mirrors SmashSlot exactly)

```
interview-scheduling/
├── server/
│   ├── .env.sample
│   ├── index.js                        # app bootstrap, CORS, routes, error handler, DB connect
│   ├── package.json
│   ├── controllers.js/
│   │   └── user.controller.js          # auth logic (register/login/logout/me)
│   ├── middleware/
│   │   └── authMiddleware.js           # verifyJWT + role guards (interviewer/interviewee)
│   ├── models/
│   │   ├── User.js                     # name, email, password, roles[], bio, avatarUrl
│   │   ├── Slot.js                     # interviewer, date, startTime, endTime, topic, isAvailable
│   │   ├── Booking.js                  # slot, interviewer, interviewee, status, jitsiRoom
│   │   └── Feedback.js                 # booking, from, to, ratings{}, comment
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth/*
│   │   ├── userRoutes.js               # /api/users/*  (profile, avatar upload via multer, my sessions)
│   │   ├── slotRoutes.js               # /api/slots/*  (create/list/delete open slots)
│   │   ├── bookingRoutes.js            # /api/bookings/* (book a slot, cancel, list mine)
│   │   └── feedbackRoutes.js           # /api/feedback/* (submit + fetch for a booking)
│   ├── services/
│   │   ├── slotCleanup.services.js     # purge past/expired unbooked slots (setInterval, same pattern)
│   │   └── storage.services.js         # multer buffer → ImageKit upload, used for avatars only
│   └── utils/
│       ├── ApiError.js
│       ├── ApiResponse.js
│       └── asyncHandler.js
│
└── client/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                      # routes
        ├── index.js
        ├── context/
        │   └── AuthContext.js
        ├── services/
        │   └── api.js                  # axios instance
        ├── components/
        │   ├── Navbar.js
        │   ├── SlotCard.js             # renders one open slot
        │   ├── StarRating.js           # reused as-is for the rubric's 1-5 fields
        │   └── Dialog.js               # confirm/cancel modal, reused as-is
        ├── pages/
        │   ├── Home.js                 # landing page
        │   ├── Login.js / Register.js
        │   ├── Dashboard.js            # upcoming sessions (as interviewer & interviewee)
        │   ├── FindSlots.js            # browse/filter open slots by topic → book one
        │   ├── ManageSlots.js          # interviewer: create/cancel own open slots
        │   ├── Session.js              # the Jitsi video call room for a confirmed booking
        │   ├── Feedback.js             # rubric form, shown after a session ends
        │   └── UserProfile.js
        └── styles/
            └── main.css
```

This is a 1:1 structural mirror of SmashSlot: same top-level `server/` +
`client/` split, same `controllers.js/` directory quirk, same
`middleware/models/routes/services/utils` breakdown, same
`components/context/pages/services/styles` client breakdown. Files that have
no equivalent need (Court, Invitation, HostEarnings, ImageKit storage
service, revenue utils) are simply omitted rather than repurposed.

---

## 4. Core flows

1. **Auth** — register/login as usual; a user's `roles` array can contain
   `interviewer`, `interviewee`, or both (no separate admin role, per your
   answer).
2. **Interviewer opens a slot** — pick date, start/end time, topic tag →
   `Slot` created, `isAvailable: true`.
3. **Interviewee browses & books** — `FindSlots` page lists open slots,
   filterable by topic → book one → `Booking` created (`status: confirmed`),
   slot marked unavailable, a `jitsiRoom` name generated
   (e.g. `interview-<bookingId>`).
4. **Session** — at/after the scheduled time, both sides open `Session.js`,
   which embeds the Jitsi Meet iframe for that room name. No TURN/STUN
   servers or signaling code to write — Jitsi's public server handles it.
5. **Feedback** — after the call, both interviewer and interviewee fill out
   the rubric (communication / problem-solving / technical depth, 1–5 each)
   + a comment, submitted per SmashSlot's `Rating` pattern but as `Feedback`
   tied to the `Booking`.
6. **Cleanup job** — same `setInterval`-based background job as SmashSlot's
   `slotCleanup.services.js`, purging past unbooked slots and marking past
   bookings completed.

---

## 5. What's intentionally left out (per "keep it simple")

- No payments/pricing, no `Court`/venue concept, no `Invitation` (invite-only
  slots), no admin role or staff pages, no custom WebRTC signaling (Jitsi
  handles it), no skill-based matching algorithm — just browse-and-book.
  Image upload is kept, but scoped to profile pictures only.

---

## Next step

Once you confirm this, I'll scaffold the folders/files (empty or minimal
boilerplate matching SmashSlot's style) and then build out models → auth →
slots/booking → Jitsi session page → feedback, in that order.
