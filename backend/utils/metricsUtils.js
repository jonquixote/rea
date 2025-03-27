// Investment metrics calculation utilities

/**
 * Calculate rent-to-price ratio
 * Formula: (Monthly Rent / Property Price) * 100
 * @param {number} monthlyRent - Estimated monthly rent
 * @param {number} propertyPrice - Property purchase price
 * @returns {number} - Rent-to-price ratio as a percentage
 */
const calculateRentToPriceRatio = (monthlyRent, propertyPrice) => {
  if (!monthlyRent || !propertyPrice || propertyPrice === 0) return 0;
  return ((monthlyRent / propertyPrice) * 100).toFixed(2);
};

/**
 * Calculate square footage to price ratio
 * Formula: Square Footage / Property Price
 * @param {number} squareFootage - Property square footage
 * @param {number} propertyPrice - Property purchase price
 * @returns {number} - Square footage to price ratio
 */
const calculateSqftToPriceRatio = (squareFootage, propertyPrice) => {
  if (!squareFootage || !propertyPrice || propertyPrice === 0) return 0;
  return (squareFootage / propertyPrice).toFixed(4);
};

/**
 * Calculate estimated monthly expenses
 * @param {Object} expenses - Object containing expense values
 * @param {number} expenses.propertyTax - Annual property tax
 * @param {number} expenses.insurance - Annual insurance cost
 * @param {number} expenses.maintenance - Annual maintenance cost (% of property value)
 * @param {number} expenses.vacancy - Vacancy rate (% of rental income)
 * @param {number} expenses.propertyManagement - Property management fee (% of rental income)
 * @param {number} expenses.utilities - Monthly utilities cost
 * @param {number} expenses.hoa - Monthly HOA fees
 * @param {number} propertyPrice - Property purchase price
 * @param {number} monthlyRent - Estimated monthly rent
 * @returns {number} - Total estimated monthly expenses
 */
const calculateMonthlyExpenses = (expenses, propertyPrice, monthlyRent) => {
  if (!expenses || !propertyPrice || !monthlyRent) return 0;
  
  const monthlyPropertyTax = (expenses.propertyTax || 0) / 12;
  const monthlyInsurance = (expenses.insurance || 0) / 12;
  const monthlyMaintenance = propertyPrice * ((expenses.maintenance || 0) / 100) / 12;
  const monthlyVacancy = monthlyRent * ((expenses.vacancy || 0) / 100);
  const monthlyPropertyManagement = monthlyRent * ((expenses.propertyManagement || 0) / 100);
  const monthlyUtilities = expenses.utilities || 0;
  const monthlyHoa = expenses.hoa || 0;
  
  return (
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyMaintenance +
    monthlyVacancy +
    monthlyPropertyManagement +
    monthlyUtilities +
    monthlyHoa
  ).toFixed(2);
};

/**
 * Calculate cash flow
 * Formula: Monthly Rent - Monthly Expenses
 * @param {number} monthlyRent - Estimated monthly rent
 * @param {number} monthlyExpenses - Estimated monthly expenses
 * @returns {number} - Monthly cash flow
 */
const calculateCashFlow = (monthlyRent, monthlyExpenses) => {
  if (!monthlyRent || !monthlyExpenses) return 0;
  return (monthlyRent - monthlyExpenses).toFixed(2);
};

/**
 * Calculate cap rate
 * Formula: (Annual Net Operating Income / Property Price) * 100
 * @param {number} monthlyRent - Estimated monthly rent
 * @param {number} monthlyExpenses - Estimated monthly expenses
 * @param {number} propertyPrice - Property purchase price
 * @returns {number} - Cap rate as a percentage
 */
const calculateCapRate = (monthlyRent, monthlyExpenses, propertyPrice) => {
  if (!monthlyRent || !monthlyExpenses || !propertyPrice || propertyPrice === 0) return 0;
  const annualNOI = (monthlyRent - monthlyExpenses) * 12;
  return ((annualNOI / propertyPrice) * 100).toFixed(2);
};

/**
 * Calculate cash-on-cash return
 * Formula: (Annual Cash Flow / Total Cash Invested) * 100
 * @param {number} monthlyRent - Estimated monthly rent
 * @param {number} monthlyExpenses - Estimated monthly expenses
 * @param {number} downPayment - Down payment amount
 * @param {number} closingCosts - Closing costs
 * @param {number} rehabCosts - Rehabilitation costs
 * @returns {number} - Cash-on-cash return as a percentage
 */
const calculateCashOnCashReturn = (monthlyRent, monthlyExpenses, downPayment, closingCosts, rehabCosts) => {
  if (!monthlyRent || !monthlyExpenses || !downPayment) return 0;
  
  const annualCashFlow = (monthlyRent - monthlyExpenses) * 12;
  const totalCashInvested = downPayment + (closingCosts || 0) + (rehabCosts || 0);
  
  if (totalCashInvested === 0) return 0;
  
  return ((annualCashFlow / totalCashInvested) * 100).toFixed(2);
};

module.exports = {
  calculateRentToPriceRatio,
  calculateSqftToPriceRatio,
  calculateMonthlyExpenses,
  calculateCashFlow,
  calculateCapRate,
  calculateCashOnCashReturn
};
