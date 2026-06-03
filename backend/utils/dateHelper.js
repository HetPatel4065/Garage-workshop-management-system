/**
 * Calculate the next service date by adding exactly 6 months to the given date.
 * Handles month/year overflow correctly (e.g., Aug 31 + 6 months = Feb 28/29).
 *
 * Formula: nextServiceDate = serviceDate + 6 months
 *
 * @param {Date|string} startDate - The service date to add 6 months to
 * @returns {Date|null} - The calculated next service date, or null if invalid input
 */
export const calculateNextServiceDate = (startDate) => {
  if (!startDate) return null;

  const date = new Date(startDate);
  if (isNaN(date.getTime())) return null;

  const targetMonth = date.getMonth() + 6;

  // setMonth handles year overflow automatically (e.g., month 13 becomes Jan next year)
  date.setMonth(targetMonth);

  // Handle overflow: if day doesn't exist in target month (e.g., Jan 31 + 1 month)
  // JS Date auto-overflows (Jan 31 + 1 = Mar 3). We clamp to last day of target month instead.
  if (date.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    date.setDate(0); // last day of the previous (target) month
  }

  return date;
};


export const getDayRange = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

