// All money in DRIFT is Indian Rupees. Keep formatting in one place.
const nf = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatINR = (n) => `₹${nf.format(Math.round(Number(n) || 0))}`;
