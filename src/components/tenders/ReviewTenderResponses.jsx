import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, Star, Eye, Award as AwardIcon, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewTenderResponses({ tender }) {
  const queryClient = useQueryClient();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [actionType, setActionType] = useState(null); // 'shortlist', 'reject', 'award'
  const [notes, setNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const updateResponseMutation = useMutation({
    mutationFn: async ({ responseIndex, updates }) => {
      const updatedResponses = [...tender.responses];
      updatedResponses[responseIndex] = {
        ...updatedResponses[responseIndex],
        ...updates,
      };
      return base44.entities.Tender.update(tender.id, { responses: updatedResponses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      closeDialog();
    },
  });

  const awardTenderMutation = useMutation({
    mutationFn: async ({ responseIndex, partnerId }) => {
      const updatedResponses = [...tender.responses];
      updatedResponses[responseIndex] = {
        ...updatedResponses[responseIndex],
        status: 'awarded',
        shortlist_notes: notes,
        awarded_at: new Date().toISOString(),
      };
      
      return base44.entities.Tender.update(tender.id, { 
        responses: updatedResponses,
        awarded_to: partnerId,
        status: 'awarded',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      closeDialog();
    },
  });

  const openDialog = (response, index, action) => {
    setSelectedResponse({ ...response, index });
    setActionType(action);
    setNotes(response.shortlist_notes || '');
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setSelectedResponse(null);
    setActionType(null);
    setNotes('');
  };

  const handleAction = () => {
    if (actionType === 'award') {
      awardTenderMutation.mutate({
        responseIndex: selectedResponse.index,
        partnerId: selectedResponse.partner_id,
      });
    } else if (actionType === 'shortlist') {
      updateResponseMutation.mutate({
        responseIndex: selectedResponse.index,
        updates: { status: 'shortlisted', shortlist_notes: notes },
      });
    } else if (actionType === 'reject') {
      updateResponseMutation.mutate({
        responseIndex: selectedResponse.index,
        updates: { status: 'rejected', shortlist_notes: notes },
      });
    }
  };

  const getPartnerName = (partnerId) => {
    return partners.find(p => p.id === partnerId)?.company_name || 'Unknown Partner';
  };

  const statusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    awarded: 'bg-green-100 text-green-800',
  };

  const responses = tender.responses || [];
  const hasAwarded = responses.some(r => r.status === 'awarded');

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Submitted Responses ({responses.length})</CardTitle>
          {hasAwarded && (
            <Alert className="mt-3 bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                This tender has been awarded. The winning partner has been notified.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {responses.length > 0 ? (
            <div className="space-y-4">
              {responses.map((response, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        {getPartnerName(response.partner_id)}
                      </div>
                      <div className="text-sm text-slate-500">
                        Submitted: {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                      </div>
                    </div>
                    <Badge className={statusColors[response.status]}>
                      {response.status === 'submitted' && <Eye className="w-3 h-3 mr-1" />}
                      {response.status === 'shortlisted' && <Star className="w-3 h-3 mr-1" />}
                      {response.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {response.status === 'awarded' && <AwardIcon className="w-3 h-3 mr-1" />}
                      {response.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <div className="text-slate-500">Proposed Value</div>
                      <div className="font-semibold text-slate-900">
                        €{response.proposed_value?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Timeline</div>
                      <div className="font-semibold text-slate-900">
                        {response.proposed_timeline} days
                      </div>
                    </div>
                  </div>

                  {response.proposal_notes && (
                    <div className="mb-3 p-3 bg-white rounded border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Proposal Notes</div>
                      <div className="text-sm text-slate-700">{response.proposal_notes}</div>
                    </div>
                  )}

                  {response.shortlist_notes && (
                    <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-xs text-blue-600 font-semibold mb-1">Internal Notes</div>
                      <div className="text-sm text-blue-900">{response.shortlist_notes}</div>
                    </div>
                  )}

                  {response.status !== 'awarded' && !hasAwarded && (
                    <div className="flex gap-2 pt-3 border-t border-slate-200">
                      {response.status === 'submitted' && (
                        <>
                          <Button
                            onClick={() => openDialog(response, idx, 'shortlist')}
                            variant="outline"
                            size="sm"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Shortlist
                          </Button>
                          <Button
                            onClick={() => openDialog(response, idx, 'reject')}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </>
                      )}
                      {(response.status === 'submitted' || response.status === 'shortlisted') && (
                        <Button
                          onClick={() => openDialog(response, idx, 'award')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <AwardIcon className="w-4 h-4 mr-2" />
                          Award Tender
                        </Button>
                      )}
                    </div>
                  )}

                  {response.status === 'awarded' && (
                    <Alert className="mt-3 bg-green-50 border-green-200">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-900 text-sm">
                        <strong>Awarded to this partner</strong>
                        {response.awarded_at && ` on ${format(new Date(response.awarded_at), 'MMM d, yyyy')}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No responses submitted yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'award' && 'Award Tender'}
              {actionType === 'shortlist' && 'Shortlist Response'}
              {actionType === 'reject' && 'Decline Response'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'award' && (
                <span className="text-amber-600 font-semibold">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  This will officially award the tender to {selectedResponse && getPartnerName(selectedResponse.partner_id)}. 
                  The partner will be notified and can proceed with the project.
                </span>
              )}
              {actionType === 'shortlist' && `Mark ${selectedResponse && getPartnerName(selectedResponse.partner_id)}'s response as shortlisted for further review.`}
              {actionType === 'reject' && `Decline ${selectedResponse && getPartnerName(selectedResponse.partner_id)}'s response. They will be notified.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {actionType === 'award' ? 'Award Notes (optional)' : 'Notes (optional)'}
              </label>
              <Textarea
                placeholder={actionType === 'award' 
                  ? "Internal notes about this award decision..." 
                  : "Internal notes..."}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            {actionType === 'award' && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  Once awarded, this action cannot be undone. Make sure all review processes are complete.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={updateResponseMutation.isPending || awardTenderMutation.isPending}
              className={
                actionType === 'award' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-purple-600 hover:bg-purple-700'
              }
            >
              {(updateResponseMutation.isPending || awardTenderMutation.isPending) ? 'Processing...' : 
                actionType === 'award' ? 'Confirm Award' :
                actionType === 'shortlist' ? 'Confirm Shortlist' :
                'Confirm Decline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}