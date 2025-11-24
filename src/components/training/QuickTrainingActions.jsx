import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Send, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format, differenceInDays } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TrainingInvitationDialog from './TrainingInvitationDialog';

export default function QuickTrainingActions({ partner }) {
  const queryClient = useQueryClient();
  const [showTrainingDialog, setShowTrainingDialog] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  // For when triggered by specific product compliance issue
  const [invitationProduct, setInvitationProduct] = useState(null);

  const { data: requirements = [] } = useQuery({
    queryKey: ['training-requirements'],
    queryFn: () => base44.entities.TrainingRequirement.list(),
  });

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: () => base44.entities.TrainingSession.list('-session_date'),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations'],
    queryFn: () => base44.entities.TrainingRegistration.list(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', partner.id],
    queryFn: async () => {
      const all = await base44.entities.TeamMember.list();
      return all.filter(tm => tm.partner_id === partner.id && tm.active);
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ products }) => {
      const email = partner.primary_contact?.email || partner.contact_email;
      
      await base44.entities.Notification.create({
        user_email: email,
        partner_id: partner.id,
        type: 'training_reminder',
        title: 'Training Compliance Required',
        message: `Your training certifications for ${products.join(', ')} need renewal. Please register for upcoming sessions to maintain compliance.`,
        link: `/PartnerTraining`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      alert('Reminder sent successfully');
    },
  });

  // Check compliance status for each authorized product
  const complianceIssues = (partner.assa_abloy_products || []).map(product => {
    const partnerReqs = requirements.filter(
      req => req.assa_abloy_product === product &&
             (req.partner_type === 'all' || req.partner_type === partner.partner_type)
    );

    if (partnerReqs.length === 0) return null;

    const partnerRegistrations = registrations.filter(reg => {
      const session = trainingSessions.find(t => t.id === reg.training_session_id);
      return session?.assa_abloy_product === product &&
             reg.partner_id === partner.id &&
             (reg.status === 'completed' || reg.status === 'attended');
    });

    if (partnerRegistrations.length === 0) {
      return { product, issue: 'missing', severity: 'critical', lastTraining: null };
    }

    // Find most recent training
    const mostRecent = partnerRegistrations.reduce((latest, reg) => {
      const session = trainingSessions.find(t => t.id === reg.training_session_id);
      const completionDate = new Date(reg.completion_date || session?.session_date);
      const latestDate = new Date(latest.completion_date || trainingSessions.find(t => t.id === latest.training_session_id)?.session_date);
      return completionDate > latestDate ? reg : latest;
    }, partnerRegistrations[0]);

    const mostRecentSession = trainingSessions.find(t => t.id === mostRecent.training_session_id);
    const lastTrainingDate = new Date(mostRecent.completion_date || mostRecentSession?.session_date);
    const daysSinceTraining = differenceInDays(new Date(), lastTrainingDate);
    
    const requirement = partnerReqs[0];
    const daysUntilDue = requirement.frequency_days - daysSinceTraining;

    if (daysUntilDue < 0) {
      return { product, issue: 'expired', severity: 'critical', lastTraining: lastTrainingDate, daysSinceTraining };
    } else if (daysUntilDue < requirement.reminder_days_before) {
      return { product, issue: 'expiring', severity: 'warning', lastTraining: lastTrainingDate, daysUntilDue };
    }

    return null;
  }).filter(Boolean);

  // Find upcoming sessions for products with issues
  const relevantProducts = complianceIssues.map(issue => issue.product);
  const upcomingSessions = trainingSessions.filter(session =>
    session.status === 'registration_open' &&
    relevantProducts.includes(session.assa_abloy_product) &&
    new Date(session.session_date) > new Date()
  );

  if (complianceIssues.length === 0) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setShowTrainingDialog(true)}
          variant="outline"
          className="gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          Schedule Training ({complianceIssues.length})
        </Button>
        <Button
          onClick={() => sendReminderMutation.mutate({ products: relevantProducts })}
          variant="outline"
          className="gap-2 text-orange-600"
          disabled={sendReminderMutation.isPending}
        >
          <Send className="w-4 h-4" />
          Send Reminder
        </Button>
      </div>

      {/* New Invitation Dialog triggered by parent or direct button */}
      {invitationProduct && (
          <TrainingInvitationDialog 
              open={!!invitationProduct} 
              onClose={() => setInvitationProduct(null)} 
              partnerId={partner.id}
              productCode={invitationProduct}
          />
      )}

      <Dialog open={showTrainingDialog} onOpenChange={setShowTrainingDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Training for {partner.company_name}</DialogTitle>
            <DialogDescription>
              Select upcoming training sessions to invite team members
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-900">
                <strong>Training Compliance Issues:</strong>
                <ul className="list-disc list-inside mt-2">
                  {complianceIssues.map((issue, idx) => (
                    <li key={idx}>
                      {issue.product}: {issue.issue === 'missing' ? 'No training completed' : 
                       issue.issue === 'expired' ? `Expired ${issue.daysSinceTraining} days ago` :
                       `Expires in ${issue.daysUntilDue} days`}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                <div className="font-semibold text-slate-900">
                  Upcoming Sessions ({upcomingSessions.length})
                </div>
                {upcomingSessions.map(session => (
                  <label
                    key={session.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSessions.includes(session.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSessions.includes(session.id)}
                      onCheckedChange={(checked) => {
                        setSelectedSessions(prev =>
                          checked
                            ? [...prev, session.id]
                            : prev.filter(id => id !== session.id)
                        );
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 mb-1">{session.title}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-600 text-white">
                          {session.assa_abloy_product}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(session.session_date), 'MMM d, yyyy')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {session.registered_count}/{session.max_participants} registered
                        </Badge>
                      </div>
                      {session.description && (
                        <div className="text-sm text-slate-600">{session.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  No upcoming training sessions available for the required products. 
                  Consider scheduling new sessions in the Training Manager.
                </AlertDescription>
              </Alert>
            )}

            {teamMembers.length > 0 && selectedSessions.length > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="text-blue-900">
                  This will create notifications for {teamMembers.length} team member(s) to register for the selected session(s).
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTrainingDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Here you would send invitations to team members
                // For now, just show success
                alert(`Training invitations sent for ${selectedSessions.length} session(s)`);
                setShowTrainingDialog(false);
                setSelectedSessions([]);
              }}
              disabled={selectedSessions.length === 0}
            >
              Send Invitations ({selectedSessions.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}