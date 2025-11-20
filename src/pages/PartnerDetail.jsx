import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Users, 
  TrendingUp,
  Award,
  Briefcase,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function PartnerDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['partner-projects', partnerId],
    queryFn: async () => {
      const allProjects = await base44.entities.Project.list();
      return allProjects.filter(p => p.assigned_partner_id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['partner-certifications', partnerId],
    queryFn: async () => {
      const allCerts = await base44.entities.Certification.list();
      return allCerts.filter(c => c.partner_id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  if (isLoading || !partner) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending_onboarding: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  const getSolutionName = (code) => {
    const solution = solutions.find(s => s.code === code);
    return solution?.name || code;
  };

  const getVerticalName = (code) => {
    const vertical = verticals.find(v => v.code === code);
    return vertical?.name || code;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={createPageUrl('Partners')}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partners</span>
        </button>
      </Link>

      {/* Header Card */}
      <Card className="shadow-md border-t-4 border-t-blue-600">
        <CardContent className="pt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">{partner.company_name}</h1>
                <Badge className={`${tierColors[partner.tier]} border text-sm font-bold px-3 py-1`}>
                  {partner.tier.toUpperCase()}
                </Badge>
                <Badge className={`${statusColors[partner.status]} text-sm px-3 py-1`}>
                  {partner.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="font-medium">{partner.contact_email}</div>
                  </div>
                </div>
                {partner.contact_phone && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Phone</div>
                      <div className="font-medium">{partner.contact_phone}</div>
                    </div>
                  </div>
                )}
                {partner.address && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Address</div>
                      <div className="font-medium">{partner.address}</div>
                    </div>
                  </div>
                )}
                {partner.website && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Globe className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Website</div>
                      <a href={`https://${partner.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {partner.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {partner.partner_type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline" className="bg-slate-50">
                  <Users className="w-3 h-3 mr-1" />
                  {partner.employee_count} employees
                </Badge>
                {partner.onboarding_date && (
                  <Badge variant="outline" className="bg-slate-50">
                    <Calendar className="w-3 h-3 mr-1" />
                    Since {new Date(partner.onboarding_date).getFullYear()}
                  </Badge>
                )}
              </div>
            </div>

            <div className="lg:min-w-[280px]">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-blue-900 mb-1">{partner.tier_score}</div>
                    <div className="text-sm text-blue-700 font-medium">Tier Score</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">{partner.projects_completed}</div>
                      <div className="text-xs text-blue-700">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {partner.avg_project_rating > 0 ? partner.avg_project_rating.toFixed(1) : '-'}
                      </div>
                      <div className="text-xs text-blue-700">Avg Rating</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!partner.certifications_valid && (
          <Card className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold text-red-900">Certification Issues</div>
                  <div className="text-sm text-red-700">Some certifications are invalid or expired</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {partner.bonus_eligible && (
          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-semibold text-green-900">Bonus Eligible</div>
                  <div className="text-sm text-green-700">Last bonus: €{partner.last_bonus_amount?.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Solutions Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {partner.solutions?.map(code => (
                    <Badge key={code} className="bg-blue-100 text-blue-800 border-blue-200 border px-3 py-1">
                      {getSolutionName(code)}
                    </Badge>
                  ))}
                  {(!partner.solutions || partner.solutions.length === 0) && (
                    <div className="text-sm text-slate-500">No solutions assigned</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Vertical Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {partner.verticals?.map(code => (
                    <Badge key={code} className="bg-purple-100 text-purple-800 border-purple-200 border px-3 py-1">
                      {getVerticalName(code)}
                    </Badge>
                  ))}
                  {(!partner.verticals || partner.verticals.length === 0) && (
                    <div className="text-sm text-slate-500">No verticals assigned</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-slate-500 mb-1">Revenue Last Year</div>
                  <div className="text-2xl font-bold text-slate-900">
                    €{(partner.revenue_last_year / 1000).toFixed(0)}K
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Quarterly Revenue</div>
                  <div className="text-2xl font-bold text-slate-900">
                    €{(partner.quarterly_revenue / 1000).toFixed(0)}K
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1">Last Bonus</div>
                  <div className="text-2xl font-bold text-green-700">
                    €{partner.last_bonus_amount?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {partner.notes && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{partner.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projects">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Partner Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map(project => (
                    <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                      <div className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold text-slate-900">{project.project_name}</div>
                          <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {project.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">{project.client_name}</div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>€{(project.estimated_value / 1000).toFixed(0)}K</span>
                          {project.final_rating > 0 && (
                            <>
                              <span>•</span>
                              <span>Rating: {project.final_rating.toFixed(1)} ★</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No projects assigned yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-3">
                  {certifications.map(cert => (
                    <div key={cert.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-slate-900">{cert.certification_name}</div>
                        <Badge className={
                          cert.status === 'valid' ? 'bg-green-100 text-green-800' :
                          cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {cert.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {cert.certified_technician_name && (
                        <div className="text-sm text-slate-600 mb-1">
                          Technician: {cert.certified_technician_name}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No certifications on record
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">Projects Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{partner.projects_completed}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">{partner.projects_active}</div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">Average Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {partner.avg_project_rating > 0 ? `${partner.avg_project_rating.toFixed(1)} ★` : '-'}
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-slate-600">Tier Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">{partner.tier_score}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}