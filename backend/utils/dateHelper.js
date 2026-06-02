export const calculateNextServiceDate = (startDate, intervalMonths) => {
  if (!startDate) return null;
  
  const date = new Date(startDate);
  if (isNaN(date.getTime())) return null;

  const currentMonth = date.getMonth();
  const targetMonth = currentMonth + intervalMonths;
  
  // Set the month and handle year overflow automatically by JS Date
  date.setMonth(targetMonth);

  // If the date overflowed (e.g., Jan 31 + 1 month became March 3 because Feb has 28 days)
  // we reset it to the last day of the target month.
  if (date.getMonth() !== (targetMonth % 12 + 12) % 12) {
    date.setDate(0); // Set to the last day of the previous month (which is the target month)
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
