/**
 * Compute next CUST-#### id from existing customerId strings (numeric max + 1).
 */
export const nextCustomerIdFromExisting = (customerIds = []) => {
  let maxNum = 999;

  for (const id of customerIds) {
    const match = /^CUST-(\d+)$/i.exec(String(id || ""));
    if (!match) continue;
    const num = parseInt(match[1], 10);
    if (!Number.isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  return `CUST-${maxNum + 1}`;
};
