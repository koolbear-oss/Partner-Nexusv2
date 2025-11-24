import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, FileText, 
  Users, CheckCircle2, XCircle, Clock, Trophy, Send, AlertCircle, Shield, Upload
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
import SubmitTenderInterest from '../components/tenders/SubmitTenderInterest';
import SubmitTenderProposal from '../components/tenders/SubmitTenderProposal';
import ReviewTenderInterests from '../components/tenders/ReviewTenderInterests';
import TenderVisibilityList from '../components/tenders/TenderVisibilityList';
import TenderNDADialog from '../components/tenders/TenderNDADialog';

export default function TenderDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenderId = urlParams.get('id');
  const { isAdmin, partnerId, user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [showNDADialog, setShowNDADialog] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);

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

  const { data: userNDA } = useQuery({
    queryKey: ['tenderNDA', tenderId, user?.email],
    queryFn: async () => {
      const ndas = await base44.entities.TenderNDA.list();
      return ndas.find(n => n.tender_id === tenderId && n.user_email === user?.email);
    },
    enabled: !!tenderId && !!user?.email && !isAdmin,
  });

  React.useEffect(() => {
    if (!isAdmin && tender && tender.status !== 'draft' && user?.email) {
      if (userNDA) {
        setNdaAccepted(true);
      } else {
        setShowNDADialog(true);
      }
    }
  }, [isAdmin, tender, userNDA, user]);

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

  if (!isAdmin && !ndaAccepted && tender.status !== 'draft') {
    return (
      <>
        <TenderNDADialog
          open={showNDADialog}
          tender={tender}
          userEmail={user?.email}
          partnerId={partnerId}
          onAccept={() => {
            setNdaAccepted(true);
            setShowNDADialog(false);
          }}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Please accept the NDA to view tender details</p>
          </div>
        </div>
      </>
    );
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
    interest_submitted: 'bg-blue-100 text-blue-800',
    calculating: 'bg-amber-100 text-amber-800',
    proposal_submitted: 'bg-purple-100 text-purple-800',
    rejected: 'bg-red-100 text-red-800',
    awarded: 'bg-green-100 text-green-800',
  };

  const getVerticalName = (id) => verticals.find(v => v.id === id)?.name || 'Unknown';
  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'Unknown';
  const getPartnerName = (id) => partners.find(p => p.id === id)?.company_name || 'Unknown';

  const myResponse = tender.responses?.find(r => r.partner_id === partnerId);
  const hasAwarded = tender.responses?.some(r => r.status === 'awarded');
  const canExpressInterest = !isAdmin && 
    tender.status !== 'draft' && 
    tender.status !== 'cancelled' &&
    tender.status !== 'awarded' &&
    !myResponse &&
    !hasAwarded &&
    ndaAccepted;
  
  const canSubmitProposal = !isAdmin && 
    myResponse?.status === 'calculating' &&
    ndaAccepted;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to={createPageUrl('Tenders')}>
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenders</span>
          </button>
        </Link>
        <div className="flex gap-3">
          {isAdmin && (
            <Link to={createPageUrl(`EditTender?id=${tenderId}`)}>
              <Button variant="outline" className="gap-2">
                Edit Tender
              </Button>
            </Link>
          )}
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
                {!isAdmin && ndaAccepted && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300 border flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    NDA Signed
                  </Badge>
                )}
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
                {tender.estimated_gross_value && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs text-slate-500">
                        {isAdmin ? 'ASSA ABLOY Gross Value (Est.)' : 'ASSA ABLOY Value Range'}
                      </div>
                      <div className="font-medium text-blue-700">
                        {isAdmin ? (
                          `€${(tender.estimated_gross_value / 1000).toFixed(0)}K`
                        ) : (
                          (() => {
                            const variance = tender.budget_min && tender.budget_max 
                              ? ((tender.budget_max - tender.budget_min) / ((tender.budget_min + tender.budget_max) / 2)) / 2
                              : 0.1;
                            const minValue = tender.estimated_gross_value * (1 - variance);
                            const maxValue = tender.estimated_gross_value * (1 + variance);
                            return `€${(minValue / 1000).toFixed(0)}K - €${(maxValue / 1000).toFixed(0)}K`;
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {tender.budget_max && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">
                        {isAdmin ? 'End User Total Budget' : 'Total Project Budget'}
                      </div>
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
                  {canExpressInterest && (
                    <Button 
                      onClick={() => setShowInterestDialog(true)}
                      className="w-full mt-4 bg-blue-900 hover:bg-blue-800"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Express Interest
                    </Button>
                  )}
                  {canSubmitProposal && (
                    <Button 
                      onClick={() => setShowProposalDialog(true)}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Proposal
                    </Button>
                  )}
                  {myResponse && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-300">
                      <div className="text-xs text-blue-700 font-semibold mb-1">Your Response</div>
                      <Badge className={responseStatusColors[myResponse.status]}>
                        {myResponse.status === 'interest_submitted' && 'Interest Submitted'}
                        {myResponse.status === 'calculating' && 'Calculating'}
                        {myResponse.status === 'proposal_submitted' && 'Proposal Submitted'}
                        {myResponse.status === 'rejected' && 'Not Selected'}
                        {myResponse.status === 'awarded' && 'Awarded'}
                      </Badge>
                      <div className="text-xs text-slate-600 mt-2">
                        {myResponse.status === 'interest_submitted' && 'Awaiting approval from ASSA ABLOY to access documents'}
                        {myResponse.status === 'calculating' && 'You can now access documents and prepare your proposal'}
                        {myResponse.status === 'proposal_submitted' && 'Your proposal is under review'}
                        {myResponse.status === 'rejected' && 'Thank you for your interest'}
                        {myResponse.status === 'awarded' && 'Congratulations! This tender has been awarded to you'}
                      </div>
                    </div>
                  )}
                  {!isAdmin && tender.status === 'awarded' && !myResponse && (
                    <Alert className="mt-4 bg-slate-50 border-slate-200">
                      <AlertDescription className="text-slate-700 text-sm">
                        This tender has been awarded to another partner
                      </AlertDescription>
                    </Alert>
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
                <CardTitle className="text-lg">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tender.budget_max && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-sm font-semibold text-slate-700 mb-2">Total Project Budget</div>
                    <div className="text-2xl font-bold text-slate-900">
                      €{(tender.budget_min / 1000).toFixed(0)}K - €{(tender.budget_max / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Full security/access control budget for the project
                    </div>
                  </div>
                )}
                {tender.estimated_gross_value && (
                  <div className={`p-3 rounded-lg border ${
                    tender.budget_max && tender.estimated_gross_value > tender.budget_max
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className={`text-sm font-semibold mb-2 ${
                      tender.budget_max && tender.estimated_gross_value > tender.budget_max
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      ASSA ABLOY Gross Value
                      {tender.budget_max && tender.estimated_gross_value > tender.budget_max && (
                        <span className="ml-2 text-xs">⚠️ Invalid</span>
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${
                      tender.budget_max && tender.estimated_gross_value > tender.budget_max
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}>
                      €{(tender.estimated_gross_value / 1000).toFixed(0)}K
                    </div>
                    <div className={`text-xs mt-1 ${
                      tender.budget_max && tender.estimated_gross_value > tender.budget_max
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      Estimated ASSA ABLOY list price before partner discounts
                    </div>
                    {tender.budget_max && (
                      <div className={`text-xs mt-2 font-medium ${
                        tender.estimated_gross_value > tender.budget_max
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}>
                        {((tender.estimated_gross_value / tender.budget_max) * 100).toFixed(1)}% of total project budget
                        {tender.estimated_gross_value > tender.budget_max && ' - Exceeds budget!'}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
                <CardTitle className="text-lg">Project Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tender.assa_abloy_products && tender.assa_abloy_products.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="text-base font-bold text-blue-900 mb-3">ASSA ABLOY Products</div>
                    <div className="flex flex-wrap gap-2">
                      {tender.assa_abloy_products.map((product, idx) => (
                        <Badge key={idx} className="bg-blue-600 text-white text-sm px-3 py-1.5">
                          {product}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-2">Required Solutions</div>
                  <div className="space-y-2">
                    {tender.required_solutions?.map(solId => (
                      <div key={solId} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-slate-900">{getSolutionName(solId)}</span>
                      </div>
                    ))}
                  </div>
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
              {!isAdmin && myResponse?.status === 'interest_submitted' ? (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-900">
                    <strong>Access Pending:</strong> Your interest has been submitted. Once ASSA ABLOY approves 
                    your request, you'll gain access to all tender documents here.
                  </AlertDescription>
                </Alert>
              ) : !isAdmin && !myResponse ? (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong>Express Interest First:</strong> Submit your interest in this tender to request 
                    access to confidential documents.
                  </AlertDescription>
                </Alert>
              ) : tender.tender_documents && tender.tender_documents.length > 0 ? (
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
            <ReviewTenderInterests tender={tender} />
          </TabsContent>
        )}

        {isAdmin && tender.status !== 'draft' && (
          <TabsContent value="visibility">
            <TenderVisibilityList 
              tender={tender} 
              partners={partners}
              solutions={solutions}
              verticals={verticals}
            />
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

      {/* Submit Interest Dialog */}
      {showInterestDialog && (
        <SubmitTenderInterest
          open={showInterestDialog}
          onClose={() => setShowInterestDialog(false)}
          tender={tender}
          partnerId={partnerId}
        />
      )}

      {/* Submit Proposal Dialog */}
      {showProposalDialog && (
        <SubmitTenderProposal
          open={showProposalDialog}
          onClose={() => setShowProposalDialog(false)}
          tender={tender}
          partnerId={partnerId}
        />
      )}
    </div>
  );
}