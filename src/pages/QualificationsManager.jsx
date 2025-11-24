import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Award, CheckCircle2, AlertCircle, Plus, Briefcase, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AddCertificationDialog from '../components/certifications/AddCertificationDialog';

export default function QualificationsManager() {
  const queryClient = useQueryClient();
  const [showAddCertDialog, setShowAddCertDialog] = useState(false);

  const { data: certifications = [] } = useQuery({
    queryKey: ['certifications'],
    queryFn: () => base44.entities.Certification.list('-expiry_date'),
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['partner-solution-capabilities'],
    queryFn: () => base44.entities.PartnerSolutionCapability.list(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: () => base44.entities.TrainingSession.list(),
  });

  // Stats for overview
  const totalCertifications = certifications.length;
  const validCertifications = certifications.filter(c => {
    const daysUntilExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0;
  }).length;
  const expiringSoon = certifications.filter(c => {
    const daysUntilExpiry = Math.floor((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  }).length;
  const totalCapabilities = capabilities.length;
  const expertCapabilities = capabilities.filter(c => c.overall_level === 'expert').length;

  // Identify partners missing certifications for their authorized products
  const partnersWithGaps = partners.filter(p => {
    const partnerCerts = certifications.filter(c => c.partner_id === p.id);
    const authorizedProducts = p.assa_abloy_products || [];
    const certifiedProducts = partnerCerts.map(c => c.assa_abloy_product).filter(Boolean);
    return authorizedProducts.some(prod => !certifiedProducts.includes(prod));
  });

  // Upcoming training sessions that issue certifications
  const upcomingCertificationTrainings = trainingSessions.filter(t => 
    t.issues_certification && 
    new Date(t.session_date) > new Date() &&
    t.status !== 'cancelled'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Qualifications Manager</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            Configure and oversee the qualification system that governs partner capabilities, certifications, and tender eligibility across your network.
          </p>
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Settings className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Admin Control Center:</strong> Use this module to define certification requirements, manage manual qualifications, 
              and monitor network-wide compliance. Certifications issued here automatically influence tender eligibility and bonus calculations.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-l-4 border-l-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Certifications</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{totalCertifications}</p>
              </div>
              <Award className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Currently Valid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{validCertifications}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{expiringSoon}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Capabilities</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{totalCapabilities}</p>
              </div>
              <Briefcase className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expert Level</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{expertCapabilities}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="certification-control" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="certification-control">Certification Control</TabsTrigger>
          <TabsTrigger value="compliance-gaps">Compliance Gaps</TabsTrigger>
          <TabsTrigger value="automation-rules">Automation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="certification-control">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Manual Certification Management</CardTitle>
                <Button onClick={() => setShowAddCertDialog(true)} className="bg-blue-900 hover:bg-blue-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Certification
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Manual Override:</strong> Use this to issue certifications outside the normal training flow 
                  (e.g., legacy recognition, external certifications). All actions are audit-logged.
                </AlertDescription>
              </Alert>
              <div className="mt-6 space-y-3">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Recent Manual Certifications</h3>
                  <p className="text-sm text-slate-600">
                    {certifications.filter(c => !c.training_session_id).length} certifications issued manually
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Upcoming Auto-Certifications</h3>
                  <p className="text-sm text-blue-700">
                    {upcomingCertificationTrainings} training sessions scheduled that will auto-issue certifications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance-gaps">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Partner Certification Gaps</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Gap Analysis:</strong> Partners below are authorized to sell specific ASSA ABLOY products 
                  but lack valid certifications. They may be ineligible for relevant tenders.
                </AlertDescription>
              </Alert>
              {partnersWithGaps.length > 0 ? (
                <div className="space-y-3">
                  {partnersWithGaps.slice(0, 10).map(partner => {
                    const partnerCerts = certifications.filter(c => c.partner_id === partner.id);
                    const authorizedProducts = partner.assa_abloy_products || [];
                    const certifiedProducts = partnerCerts.map(c => c.assa_abloy_product).filter(Boolean);
                    const missingProducts = authorizedProducts.filter(prod => !certifiedProducts.includes(prod));

                    return (
                      <Card key={partner.id} className="shadow-sm border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-slate-900">{partner.company_name}</h3>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {missingProducts.map(prod => (
                                  <Badge key={prod} className="bg-red-100 text-red-800 border-red-300">
                                    Missing: {prod}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {missingProducts.length} gap{missingProducts.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {partnersWithGaps.length > 10 && (
                    <p className="text-sm text-slate-500 text-center pt-2">
                      And {partnersWithGaps.length - 10} more partners with gaps...
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Full Compliance</h3>
                  <p className="text-slate-500">All partners have certifications for their authorized products</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation-rules">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Certification Automation Rules</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Active Automation:</strong> Certifications are automatically created when training attendance is confirmed 
                  in the Training Manager. This ensures real-time qualification updates and eliminates manual data entry.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Training Completion → Auto-Certification</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        When admin confirms attendance in Training Manager for sessions marked "issues_certification", 
                        a Certification record is automatically created for each attendee.
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>• Certification name: Based on product and training title</div>
                        <div>• Issue date: Training session date</div>
                        <div>• Expiry date: Calculated from certification_valid_for_months (default: 12 months)</div>
                        <div>• Status: Automatically set to "valid"</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Project Completion → Capability Update</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        When projects are marked complete, PartnerSolutionCapability records are automatically updated 
                        to reflect proven expertise in specific solutions.
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>• Projects completed count increments</div>
                        <div>• Total revenue tracked per solution</div>
                        <div>• Success rate calculated from project ratings</div>
                        <div>• Overall level promoted based on experience thresholds</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Future Automation Opportunities</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Auto-notify partners 60 days before certification expiry</li>
                    <li>• Auto-register partners for mandatory renewal trainings</li>
                    <li>• Auto-flag projects where partner lacks required certifications</li>
                    <li>• Auto-escalate to admin when certified team member leaves</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showAddCertDialog && (
        <AddCertificationDialog
          open={showAddCertDialog}
          onClose={() => setShowAddCertDialog(false)}
          partners={partners}
          solutions={solutions}
        />
      )}
    </div>
  );
}