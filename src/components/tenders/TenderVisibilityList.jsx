import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function TenderVisibilityList({ tender, partners, solutions, verticals }) {
  const { data: discounts = [] } = useQuery({
    queryKey: ['productGroupDiscounts'],
    queryFn: () => base44.entities.ProductGroupDiscount.list(),
  });

  const calculateExpectedMargin = (partner, tenderProducts) => {
    if (!tenderProducts || tenderProducts.length === 0) return null;
    
    const relevantDiscounts = discounts.filter(d => 
      d.partner_type === partner.partner_type &&
      d.active &&
      tenderProducts.includes(d.assa_abloy_product)
    );

    if (relevantDiscounts.length === 0) return null;

    const avgDiscount = relevantDiscounts.reduce((sum, d) => sum + d.base_discount_percentage, 0) / relevantDiscounts.length;
    return avgDiscount;
  };

  let eligiblePartners = [];
  
  if (tender.invitation_strategy === 'open') {
    eligiblePartners = partners.filter(p => p.status === 'active');
  } else if (tender.invitation_strategy === 'invited_only') {
    eligiblePartners = partners.filter(p => 
      tender.invited_partners?.includes(p.id)
    );
  } else if (tender.invitation_strategy === 'qualified_only') {
    eligiblePartners = partners.filter(p => {
      if (p.status !== 'active') return false;
      
      const tenderVertical = verticals.find(v => v.id === tender.vertical_id);
      const hasVertical = tenderVertical ? p.verticals?.includes(tenderVertical.code) : false;
      
      const hasSolutions = tender.required_solutions?.some(solId => {
        const solution = solutions.find(s => s.id === solId);
        return solution && p.solutions?.includes(solution.code);
      });
      
      return hasVertical && hasSolutions;
    });
  } else {
    eligiblePartners = partners.filter(p => p.status === 'active');
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Partner Visibility</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Partners who can see and respond to this tender based on the invitation strategy
        </p>
      </CardHeader>
      <CardContent>
        {eligiblePartners.length > 0 ? (
          <div className="space-y-3">
            {eligiblePartners.map(partner => {
              const expectedMargin = calculateExpectedMargin(partner, tender.assa_abloy_products);
              
              return (
                <div key={partner.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-900">{partner.company_name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Tier: <Badge className="ml-1">{partner.tier}</Badge>
                        <span className="mx-2">•</span>
                        Type: <Badge variant="outline" className="ml-1">{partner.partner_type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Contact</div>
                      <div className="text-sm text-slate-700">{partner.primary_contact?.email || partner.contact_email}</div>
                    </div>
                  </div>
                  
                  {tender.estimated_gross_value && expectedMargin !== null && (
                    <Alert className="bg-green-50 border-green-200">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-900 text-sm">
                        {(() => {
                          const variance = tender.budget_min && tender.budget_max 
                            ? ((tender.budget_max - tender.budget_min) / ((tender.budget_min + tender.budget_max) / 2)) / 2
                            : 0.1;
                          const minGrossValue = tender.estimated_gross_value * (1 - variance);
                          const maxGrossValue = tender.estimated_gross_value * (1 + variance);
                          const minMargin = (minGrossValue * expectedMargin) / 100;
                          const maxMargin = (maxGrossValue * expectedMargin) / 100;
                          
                          return (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <span><strong>ASSA ABLOY Value Range:</strong></span>
                                <span className="font-semibold">
                                  €{(minGrossValue / 1000).toFixed(0)}K - €{(maxGrossValue / 1000).toFixed(0)}K
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span><strong>Expected Margin Range ({expectedMargin.toFixed(1)}%):</strong></span>
                                <span className="font-semibold">
                                  €{(minMargin / 1000).toFixed(0)}K - €{(maxMargin / 1000).toFixed(0)}K
                                </span>
                              </div>
                              <div className="text-xs text-green-700 mt-2">
                                Based on avg. discount for selected ASSA ABLOY products & budget variance
                              </div>
                            </>
                          );
                        })()}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-900">
                Total: {eligiblePartners.length} partner(s) can see this tender
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-500 mb-2">No partners match the visibility criteria</div>
            <div className="text-sm text-slate-400">
              {tender.invitation_strategy === 'invited_only' && 'No partners have been invited'}
              {tender.invitation_strategy === 'qualified_only' && 'No partners meet the required qualifications (vertical + solutions)'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}