import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, FileText, Calendar, Download, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReviewTenderInterests({ tender }) {
  const queryClient = useQueryClient();
  const [awardingPartnerId, setAwardingPartnerId] = useState(null);

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const approveInterestMutation = useMutation({
    mutationFn: async (partnerId) => {
      const responses = tender.responses.map(r => {
        if (r.partner_id === partnerId && r.status === 'interest_submitted') {
          return { ...r, status: 'calculating', approved_at: new Date().toISOString() };
        }
        return r;
      });
      return base44.entities.Tender.update(tender.id, { responses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
    },
  });

  const rejectInterestMutation = useMutation({
    mutationFn: async (partnerId) => {
      const responses = tender.responses.map(r => {
        if (r.partner_id === partnerId) {
          return { ...r, status: 'rejected', rejected_at: new Date().toISOString() };
        }
        return r;
      });
      return base44.entities.Tender.update(tender.id, { responses });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
    },
  });

  const awardTenderMutation = useMutation({
    mutationFn: async (partnerId) => {
      const winningResponse = tender.responses.find(r => r.partner_id === partnerId);
      const partner = partners.find(p => p.id === partnerId);
      
      // Create project from tender
      const project = await base44.entities.Project.create({
        project_name: tender.title,
        client_name: tender.customer_name,
        customer_contact: tender.customer_contact,
        source: 'tender',
        status: 'assigned',
        solution_ids: tender.required_solutions,
        primary_solution: tender.required_solutions?.[0],
        additional_solutions: tender.required_solutions?.slice(1) || [],
        assa_abloy_products: tender.assa_abloy_products || [],
        vertical_id: tender.vertical_id,
        project_location: tender.project_location,
        estimated_value: winningResponse?.proposed_value || tender.estimated_gross_value,
        start_date: tender.project_start_date,
        assigned_partner_id: partnerId,
        assigned_team_members: winningResponse?.team_assigned || [],
        project_language: tender.project_language,
        required_service_coverage: tender.required_service_coverage,
        notes: `Created from tender: ${tender.tender_code || tender.id}`
      });

      // Update tender with award info
      const updatedResponses = tender.responses.map(r => {
        if (r.partner_id === partnerId) {
          return { ...r, status: 'awarded', awarded_at: new Date().toISOString() };
        } else if (r.status !== 'rejected') {
          return { ...r, status: 'rejected', rejected_at: new Date().toISOString() };
        }
        return r;
      });

      await base44.entities.Tender.update(tender.id, {
        status: 'awarded',
        awarded_to: partnerId,
        awarded_project_id: project.id,
        responses: updatedResponses
      });

      // Send notifications to all partners
      for (const response of tender.responses) {
        const responsePartner = partners.find(p => p.id === response.partner_id);
        const email = responsePartner?.primary_contact?.email || responsePartner?.contact_email;
        
        if (email) {
          if (response.partner_id === partnerId) {
            // Winner notification
            await base44.entities.Notification.create({
              user_email: email,
              partner_id: response.partner_id,
              type: 'project_assigned',
              title: 'Congratulations! Tender Awarded',
              message: `You have been selected for the tender "${tender.title}". The project has been created and assigned to you.`,
              link: `/project-detail?id=${project.id}`,
              related_entity_type: 'Project',
              related_entity_id: project.id
            });
          } else {
            // Not selected notification
            await base44.entities.Notification.create({
              user_email: email,
              partner_id: response.partner_id,
              type: 'tender_not_selected',
              title: 'Tender Not Awarded',
              message: `Thank you for your interest in "${tender.title}". After careful consideration, we have selected another partner for this project. We look forward to future opportunities to work together.`,
              link: `/tenders`,
              related_entity_type: 'Tender',
              related_entity_id: tender.id
            });
          }
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tender.id]);
      queryClient.invalidateQueries(['tenders']);
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['notifications']);
      setAwardingPartnerId(null);
    },
  });

  const getPartnerName = (partnerId) => {
    return partners.find(p => p.id === partnerId)?.company_name || 'Unknown';
  };

  const statusColors = {
    interest_submitted: 'bg-blue-100 text-blue-800',
    calculating: 'bg-amber-100 text-amber-800',
    proposal_submitted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    awarded: 'bg-green-100 text-green-800',
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Partner Responses</CardTitle>
      </CardHeader>
      <CardContent>
        {tender.responses && tender.responses.length > 0 ? (
          <div className="space-y-4">
            {tender.responses.map((response, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{getPartnerName(response.partner_id)}</div>
                    <div className="text-sm text-slate-600 mt-1">
                      Submitted: {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                    </div>
                    {response.certification_status && !response.certification_status.valid && (
                      <div className="mt-2">
                        <Badge className="bg-amber-100 text-amber-800">
                          Certification Requirements Not Met
                        </Badge>
                        {response.committed_training_sessions?.length > 0 && (
                          <div className="text-xs text-slate-600 mt-1">
                            ✓ Committed to {response.committed_training_sessions.length} training session(s)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Badge className={statusColors[response.status]}>
                    {response.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {response.status === 'interest_submitted' && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => approveInterestMutation.mutate(response.partner_id)}
                      disabled={approveInterestMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve & Grant Access
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectInterestMutation.mutate(response.partner_id)}
                      disabled={rejectInterestMutation.isPending}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {response.status === 'calculating' && (
                  <Alert className="bg-amber-50 border-amber-200 mt-3">
                    <AlertDescription className="text-amber-900 text-sm">
                      Partner is calculating their proposal. They have access to tender documents.
                    </AlertDescription>
                  </Alert>
                )}

                {response.status === 'proposal_submitted' && (
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {response.proposed_value && (
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-blue-600 font-semibold mb-1">Proposed Value</div>
                          <div className="text-lg font-bold text-blue-900">
                            €{(response.proposed_value / 1000).toFixed(1)}K
                          </div>
                        </div>
                      )}
                      {response.proposed_timeline && (
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="text-xs text-purple-600 font-semibold mb-1">Timeline</div>
                          <div className="text-lg font-bold text-purple-900">
                            {response.proposed_timeline} days
                          </div>
                        </div>
                      )}
                    </div>

                    {response.proposal_document && (
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Proposal Document</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    )}

                    {response.meeting_date && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-900">
                          <strong>Proposed Meeting:</strong> {format(new Date(response.meeting_date), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                    )}

                    {response.team_assigned?.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="text-xs text-slate-600 font-semibold mb-1">Team Members Assigned</div>
                        <div className="text-sm text-slate-900">{response.team_assigned.length} member(s)</div>
                      </div>
                    )}

                    {tender.status !== 'awarded' && (
                      <Button
                        onClick={() => setAwardingPartnerId(response.partner_id)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Award Project to This Partner
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No partner responses yet
          </div>
        )}
      </CardContent>

      {/* Award Confirmation Dialog */}
      <Dialog open={!!awardingPartnerId} onOpenChange={() => setAwardingPartnerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Tender</DialogTitle>
            <DialogDescription>
              Are you sure you want to award this tender to {getPartnerName(awardingPartnerId)}?
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-900 text-sm">
              <strong>This will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create a new project assigned to this partner</li>
                <li>Notify the winning partner</li>
                <li>Notify all other partners that they were not selected</li>
                <li>Mark this tender as "awarded" and close it</li>
              </ul>
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardingPartnerId(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => awardTenderMutation.mutate(awardingPartnerId)}
              disabled={awardTenderMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {awardTenderMutation.isPending ? 'Awarding...' : 'Confirm & Award'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}