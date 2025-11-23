/**
 * Belgian Region and Language Inference Utilities
 * Maps postal codes, cities, and addresses to regions and language requirements
 */

// Postal code ranges for Belgian regions
const POSTAL_CODE_RANGES = {
  flanders: [
    { min: 1000, max: 1299 }, // Brussels region (often Flemish preference)
    { min: 1500, max: 1999 }, // Flemish Brabant
    { min: 2000, max: 2999 }, // Antwerp
    { min: 3000, max: 3499 }, // Flemish Brabant
    { min: 8000, max: 8999 }, // West Flanders
    { min: 9000, max: 9999 }, // East Flanders
  ],
  wallonia: [
    { min: 1300, max: 1499 }, // Walloon Brabant
    { min: 4000, max: 4999 }, // Liège
    { min: 5000, max: 5999 }, // Namur
    { min: 6000, max: 6599 }, // Hainaut
    { min: 6600, max: 6999 }, // Luxembourg
    { min: 7000, max: 7999 }, // Hainaut
  ],
  brussels: [
    { min: 1000, max: 1299 }, // Brussels Capital Region
  ]
};

// Brussels specific postal codes (bilingual requirement)
const BRUSSELS_POSTAL_CODES = [
  1000, 1020, 1030, 1040, 1050, 1060, 1070, 1080, 1081, 1082, 
  1083, 1090, 1120, 1130, 1140, 1150, 1160, 1170, 1180, 1190, 1200, 1210
];

/**
 * Infer region from postal code
 * @param {string|number} postalCode 
 * @returns {'flanders'|'wallonia'|'brussels'|null}
 */
export function inferRegionFromPostalCode(postalCode) {
  if (!postalCode) return null;
  
  const code = parseInt(postalCode);
  if (isNaN(code)) return null;

  // Check if Brussels
  if (BRUSSELS_POSTAL_CODES.includes(code)) {
    return 'brussels';
  }

  // Check Wallonia first (more specific ranges)
  for (const range of POSTAL_CODE_RANGES.wallonia) {
    if (code >= range.min && code <= range.max) {
      return 'wallonia';
    }
  }

  // Check Flanders
  for (const range of POSTAL_CODE_RANGES.flanders) {
    if (code >= range.min && code <= range.max) {
      return 'flanders';
    }
  }

  return null;
}

/**
 * Infer likely service coverage based on project location
 * @param {object} location - {city, postal_code, country}
 * @returns {object} - {region, suggestedCoverage: [], primaryLanguage, notes}
 */
export function inferServiceRequirements(location) {
  if (!location || location.country !== 'Belgium') {
    return { region: null, suggestedCoverage: [], primaryLanguage: null, notes: null };
  }

  const region = inferRegionFromPostalCode(location.postal_code);

  if (!region) {
    return { region: null, suggestedCoverage: [], primaryLanguage: null, notes: 'Could not determine region' };
  }

  const result = {
    region,
    suggestedCoverage: [],
    primaryLanguage: null,
    notes: null
  };

  switch (region) {
    case 'wallonia':
      result.suggestedCoverage = ['wallonia_fr', 'belgium_all'];
      result.primaryLanguage = 'fr';
      result.notes = 'Wallonia region - French language support highly recommended';
      break;
    
    case 'flanders':
      result.suggestedCoverage = ['flanders_nl', 'belgium_all'];
      result.primaryLanguage = 'nl';
      result.notes = 'Flanders region - Dutch language support highly recommended';
      break;
    
    case 'brussels':
      result.suggestedCoverage = ['brussels_bilingual', 'belgium_all'];
      result.primaryLanguage = 'bilingual';
      result.notes = 'Brussels region - Bilingual support required. Consider: NL for administration, FR for on-site services';
      break;
  }

  return result;
}

/**
 * Check if a partner can serve a project based on location and/or explicit coverage
 * @param {object} partner - Partner entity with service_coverage array
 * @param {object} project - Project with project_location and/or required_service_coverage
 * @returns {object} - {canServe: boolean, matchType: string, confidence: string, reason: string}
 */
export function checkPartnerServiceMatch(partner, project) {
  if (!partner?.service_coverage || partner.service_coverage.length === 0) {
    return {
      canServe: false,
      matchType: 'no_coverage',
      confidence: 'none',
      reason: 'Partner has no service coverage defined'
    };
  }

  // Check explicit coverage requirements first
  if (project.required_service_coverage && project.required_service_coverage.length > 0) {
    const hasMatch = project.required_service_coverage.some(req => 
      partner.service_coverage.includes(req) || 
      partner.service_coverage.includes('belgium_all')
    );
    
    if (hasMatch) {
      return {
        canServe: true,
        matchType: 'explicit',
        confidence: 'high',
        reason: 'Partner explicitly covers required regions'
      };
    }
  }

  // Infer from location if available
  if (project.project_location?.postal_code) {
    const inference = inferServiceRequirements(project.project_location);
    
    if (inference.region) {
      // Check if partner covers the inferred region
      const coverageMatch = inference.suggestedCoverage.some(coverage => 
        partner.service_coverage.includes(coverage)
      );

      if (coverageMatch) {
        return {
          canServe: true,
          matchType: 'inferred',
          confidence: 'medium',
          reason: `Partner covers ${inference.region} region (inferred from ${project.project_location.city || 'location'})`
        };
      }

      return {
        canServe: false,
        matchType: 'inferred_mismatch',
        confidence: 'medium',
        reason: `Project location in ${inference.region}, but partner doesn't cover this region`
      };
    }
  }

  // No clear match
  return {
    canServe: null,
    matchType: 'unclear',
    confidence: 'low',
    reason: 'No location or coverage specified - cannot determine match'
  };
}

/**
 * Get human-readable region name
 */
export function getRegionLabel(region) {
  const labels = {
    flanders: 'Flanders',
    wallonia: 'Wallonia',
    brussels: 'Brussels Capital Region'
  };
  return labels[region] || region;
}

/**
 * Get language label
 */
export function getLanguageLabel(lang) {
  const labels = {
    nl: 'Dutch',
    fr: 'French',
    en: 'English',
    bilingual: 'Bilingual (NL/FR)'
  };
  return labels[lang] || lang;
}