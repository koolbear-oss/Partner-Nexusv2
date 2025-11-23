import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, FileText, 
  Users, CheckCircle2, XCircle, Clock, Trophy, Send, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TenderQA from '../components/tenders/TenderQA';

export default function TenderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenderId = urlParams.get('id');
  const { isAdmin, partnerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', tenderId],
    queryFn: async () => {
      const tenders = await base44.entities.Tender.list();
      return tenders.find(t => t.id === tenderId);
    },
    enabled: !!tenderId,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const publishTenderMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Tender.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tenderId]);
      queryClient.invalidateQueries(['tenders']);
      setShowPublishDialog(false);
    },
  });

  const handlePublish = () => {
    publishTenderMutation.mutate({ 
      id: tenderId, 
      status: 'published'
    });
  };

  if (isLoading || !tender) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-blue-100 text-blue-800',
    response_period: 'bg-green-100 text-green-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    awarded: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const responseStatusColors = {
    submitted: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    awarded: 'bg-green-100 text-green-800',
  };

  const getVerticalName = (id) => verticals.find(v => v.id === id)?.name || 'Unknown';
  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'Unknown';
  const getPartnerName = (id) => partners.find(p => p.id === id)?.company_name || 'Unknown';

  const canRespond = !isAdmin && 
    tender.status === 'response_period' &&
    (tender.invitation_strategy === 'open' || 
     tender.invited_partners?.includes(partnerId));

  const myResponse = tender.responses?.find(r => r.partner_id === partnerId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to={createPageUrl('Tenders')}>
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </button>
        </Link>
        {isAdmin && tender.status === 'draft' && (
          <Button 
            onClick={() => setShowPublishDialog(true)}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Send className="w-4 h-4" />
            Publish Tender
          </Button>
        )}
      </div>

      {/* Header */}
      <Card className="shadow-md border-t-4 border-t-blue-600">
        <CardContent className="pt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">{tender.title}</h1>
                <Badge className={statusColors[tender.status]}>
                  {tender.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {tender.tender_code && (
                <p className="text-sm text-slate-500 mb-4">Tender Code: {tender.tender_code}</p>
              )}

              <p className="text-slate-700 mb-6">{tender.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-slate-500">Response Deadline</div>
                    <div className="font-medium">{format(new Date(tender.response_deadline), 'MMM d, yyyy HH:mm')}</div>
                  </div>
                </div>
                {tender.project_location?.city && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Location</div>
                      <div className="font-medium">{tender.project_location.city}</div>
                    </div>
                  </div>
                )}
                {tender.budget_max && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Budget Range</div>
                      <div className="font-medium">
                        €{(tender.budget_min / 1000).toFixed(0)}K - €{(tender.budget_max / 1000).toFixed(0)}K
                      </div>
                    </div>
                  </div>
                )}
                {tender.project_duration && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Duration</div>
                      <div className="font-medium">{tender.project_duration} days</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {getVerticalName(tender.vertical_id)}
                </Badge>
                {tender.required_solutions?.map(solId => (
                  <Badge key={solId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {getSolutionName(solId)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="lg:min-w-[280px]">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-900 mb-1">{tender.responses?.length || 0}</div>
                    <div className="text-sm text-blue-700 font-medium">Response(s) Received</div>
                  </div>
                  {tender.awarded_to && (
                    <div className="pt-4 border-t border-blue-200">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <Trophy className="w-4 h-4" />
                        <span className="text-xs font-semibold">Awarded To</span>
                      </div>
                      <div className="font-bold text-slate-900">{getPartnerName(tender.awarded_to)}</div>
                    </div>
                  )}
                  {canRespond && !myResponse && (
                    <Button className="w-full mt-4 bg-blue-900 hover:bg-blue-800">
                      Submit Response
                    </Button>
                  )}
                  {myResponse && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
                      <div className="text-xs text-blue-700 font-semibold mb-1">Your Response</div>
                      <Badge className={responseStatusColors[myResponse.status]}>
                        {myResponse.status}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {isAdmin && <TabsTrigger value="responses">Responses</TabsTrigger>}
          {isAdmin && tender.status !== 'draft' && <TabsTrigger value="visibility">Visibility</TabsTrigger>}
          <TabsTrigger value="questions">Q&A</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">Invitation Strategy</div>
                  <div className="text-slate-900">{tender.invitation_strategy?.replace(/_/g, ' ')}</div>
                </div>
                {tender.project_start_date && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Expected Start</div>
                    <div className="text-slate-900">{format(new Date(tender.project_start_date), 'MMM d, yyyy')}</div>
                  </div>
                )}
                {tender.invited_partners && tender.invited_partners.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Invited Partners</div>
                    <div className="text-slate-900">{tender.invited_partners.length} partners invited</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Required Solutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tender.required_solutions?.map(solId => (
                    <div key={solId} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-slate-900">{getSolutionName(solId)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Tender Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {tender.tender_documents && tender.tender_documents.length > 0 ? (
                <div className="space-y-3">
                  {tender.tender_documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.name}</div>
                          <div className="text-xs text-slate-500">{doc.type}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Download</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No documents available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="responses">
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
                          <div>
                            <div className="font-bold text-slate-900 mb-1">
                              {getPartnerName(response.partner_id)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Submitted: {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                          <Badge className={responseStatusColors[response.status]}>
                            {response.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-slate-500">Proposed Value</div>
                            <div className="font-semibold text-slate-900">
                              €{(response.proposed_value / 1000).toFixed(0)}K
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Proposed Timeline</div>
                            <div className="font-semibold text-slate-900">{response.proposed_timeline} days</div>
                          </div>
                        </div>
                        {response.shortlist_notes && (
                          <div className="text-sm text-slate-600 italic mt-2">
                            Notes: {response.shortlist_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No responses received yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isAdmin && tender.status !== 'draft' && (
          <TabsContent value="visibility">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Partner Visibility</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Partners who can see and respond to this tender based on the invitation strategy
                </p>
              </CardHeader>
              <CardContent>
                {(() => {
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
                      
                      // Check vertical match
                      const tenderVertical = verticals.find(v => v.id === tender.vertical_id);
                      const hasVertical = tenderVertical ? p.verticals?.includes(tenderVertical.code) : false;
                      
                      // Check solution match - tender.required_solutions contains solution IDs
                      const hasSolutions = tender.required_solutions?.some(solId => {
                        const solution = solutions.find(s => s.id === solId);
                        return solution && p.solutions?.includes(solution.code);
                      });
                      
                      // For open strategy, we only require active status
                      // For qualified, we need both vertical and solutions
                      return hasVertical && hasSolutions;
                    });
                  } else {
                    // If strategy is 'open' or unrecognized, show all active partners
                    eligiblePartners = partners.filter(p => p.status === 'active');
                  }

                  return eligiblePartners.length > 0 ? (
                    <div className="space-y-3">
                      {eligiblePartners.map(partner => (
                        <div key={partner.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-slate-900">{partner.company_name}</div>
                              <div className="text-sm text-slate-600 mt-1">
                                Tier: <Badge className="ml-1">{partner.tier}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Contact</div>
                              <div className="text-sm text-slate-700">{partner.primary_contact?.email || partner.contact_email}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-semibold text-blue-900">
                          Total: {eligiblePartners.length} partner(s) can see this tender
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-slate-500 mb-2">No partners match the visibility criteria</div>
                      <div className="text-sm text-slate-400">
                        {tender.invitation_strategy === 'invited_only' && 'No partners have been invited'}
                        {tender.invitation_strategy === 'qualified_only' && 'No partners meet the required qualifications'}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="questions">
          <TenderQA tender={tender} tenderId={tenderId} />
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Publish Tender</DialogTitle>
            <DialogDescription>
              Review the visibility settings before publishing this tender to partners.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Invitation Strategy</div>
                    <Badge className="text-sm">
                      {tender.invitation_strategy?.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  {tender.invitation_strategy === 'open' && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Users className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        <strong>Open to all partners:</strong> All partners in your network will be able to see and respond to this tender.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {tender.invitation_strategy === 'invited_only' && (
                    <Alert className="bg-purple-50 border-purple-200">
                      <Users className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-900">
                        <strong>Invited partners only:</strong> Only {tender.invited_partners?.length || 0} specifically invited partner(s) will see this tender.
                        {(!tender.invited_partners || tender.invited_partners.length === 0) && (
                          <div className="mt-2 text-red-700 font-semibold">
                            ⚠️ Warning: No partners have been invited yet!
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {tender.invitation_strategy === 'qualified_only' && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <CheckCircle2 className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-900">
                        <strong>Qualified partners only:</strong> Partners matching the required solutions, verticals, and service coverage will see this tender.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="pt-3 border-t">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Required Qualifications</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-600">Vertical:</span>
                        <Badge variant="outline">{getVerticalName(tender.vertical_id)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-600">Solutions:</span>
                        {tender.required_solutions?.map(solId => (
                          <Badge key={solId} variant="outline">{getSolutionName(solId)}</Badge>
                        ))}
                      </div>
                      {tender.required_service_coverage && tender.required_service_coverage.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-600">Service Coverage:</span>
                          <span className="text-slate-800">{tender.required_service_coverage.length} region(s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {tender.invitation_strategy === 'invited_only' && (!tender.invited_partners || tender.invited_partners.length === 0) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This tender is set to "invited only" but no partners have been invited. 
                  Consider adding invited partners or changing the invitation strategy before publishing.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={publishTenderMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishTenderMutation.isPending ? 'Publishing...' : 'Publish Tender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}