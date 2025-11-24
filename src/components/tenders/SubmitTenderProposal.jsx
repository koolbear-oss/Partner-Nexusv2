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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, Upload, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { validatePartnerCertifications, isTenderUrgent } from '../utils/certificationValidation';

export default function SubmitTenderProposal({ open, onClose, tender, partnerId }) {
  const [meetingDate, setMeetingDate] = useState('');
  const [proposalFile, setProposalFile] = useState(null);
  const queryClient = useQueryClient();

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

  // Get my response from tender
  const myResponse = tender.responses?.find(r => r.partner_id === partnerId);

  // Validate certifications
  const certValidation = validatePartnerCertifications(
    tender.assa_abloy_products || [],
    teamMembers,
    allCertifications
  );

  const isUrgent = isTenderUrgent(tender.project_start_date);
  const canSubmit = !isUrgent || certValidation.valid;

  const submitProposalMutation = useMutation({
    mutationFn: async () => {
      let proposalUrl = null;
      
      if (proposalFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: proposalFile });
        proposalUrl = file_url;
      }

      const responses = tender.responses.map(r => {
        if (r.partner_id === partnerId && r.status === 'calculating') {
          return {
            ...r,
            status: 'proposal_submitted',
            proposal_document: proposalUrl,
            meeting_date: meetingDate,
            proposal_submitted_at: new Date().toISOString(),
            final_certification_status: {
              valid: certValidation.valid,
              checked_at: new Date().toISOString(),
            }
          };
        }
        return r;
      });

      return base44.entities.Tender.update(tender.id, { responses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Submit Final Proposal
          </DialogTitle>
          <DialogDescription>
            Upload your proposal document and schedule a meeting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Certification Validation for Urgent Projects */}
          {isUrgent && !certValidation.valid && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-900">
                <strong>Cannot Submit Proposal:</strong> This is an urgent project (starts in less than 30 days) 
                and you do not have valid certifications for all required products.
                <div className="mt-2">
                  {certValidation.missingProducts.length > 0 && (
                    <div className="mb-2">
                      <p className="text-sm font-medium">Missing Certifications:</p>
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
                    <div>
                      <p className="text-sm font-medium">Expired Certifications:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {certValidation.expiredProducts.map(product => (
                          <Badge key={product} className="bg-red-100 text-red-800">
                            {product}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm mt-2">
                  Please complete the required training and obtain certifications before submitting a proposal.
                  {myResponse?.committed_training_sessions?.length > 0 && 
                    ' You have committed to attending training sessions.'
                  }
                </p>
              </AlertDescription>
            </Alert>
          )}

          {isUrgent && certValidation.valid && (
            <Alert className="bg-green-50 border-green-200">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Certifications Verified:</strong> All required certifications are valid. 
                You may proceed with proposal submission.
              </AlertDescription>
            </Alert>
          )}

          {!isUrgent && !certValidation.valid && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Note:</strong> You do not have all required certifications, but since this is not 
                an urgent project, you may still submit a proposal. However, completing certifications 
                will improve your partner standing and future tender eligibility.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              By submitting your proposal, you are requesting a physical meeting to discuss the project details.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="proposal">Proposal Document *</Label>
            <Input
              id="proposal"
              type="file"
              onChange={(e) => setProposalFile(e.target.files[0])}
              accept=".pdf,.doc,.docx"
              required
              disabled={!canSubmit}
            />
            <p className="text-xs text-slate-500">Upload your complete proposal (PDF, DOC, DOCX)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingDate">Preferred Meeting Date *</Label>
            <Input
              id="meetingDate"
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              required
              disabled={!canSubmit}
            />
            <p className="text-xs text-slate-500">Suggest a date/time for the project discussion meeting</p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              <strong>Next Step:</strong> After submission, ASSA ABLOY will review your proposal and 
              confirm or suggest an alternative meeting time.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => submitProposalMutation.mutate()}
            disabled={
              submitProposalMutation.isPending || 
              !proposalFile || 
              !meetingDate ||
              !canSubmit
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitProposalMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}