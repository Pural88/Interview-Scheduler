import { Slot } from "../models/Slot.js";
import { Booking } from "../models/Booking.js";

/**
 * A slot stores its day in `date` (midnight) and its finish clock time in
 * `endTime` as "HH:MM". To compare "has it finished yet?" we need three
 * reference points, all derived from the same instant.
 */
const getTimeMarkers = (now) => {
  // Midnight at the start of today.
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Midnight at the start of tomorrow.
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // Right now as "HH:MM", so it can be compared against endTime strings.
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return { todayStart, tomorrowStart, clock: `${hours}:${minutes}` };
};

/**
 * Matches slots that are already over:
 *   - anything dated before today, or
 *   - dated today but whose endTime has already passed.
 */
export const buildExpiredSlotQuery = (now = new Date()) => {
  const { todayStart, tomorrowStart, clock } = getTimeMarkers(now);

  return {
    $or: [
      { date: { $lt: todayStart } },
      {
        date: { $gte: todayStart, $lt: tomorrowStart },
        endTime: { $lte: clock },
      },
    ],
  };
};

/**
 * The opposite: slots that have not happened yet.
 *   - anything dated tomorrow or later, or
 *   - dated today but ending after the current time.
 */
export const buildActiveSlotQuery = (now = new Date()) => {
  const { todayStart, tomorrowStart, clock } = getTimeMarkers(now);

  return {
    $or: [
      { date: { $gte: tomorrowStart } },
      {
        date: { $gte: todayStart, $lt: tomorrowStart },
        endTime: { $gt: clock },
      },
    ],
  };
};

/**
 * Marks confirmed bookings as "completed" once their time has passed.
 * Cancelled bookings are skipped — they never became a real session.
 * Bookings store their own date/endTime, so this still works for slots
 * that have since been deleted.
 *
 * Returns how many bookings were updated.
 */
export const completePastBookings = async (now = new Date()) => {
  const result = await Booking.updateMany(
    {
      status: "confirmed",
      ...buildExpiredSlotQuery(now),
    },
    { $set: { status: "completed" } },
  );

  return result.modifiedCount || 0;
};

/**
 * Deletes expired slots that nobody booked.
 *
 * Expired slots that WERE booked are kept on purpose: Booking documents
 * point at them, and the feedback flow follows booking -> session.
 * Deleting them would wipe session history, so they are just hidden from
 * listings instead (see buildActiveSlotQuery).
 *
 * Returns how many slots were deleted.
 */
export const purgeExpiredSlots = async (now = new Date()) => {
  const result = await Slot.deleteMany({
    ...buildExpiredSlotQuery(now),
    isAvailable: true,
  });

  return result.deletedCount || 0;
};
