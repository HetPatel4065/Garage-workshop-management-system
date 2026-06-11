export const calculateInvoiceTotals = (partsUsed = [], selectedServices = [], labourCost = 0, gstRate = 18, discountPercent = 0) => {
  const partsTotal = partsUsed.reduce((sum, part) => {
    const price = Number(part.priceAtTimeOfService) || 0;
    const qty = Number(part.quantity) || 0;
    return sum + Math.floor(price * qty);
  }, 0);

  const servicesTotal = selectedServices.reduce((sum, service) => {
    const price = Number(service.priceAtTimeOfService) || 0;
    return sum + Math.floor(price);
  }, 0);

  const labourNum = Math.floor(Number(labourCost));
  const subtotal = partsTotal + servicesTotal + labourNum;

  // Apply Discount
  const discPercent = Number(discountPercent) || 0;
  const discountAmount = Math.floor((subtotal * discPercent) / 100);
  const taxableAmount = subtotal - discountAmount;

  // Apply GST on Taxable Amount
  const gstAmount = Math.floor((taxableAmount * Number(gstRate)) / 100);
  const finalTotal = taxableAmount + gstAmount;

  return {
    partsTotal,
    servicesTotal,
    labour: labourNum,
    subtotal,
    discountPercent: discPercent,
    discountAmount,
    taxableAmount,
    gst: gstAmount,
    finalTotal,
    gstRate: Number(gstRate),
  };
};
