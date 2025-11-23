import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function PartnerTrainingStatus({ partner }) {
  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: () => base44.entities.TrainingSession.list(),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations'],
    queryFn: () => base44.entities.TrainingRegistration.list(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', partner.id],
    queryFn: async () => {
      const all = await base44.entities.TeamMember.list();
      return all.filter(tm => tm.partner_id === partner.id);
    },
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assa-abloy-products'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'assa_abloy_products' && d.active);
    },
  });

  const getProductLabel = (value) => {
    return assaAbloyProducts.find(p => p.value === value)?.label || value;
  };

  const getTrainingStatusForProduct = (productValue) => {
    const partnerRegistrations = registrations.filter(reg => {
      const session = trainingSessions.find(t => t.id === reg.training_session_id);
      return session?.assa_abloy_product === productValue;
    });

    const completedRegistrations = partnerRegistrations.filter(reg => 
      reg.status === 'completed' || reg.status === 'attended'
    );

    if (completedRegistrations.length === 0) {
      return { status: 'missing', color: 'red', icon: AlertTriangle, message: 'No training completed' };
    }

    // Find most recent completed training
    const mostRecent = completedRegistrations.reduce((latest, reg) => {
      const session = trainingSessions.find(t => t.id === reg.training_session_id);
      const completionDate = new Date(reg.completion_date || session?.session_date);
      const latestDate = new Date(latest.completion_date || trainingSessions.find(t => t.id === latest.training_session_id)?.session_date);
      return completionDate > latestDate ? reg : latest;
    }, completedRegistrations[0]);

    const mostRecentSession = trainingSessions.find(t => t.id === mostRecent.training_session_id);
    const completionDate = new Date(mostRecent.completion_date || mostRecentSession?.session_date);
    const validityMonths = mostRecentSession?.certification_valid_for_months || 12;
    const expiryDate = new Date(completionDate);
    expiryDate.setMonth(expiryDate.getMonth() + validityMonths);
    
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());

    if (daysUntilExpiry < 0) {
      return { 
        status: 'expired', 
        color: 'red', 
        icon: AlertTriangle, 
        message: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
        expiryDate 
      };
    } else if (daysUntilExpiry < 60) {
      return { 
        status: 'expiring', 
        color: 'yellow', 
        icon: Clock, 
        message: `Expires in ${daysUntilExpiry} days`,
        expiryDate 
      };
    } else {
      return { 
        status: 'valid', 
        color: 'green', 
        icon: CheckCircle2, 
        message: `Valid until ${format(expiryDate, 'MMM d, yyyy')}`,
        expiryDate 
      };
    }
  };

  const authorizedProducts = partner.assa_abloy_products || [];

  if (authorizedProducts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Training Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">No ASSA ABLOY products authorized yet</p>
        </CardContent>
      </Card>
    );
  }

  const trainingStatuses = authorizedProducts.map(productValue => ({
    product: productValue,
    ...getTrainingStatusForProduct(productValue)
  }));

  const criticalCount = trainingStatuses.filter(t => t.status === 'missing' || t.status === 'expired').length;
  const warningCount = trainingStatuses.filter(t => t.status === 'expiring').length;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Training Compliance Status
          </CardTitle>
          {criticalCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200 border">
              {criticalCount} Critical
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {trainingStatuses.map(({ product, status, color, icon: Icon, message }) => (
          <div key={product} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 text-${color}-600`} />
              <div>
                <div className="font-semibold text-slate-900">{getProductLabel(product)}</div>
                <div className={`text-sm text-${color}-700`}>{message}</div>
              </div>
            </div>
            <Badge className={`bg-${color}-100 text-${color}-800 border-${color}-200 border`}>
              {status}
            </Badge>
          </div>
        ))}

        {(criticalCount > 0 || warningCount > 0) && (
          <div className={`mt-4 p-3 rounded-lg border ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className={`text-sm ${criticalCount > 0 ? 'text-red-900' : 'text-yellow-900'} font-semibold`}>
              {criticalCount > 0 ? '⚠️ Action Required' : '⏰ Upcoming Renewals'}
            </p>
            <p className={`text-sm ${criticalCount > 0 ? 'text-red-700' : 'text-yellow-700'} mt-1`}>
              {criticalCount > 0 
                ? 'Training compliance is required to maintain product authorization and bonus eligibility. Schedule training sessions immediately.'
                : 'Training certifications expiring soon. Plan renewals to maintain compliance.'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}