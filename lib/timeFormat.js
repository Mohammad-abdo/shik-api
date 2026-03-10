/**
 * Convert 24-hour time string (HH:mm) to 12-hour format (hh:mm AM/PM).
 * Returns the original value unchanged if it can't be parsed.
 */
function to12Hour(time) {
  if (!time || typeof time !== 'string') return time;
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

module.exports = { to12Hour };
