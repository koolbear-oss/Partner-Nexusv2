import { differenceInDays } from 'date-fns';

/**
 * Validates if a partner has valid certifications for required ASSA ABLOY products
 * @param {Array} requiredProducts - Array of ASSA ABLOY product codes from tender
 * @param {Array} certifications - Array of Certification entities for the partner
 * @param {Array} allCertifications - All certification records from database
 * @returns {Object} Validation result with details
 */
export function validatePartnerCertifications(requiredProducts, partnerTeamMembers, allCertifications) {
  if (!requiredProducts || requiredProducts.length === 0) {
    return { valid: true, missingProducts: [], expiredProducts: [], expiringProducts: [] };
  }

  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Get all certifications for this partner's team members
  const partnerCertIds = partnerTeamMembers?.flatMap(tm => tm.certifications || []) || [];
  const partnerCerts = allCertifications.filter(cert => partnerCertIds.includes(cert.id));

  const missingProducts = [];
  const expiredProducts = [];
  const expiringProducts = [];

  requiredProducts.forEach(productCode => {
    // Find certifications for this product
    const productCerts = partnerCerts.filter(cert => {
      // Match certification to product (assuming certification_name or code contains product)
      return cert.certification_code?.toLowerCase().includes(productCode.toLowerCase()) ||
             cert.certification_name?.toLowerCase().includes(productCode.toLowerCase());
    });

    if (productCerts.length === 0) {
      missingProducts.push(productCode);
      return;
    }

    // Check if any cert is valid
    const validCert = productCerts.find(cert => {
      const expiryDate = new Date(cert.expiry_date);
      return cert.status === 'valid' && expiryDate > today;
    });

    if (!validCert) {
      // Check if expired or expiring soon
      const hasExpired = productCerts.some(cert => {
        const expiryDate = new Date(cert.expiry_date);
        return expiryDate <= today;
      });

      if (hasExpired) {
        expiredProducts.push(productCode);
      } else {
        missingProducts.push(productCode);
      }
    } else {
      // Check if expiring within 30 days
      const expiryDate = new Date(validCert.expiry_date);
      if (expiryDate <= thirtyDaysFromNow) {
        expiringProducts.push(productCode);
      }
    }
  });

  return {
    valid: missingProducts.length === 0 && expiredProducts.length === 0,
    fullyCompliant: missingProducts.length === 0 && expiredProducts.length === 0 && expiringProducts.length === 0,
    missingProducts,
    expiredProducts,
    expiringProducts,
  };
}

/**
 * Checks if a tender is urgent (project starts in less than 30 days)
 * @param {string} projectStartDate - ISO date string
 * @returns {boolean}
 */
export function isTenderUrgent(projectStartDate) {
  if (!projectStartDate) return false;
  
  const startDate = new Date(projectStartDate);
  const today = new Date();
  const daysUntilStart = differenceInDays(startDate, today);
  
  return daysUntilStart < 30 && daysUntilStart >= 0;
}

/**
 * Gets days until project starts
 * @param {string} projectStartDate - ISO date string
 * @returns {number}
 */
export function getDaysUntilStart(projectStartDate) {
  if (!projectStartDate) return null;
  
  const startDate = new Date(projectStartDate);
  const today = new Date();
  return differenceInDays(startDate, today);
}

/**
 * Finds upcoming training sessions for specific products
 * @param {Array} products - Array of product codes
 * @param {Array} trainingSessions - Array of TrainingSession entities
 * @returns {Array} Relevant upcoming training sessions
 */
export function findUpcomingTrainingSessions(products, trainingSessions) {
  const today = new Date();
  
  return trainingSessions.filter(session => {
    const sessionDate = new Date(session.session_date);
    const isUpcoming = sessionDate > today && session.status === 'registration_open';
    const isRelevant = products.some(productCode => 
      session.assa_abloy_product?.toLowerCase() === productCode.toLowerCase()
    );
    
    return isUpcoming && isRelevant;
  }).sort((a, b) => new Date(a.session_date) - new Date(b.session_date));
}