import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle } from 'lucide-react';

export default function SubmitTenderResponse({ open, onClose, tender, partnerId }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    proposed_value: '',
    proposed_timeline: '',
    proposal_notes: '',
    team_assigned: [],
  });

  const submitResponseMutation = useMutation({
    mutationFn: async (responseData) => {
      const newResponse = {
        partner_id: partnerId,
        submitted_at: new Date().toISOString(),
        proposed_value: parseFloat(responseData.proposed_value),
        proposed_timeline: parseInt(responseData.proposed_timeline),
        proposal_notes: responseData.proposal_notes,
        team_assigned: responseData.team_assigned,
        status: 'submitted',
      };

      const updatedResponses = [...(tender.responses || []), newResponse];
      
      return base44.entities.Tender.update(tender.id, { 
        responses: updatedResponses,
        status: 'under_review'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      onClose();
      setFormData({
        proposed_value: '',
        proposed_timeline: '',
        proposal_notes: '',
        team_assigned: [],
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitResponseMutation.mutate(formData);
  };

  // Check if partner already submitted
  const alreadySubmitted = tender.responses?.some(r => r.partner_id === partnerId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Tender Response</DialogTitle>
          <DialogDescription>
            Submit your proposal for "{tender.title}". This will notify the ASSA ABLOY team for review.
          </DialogDescription>
        </DialogHeader>

        {alreadySubmitted ? (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              You have already submitted a response to this tender. The ASSA ABLOY team will review your submission and contact you.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900 text-sm">
                <strong>Important:</strong> Submitting this response does not guarantee project award. 
                ASSA ABLOY will review all submissions and contact you with their decision.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="proposed_value">Proposed Value (EUR) *</Label>
              <Input
                id="proposed_value"
                type="number"
                placeholder="e.g., 150000"
                value={formData.proposed_value}
                onChange={(e) => setFormData({ ...formData, proposed_value: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed_timeline">Proposed Timeline (days) *</Label>
              <Input
                id="proposed_timeline"
                type="number"
                placeholder="e.g., 90"
                value={formData.proposed_timeline}
                onChange={(e) => setFormData({ ...formData, proposed_timeline: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal_notes">Additional Notes / Proposal Details *</Label>
              <Textarea
                id="proposal_notes"
                placeholder="Describe your approach, team expertise, timeline breakdown, or any other relevant information..."
                value={formData.proposal_notes}
                onChange={(e) => setFormData({ ...formData, proposal_notes: e.target.value })}
                rows={6}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-900 hover:bg-blue-800"
                disabled={submitResponseMutation.isPending}
              >
                {submitResponseMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Response
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}