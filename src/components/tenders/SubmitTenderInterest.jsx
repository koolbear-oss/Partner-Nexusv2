import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertCircle, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { 
  validatePartnerCertifications, 
  isTenderUrgent, 
  getDaysUntilStart,
  findUpcomingTrainingSessions 
} from '../utils/certificationValidation';

export default function SubmitTenderInterest({ open, onClose, tender, partnerId }) {
  const queryClient = useQueryClient();
  const [selectedTrainingSessions, setSelectedTrainingSessions] = useState([]);
  const [acknowledgeTraining, setAcknowledgeTraining] = useState(false);

  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', partnerId],
    queryFn: async () => {
      const members = await base44.entities.TeamMember.list();
      return members.filter(m => m.partner_id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: allCertifications = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list(),
  });

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.TrainingSession.list(),
  });

  // Validate certifications
  const certValidation = validatePartnerCertifications(
    tender.assa_abloy_products || [],
    teamMembers,
    allCertifications
  );

  const isUrgent = isTenderUrgent(tender.project_start_date);
  const daysUntilStart = getDaysUntilStart(tender.project_start_date);
  
  // Find relevant training sessions
  const relevantTrainings = findUpcomingTrainingSessions(
    [...(certValidation.missingProducts || []), ...(certValidation.expiredProducts || [])],
    trainingSessions
  );

  const needsTraining = !certValidation.valid;
  const canProceedWithTraining = !isUrgent || (needsTraining && selectedTrainingSessions.length > 0);

  const submitInterestMutation = useMutation({
    mutationFn: async () => {
      const newResponse = {
        partner_id: partnerId,
        submitted_at: new Date().toISOString(),
        status: 'interest_submitted',
        certification_status: {
          valid: certValidation.valid,
          urgent_project: isUrgent,
          missing_products: certValidation.missingProducts,
          expired_products: certValidation.expiredProducts,
          expiring_products: certValidation.expiringProducts,
        },
        committed_training_sessions: selectedTrainingSessions,
      };

      const updatedResponses = [...(tender.responses || []), newResponse];
      return base44.entities.Tender.update(tender.id, { responses: updatedResponses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      onClose();
    },
  });

  const toggleTraining = (sessionId) => {
    setSelectedTrainingSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Express Interest in Tender
          </DialogTitle>
          <DialogDescription>
            {isUrgent 
              ? `Project starts in ${daysUntilStart} days - Certification requirements apply`
              : 'Submit your interest to calculate a proposal for this project'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Certification Status */}
          {isUrgent && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Urgent Project:</strong> This project starts in less than 30 days. 
                Valid certifications are required to submit a final proposal.
              </AlertDescription>
            </Alert>
          )}

          {needsTraining && (
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Certification Requirements Not Met</h3>
                  
                  {certValidation.missingProducts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-red-800 font-medium">Missing Certifications:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {certValidation.missingProducts.map(product => (
                          <Badge key={product} className="bg-red-100 text-red-800">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {certValidation.expiredProducts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm text-red-800 font-medium">Expired Certifications:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {certValidation.expiredProducts.map(product => (
                          <Badge key={product} className="bg-red-100 text-red-800">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {isUrgent && (
                    <p className="text-sm text-red-800 mt-2">
                      ⚠️ You must register for upcoming training to express interest in this urgent project.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {certValidation.expiringProducts.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900">
                <strong>Certifications Expiring Soon:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {certValidation.expiringProducts.map(product => (
                    <Badge key={product} variant="outline" className="bg-yellow-100 text-yellow-800">
                      {product}
                    </Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Training Registration Requirement */}
          {needsTraining && relevantTrainings.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Register for Required Training
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                Select the training session(s) you commit to attending:
              </p>
              
              <div className="space-y-2">
                {relevantTrainings.map(session => (
                  <label
                    key={session.id}
                    className="flex items-start gap-3 p-3 bg-white rounded border border-blue-200 cursor-pointer hover:bg-blue-50"
                  >
                    <Checkbox
                      checked={selectedTrainingSessions.includes(session.id)}
                      onCheckedChange={() => toggleTraining(session.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{session.title}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        <strong>Product:</strong> {session.assa_abloy_product}
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>Date:</strong> {format(new Date(session.session_date), 'MMM d, yyyy HH:mm')}
                      </div>
                      {session.location?.type && (
                        <div className="text-sm text-slate-600">
                          <strong>Format:</strong> {session.location.type}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {needsTraining && relevantTrainings.length === 0 && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>No Upcoming Training Available:</strong> There are currently no scheduled 
                training sessions for the required products. Please contact ASSA ABLOY to request training.
              </AlertDescription>
            </Alert>
          )}

          {/* Standard Flow Information */}
          {certValidation.valid && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>All Certifications Valid:</strong> You meet all certification requirements 
                and can proceed directly to proposal submission once approved.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Next Steps:</strong>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Submit your interest{needsTraining ? ' and training commitment' : ''}</li>
                <li>ASSA ABLOY will review and approve your request</li>
                <li>Once approved, you'll gain access to tender documents</li>
                <li>Calculate your proposal and submit with meeting date</li>
              </ol>
            </AlertDescription>
          </Alert>

          {needsTraining && selectedTrainingSessions.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-300">
              <Checkbox
                id="training-acknowledge"
                checked={acknowledgeTraining}
                onCheckedChange={setAcknowledgeTraining}
              />
              <label
                htmlFor="training-acknowledge"
                className="text-sm font-medium leading-tight cursor-pointer"
              >
                I commit to attending the selected training session(s) and understand that 
                failure to attend may impact my ability to submit proposals for urgent projects.
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => submitInterestMutation.mutate()}
            disabled={
              submitInterestMutation.isPending || 
              (needsTraining && relevantTrainings.length === 0) ||
              (needsTraining && selectedTrainingSessions.length === 0) ||
              (needsTraining && selectedTrainingSessions.length > 0 && !acknowledgeTraining)
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitInterestMutation.isPending ? 'Submitting...' : 'Submit Interest'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}