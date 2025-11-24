import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Award, CheckCircle2, AlertTriangle, AlertCircle, BookOpen, Briefcase } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PartnerTrainingStatus from '../components/training/PartnerTrainingStatus';
import PartnerTrainingSuggestionDialog from '../components/training/PartnerTrainingSuggestionDialog';

export default function QualificationsView() {
  const { isAdmin, partnerId } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestionProduct, setSuggestionProduct] = useState(null);

  const { data: certifications = [] } = useQuery({
    queryKey: ['certifications', partnerId],
    queryFn: async () => {
      const allCerts = await base44.entities.Certification.list('-expiry_date');
      return isAdmin ? allCerts : allCerts.filter(c => c.partner_id === partnerId);
    },
  });

  const { data: capabilities = [] } = useQuery({
    queryKey: ['partner-solution-capabilities', partnerId],
    queryFn: async () => {
      const allCaps = await base44.entities.PartnerSolutionCapability.list();
      return isAdmin ? allCaps : allCaps.filter(c => c.partner_id === partnerId);
    },
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: isAdmin,
  });

  const { data: currentPartner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const all = await base44.entities.Partner.list();
      return all.find(p => p.id === partnerId);
    },
    enabled: !!partnerId && !isAdmin,
  });

  const getCertificationStatus = (cert) => {
    const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'valid';
  };

  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'Unknown';
  const getPartnerName = (id) => partners.find(p => p.id === id)?.company_name || 'Unknown';

  const filteredCertifications = certifications.filter(cert => 
    cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSolutionName(cert.solution_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCapabilities = capabilities.filter(cap =>
    getSolutionName(cap.solution_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig = {
    valid: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Valid' },
    expiring_soon: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle, label: 'Expiring Soon' },
    expired: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Expired' },
  };

  const levelColors = {
    beginner: 'bg-blue-100 text-blue-800',
    competent: 'bg-green-100 text-green-800',
    proficient: 'bg-amber-100 text-amber-800',
    expert: 'bg-purple-100 text-purple-800',
  };

  const validCerts = certifications.filter(c => getCertificationStatus(c) === 'valid').length;
  const expiringCerts = certifications.filter(c => getCertificationStatus(c) === 'expiring_soon').length;
  const expiredCerts = certifications.filter(c => getCertificationStatus(c) === 'expired').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Qualifications</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            {isAdmin 
              ? 'View partner certifications and capabilities across your network. For system configuration, use Qualifications Manager.' 
              : 'Your complete qualification profile: formal certifications and recognized expertise. Keep track of validity and required renewals.'}
          </p>
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>About this view:</strong> This displays your formal certifications (earned through training) 
              and solution capabilities (proven through project delivery). Valid certifications are required for 
              tender participation and directly influence your bonus calculations.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Certifications</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{certifications.length}</p>
              </div>
              <Award className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Valid Certifications</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{validCerts}</p>
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
                <p className="text-2xl font-bold text-yellow-600 mt-1">{expiringCerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expired Certifications</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{expiredCerts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {!isAdmin && currentPartner && (
        <PartnerTrainingStatus 
          partner={{
            ...currentPartner,
            onWarningClick: (product) => setSuggestionProduct(product)
          }}
        />
      )}

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by certification or solution name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="certifications" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="certifications">Formal Certifications</TabsTrigger>
          <TabsTrigger value="capabilities">Solution Capabilities</TabsTrigger>
        </TabsList>

        <TabsContent value="certifications">
          <div className="space-y-4">
            {filteredCertifications.map(cert => {
              const status = getCertificationStatus(cert);
              const config = statusConfig[status];
              const Icon = config.icon;
              const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());

              return (
                <Card key={cert.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 mb-1">{cert.certification_name}</h3>
                            {isAdmin && (
                              <p className="text-sm text-slate-600 mb-2">{getPartnerName(cert.partner_id)}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <Badge className={`${config.color} border font-medium`}>
                                {config.label}
                              </Badge>
                              {cert.solution_id && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {getSolutionName(cert.solution_id)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:min-w-[240px] space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Issue Date</p>
                            <p className="font-medium text-slate-900">{format(new Date(cert.issue_date), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Expiry Date</p>
                            <p className="font-medium text-slate-900">{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        {status === 'expiring_soon' && daysUntilExpiry >= 0 && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <span className="text-xs text-yellow-800 font-medium">
                              Expires in {daysUntilExpiry} days
                            </span>
                          </div>
                        )}
                        {status === 'expired' && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-center">
                            <span className="text-xs text-red-800 font-medium">
                              Expired {Math.abs(daysUntilExpiry)} days ago
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredCertifications.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-16 text-center">
                  <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No certifications found</h3>
                  <p className="text-slate-500">Complete training sessions to earn certifications</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="capabilities">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCapabilities.map(cap => (
              <Card key={cap.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${levelColors[cap.overall_level]}`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">{getSolutionName(cap.solution_id)}</h3>
                      {isAdmin && (
                        <p className="text-sm text-slate-600 mb-2">{getPartnerName(cap.partner_id)}</p>
                      )}
                      <Badge className={`${levelColors[cap.overall_level]} border font-semibold`}>
                        {cap.overall_level?.toUpperCase() || 'BEGINNER'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Projects Completed</p>
                      <p className="font-bold text-slate-900">{cap.projects_completed || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Certified Members</p>
                      <p className="font-bold text-slate-900">{cap.certified_team_members || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Total Revenue</p>
                      <p className="font-bold text-slate-900">€{((cap.total_revenue || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Success Rate</p>
                      <p className="font-bold text-slate-900">{cap.success_rate || 100}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCapabilities.length === 0 && (
              <Card className="shadow-sm col-span-full">
                <CardContent className="py-16 text-center">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No solution capabilities found</h3>
                  <p className="text-slate-500">Complete projects to build solution expertise</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {suggestionProduct && (
        <PartnerTrainingSuggestionDialog
          open={!!suggestionProduct}
          onClose={() => setSuggestionProduct(null)}
          productCode={suggestionProduct}
        />
      )}
    </div>
  );
}