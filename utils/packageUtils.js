/**
 * Calculate duration in days based on package type and period
 * @param {string} packageType - 'fixed', 'monthly', 'weekly', 'yearly'
 * @param {number} period - The duration number
 * @param {string} periodUnit - 'days', 'weeks', 'months', 'years'
 * @returns {number} Duration in days
 */
function calculateDurationInDays(packageType, period, periodUnit) {
  if (!period) return 30; // default
  
  switch (periodUnit) {
    case 'days':
      return period;
    case 'weeks':
      return period * 7;
    case 'months':
      return period * 30; // approximation
    case 'years':
      return period * 365; // approximation
    default:
      return period * 30;
  }
}

/**
 * Calculate end date based on package details
 * @param {Date} startDate - Subscription start date
 * @param {Object} pkg - Package object with type, period, periodUnit
 * @returns {Date} Calculated end date
 */
function calculateEndDate(startDate, pkg) {
  const endDate = new Date(startDate);
  
  if (pkg.packageType !== 'fixed' && pkg.period && pkg.periodUnit) {
    switch (pkg.periodUnit) {
      case 'days':
        endDate.setDate(endDate.getDate() + pkg.period);
        break;
      case 'weeks':
        endDate.setDate(endDate.getDate() + (pkg.period * 7));
        break;
      case 'months':
        endDate.setMonth(endDate.getMonth() + pkg.period);
        break;
      case 'years':
        endDate.setFullYear(endDate.getFullYear() + pkg.period);
        break;
      default:
        endDate.setDate(endDate.getDate() + (pkg.duration || 30));
    }
  } else {
    endDate.setDate(endDate.getDate() + (pkg.duration || 30));
  }
  
  return endDate;
}

/**
 * Format package for API response
 * @param {Object} pkg - Raw package from database
 * @returns {Object} Formatted package
 */
function formatPackageResponse(pkg) {
  if (pkg.features && typeof pkg.features === 'string') {
    pkg.features = JSON.parse(pkg.features);
  }
  if (pkg.featuresAr && typeof pkg.featuresAr === 'string') {
    pkg.featuresAr = JSON.parse(pkg.featuresAr);
  }
  return pkg;
}

module.exports = {
  calculateDurationInDays,
  calculateEndDate,
  formatPackageResponse
};