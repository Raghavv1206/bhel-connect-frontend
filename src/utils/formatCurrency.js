// Format numbers as Indian Rupees (INR)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0.00';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '₹0.00';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(numericAmount);
};
