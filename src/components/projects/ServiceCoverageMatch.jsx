import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, MapPin, XCircle } from 'lucide-react';
import { inferServiceRequirements, checkPartnerServiceMatch } from '../utils/regionInference';

export default function ServiceCoverageMatch({ partner, project, serviceCoverageOptions = [], showDetails = true }) {
  const checkCoverageMatch = () => {
    if (!project.required_service_coverage || project.required_service_coverage.length === 0) {
      return { status: 'unknown', message: 'No coverage requirements specified' };
    }

    if (!partner.service_coverage || partner.service_coverage.length === 0) {
      return { status: 'mismatch', message: 'Partner has no coverage defined' };
    }

    // Define coverage hierarchy (what covers what)
    const coverageHierarchy = {
      'belgium_all': ['belgium_fr', 'belgium_nl', 'wallonia_fr', 'flanders_nl', 'brussels_bilingual', 'brussels_fr', 'brussels_nl'],
      'belgium_fr': ['wallonia_fr', 'brussels_fr'],
      'belgium_nl': ['flanders_nl', 'brussels_nl'],
      'brussels_bilingual': ['brussels_fr', 'brussels_nl']
    };

    const canCover = (partnerCoverage, requiredCoverage) => {
      // Direct match
      if (partnerCoverage.includes(requiredCoverage)) return true;
      
      // Check hierarchy - if partner has broader coverage
      for (const coverage of partnerCoverage) {
        if (coverageHierarchy[coverage]?.includes(requiredCoverage)) {
          return true;
        }
      }
      
      return false;
    };

    const allCovered = project.required_service_coverage.every(required =>
      canCover(partner.service_coverage, required)
    );

    const partiallyCovered = project.required_service_coverage.some(required =>
      canCover(partner.service_coverage, required)
    );

    if (allCovered) {
      return { status: 'match', message: 'Full coverage match' };
    } else if (partiallyCovered) {
      return { status: 'partial', message: 'Partial coverage match' };
    } else {
      return { status: 'mismatch', message: 'No coverage match' };
    }
  };

  const checkLanguageMatch = () => {
    if (!project.project_language) {
      return { status: 'unknown', message: 'No language specified' };
    }

    if (!partner.language_preferences || partner.language_preferences.length === 0) {
      return { status: 'unknown', message: 'No languages specified' };
    }

    if (project.project_language === 'bilingual') {
      const hasBothLanguages = partner.language_preferences.includes('nl') && 
                               partner.language_preferences.includes('fr');
      return hasBothLanguages 
        ? { status: 'match', message: 'Bilingual capable' }
        : { status: 'partial', message: 'Not fully bilingual' };
    }

    const hasLanguage = partner.language_preferences.includes(project.project_language);
    return hasLanguage
      ? { status: 'match', message: 'Language match' }
      : { status: 'mismatch', message: 'Language mismatch' };
  };

  // Use smart matching logic
  const smartMatch = checkPartnerServiceMatch(partner, project);
  const locationInference = project.project_location?.postal_code 
    ? inferServiceRequirements(project.project_location)
    : null;
  
  const languageResult = checkLanguageMatch();

  const getStatusColor = (status) => {
    switch (status) {
      case 'match': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'mismatch': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'match': return <CheckCircle2 className="w-4 h-4" />;
      case 'partial': return <AlertCircle className="w-4 h-4" />;
      case 'mismatch': return <XCircle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getLabelForCoverage = (value) => {
    return serviceCoverageOptions.find(opt => opt.value === value)?.label || value;
  };

  const matchStatus = smartMatch.canServe === true ? 'match' : smartMatch.canServe === false ? 'mismatch' : 'partial';

  return (
    <div className="space-y-3">
      {/* Location inference display */}
      {locationInference?.region && (
        <div className="p-2 bg-blue-50 rounded border border-blue-200 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-blue-900">
              {project.project_location.city || locationInference.region}
            </div>
            <div className="text-xs text-blue-700">{locationInference.notes}</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge className={`${getStatusColor(matchStatus)} border flex items-center gap-1`}>
          {getStatusIcon(matchStatus)}
          <span className="text-xs">{smartMatch.reason}</span>
        </Badge>
        <Badge className={`${getStatusColor(languageResult.status)} border flex items-center gap-1`}>
          {getStatusIcon(languageResult.status)}
          <span className="text-xs">{languageResult.message}</span>
        </Badge>
      </div>

      {showDetails && (
        <>
          {project.required_service_coverage && project.required_service_coverage.length > 0 && (
            <div className="text-sm pt-2 border-t border-slate-200">
              <div className="font-medium text-slate-700 mb-1 text-xs">Explicit Requirements:</div>
              <div className="flex flex-wrap gap-1">
                {project.required_service_coverage.map(coverage => (
                  <Badge key={coverage} variant="outline" className="text-xs">
                    {getLabelForCoverage(coverage)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {locationInference?.suggestedCoverage && locationInference.suggestedCoverage.length > 0 && (
            <div className="text-sm pt-2 border-t border-slate-200">
              <div className="font-medium text-slate-700 mb-1 text-xs">Inferred from Location:</div>
              <div className="flex flex-wrap gap-1">
                {locationInference.suggestedCoverage.map(coverage => (
                  <Badge key={coverage} variant="outline" className="text-xs bg-blue-50 border-blue-200">
                    {getLabelForCoverage(coverage)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {partner.service_coverage && partner.service_coverage.length > 0 && (
            <div className="text-sm pt-2 border-t border-slate-200">
              <div className="font-medium text-slate-700 mb-1 text-xs">Partner Covers:</div>
              <div className="flex flex-wrap gap-1">
                {partner.service_coverage.map(coverage => (
                  <Badge key={coverage} variant="outline" className="text-xs bg-green-50 border-green-200">
                    {getLabelForCoverage(coverage)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}