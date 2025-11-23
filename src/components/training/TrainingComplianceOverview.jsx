import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export default function TrainingComplianceOverview({ 
  partners, 
  trainingSessions, 
  registrations, 
  assaAbloyProducts 
}) {
  // Calculate compliance statistics
  const calculateCompliance = () => {
    let totalRequired = 0;
    let totalCompliant = 0;
    let criticalNonCompliance = 0;
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    partners.forEach(partner => {
      if (partner.status !== 'active') return;
      
      const authorizedProducts = partner.assa_abloy_products || [];
      
      authorizedProducts.forEach(productValue => {
        totalRequired++;
        
        // Check if any team member has completed training in the last 12 months
        const hasValidTraining = registrations.some(reg => {
          const session = trainingSessions.find(t => t.id === reg.training_session_id);
          if (!session || session.assa_abloy_product !== productValue) return false;
          
          // Check if registration is completed and within validity period
          if (reg.status === 'completed' || reg.status === 'attended') {
            const completionDate = new Date(reg.completion_date || session.session_date);
            const validityMonths = session.certification_valid_for_months || 12;
            const expiryDate = new Date(completionDate);
            expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
            
            return expiryDate > new Date();
          }
          return false;
        });
        
        if (hasValidTraining) {
          totalCompliant++;
        } else {
          criticalNonCompliance++;
        }
      });
    });

    const complianceRate = totalRequired > 0 ? (totalCompliant / totalRequired) * 100 : 100;
    
    return {
      totalRequired,
      totalCompliant,
      criticalNonCompliance,
      complianceRate
    };
  };

  const stats = calculateCompliance();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="shadow-sm border-l-4 border-l-blue-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overall Compliance</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {stats.complianceRate.toFixed(0)}%
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${stats.complianceRate >= 80 ? 'text-green-400' : 'text-amber-400'}`} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-green-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Compliant</p>
              <p className="text-3xl font-bold text-green-700 mt-1">
                {stats.totalCompliant}
              </p>
              <p className="text-xs text-slate-500">of {stats.totalRequired}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-red-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Non-Compliant</p>
              <p className="text-3xl font-bold text-red-700 mt-1">
                {stats.criticalNonCompliance}
              </p>
              <p className="text-xs text-slate-500">require training</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-purple-600">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Partners</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">
                {partners.filter(p => p.status === 'active').length}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </CardContent>
      </Card>

      {stats.criticalNonCompliance > 0 && (
        <Card className="col-span-full bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  Critical: {stats.criticalNonCompliance} product authorizations lack valid training
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Partners selling ASSA ABLOY products without valid annual certification. This affects bonus eligibility and should be addressed immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}