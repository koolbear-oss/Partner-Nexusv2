import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Users, Briefcase, Award, DollarSign, Target, Download, Calendar } from 'lucide-react';
import PerformanceReportCard from '../components/analytics/PerformanceReportCard';

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: bonuses = [] } = useQuery({
    queryKey: ['bonuses'],
    queryFn: () => base44.entities.BonusCalculation.list(),
  });

  const { data: tierScores = [] } = useQuery({
    queryKey: ['tier-scores'],
    queryFn: () => base44.entities.TierScore.list('-calculation_date', 50),
  });

  const { data: serviceCoverageOptions = [] } = useQuery({
    queryKey: ['serviceCoverageOptions'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'service_region_language' && v.active);
    },
  });

  // Partner Tier Distribution
  const tierData = [
    { name: 'Platinum', value: partners.filter(p => p.tier === 'platinum').length, color: '#9333ea' },
    { name: 'Gold', value: partners.filter(p => p.tier === 'gold').length, color: '#eab308' },
    { name: 'Silver', value: partners.filter(p => p.tier === 'silver').length, color: '#94a3b8' },
    { name: 'Bronze', value: partners.filter(p => p.tier === 'bronze').length, color: '#f97316' },
    { name: 'Entry', value: partners.filter(p => p.tier === 'entry').length, color: '#6b7280' },
  ];

  // Partner Type Distribution
  const typeData = [
    { name: 'Integrator', value: partners.filter(p => p.partner_type === 'integrator').length },
    { name: 'Installer', value: partners.filter(p => p.partner_type === 'installer').length },
    { name: 'Tech Partner', value: partners.filter(p => p.partner_type === 'technology_partner').length },
    { name: 'Service', value: partners.filter(p => p.partner_type === 'service_provider').length },
    { name: 'Distributor', value: partners.filter(p => p.partner_type === 'distributor').length },
  ].sort((a, b) => b.value - a.value);

  // Project Status Distribution
  const projectStatusData = [
    { name: 'Tender', value: projects.filter(p => p.status === 'tender_stage').length },
    { name: 'Matching', value: projects.filter(p => p.status === 'partner_matching').length },
    { name: 'Assigned', value: projects.filter(p => p.status === 'assigned').length },
    { name: 'Active', value: projects.filter(p => p.status === 'in_progress').length },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length },
  ];

  // Revenue by Tier
  const revenueByTier = [
    { tier: 'Platinum', revenue: partners.filter(p => p.tier === 'platinum').reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0) },
    { tier: 'Gold', revenue: partners.filter(p => p.tier === 'gold').reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0) },
    { tier: 'Silver', revenue: partners.filter(p => p.tier === 'silver').reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0) },
    { tier: 'Bronze', revenue: partners.filter(p => p.tier === 'bronze').reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0) },
    { tier: 'Entry', revenue: partners.filter(p => p.tier === 'entry').reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0) },
  ];

  // Top performers
  const topPartners = [...partners]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.tier_score - a.tier_score)
    .slice(0, 5);

  // Vertical market performance
  const verticalPerformance = verticals.map(vertical => {
    const verticalProjects = projects.filter(p => p.vertical_id === vertical.code || p.vertical_id === vertical.id);
    return {
      name: vertical.name,
      projects: verticalProjects.length,
      value: verticalProjects.reduce((sum, p) => sum + (p.estimated_value || 0), 0),
    };
  }).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  const totalRevenue = partners.reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0);
  const avgTierScore = partners.length > 0 
    ? (partners.reduce((sum, p) => sum + (p.tier_score || 0), 0) / partners.length).toFixed(1)
    : 0;
  const certificationCompliance = partners.length > 0
    ? ((partners.filter(p => p.certifications_valid).length / partners.length) * 100).toFixed(0)
    : 0;

  const totalBonusPaid = bonuses.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_bonus || b.bonus_amount || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Strategic Analytics</h1>
          <p className="text-slate-600 mt-2">Network intelligence and performance insights</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="partners">Partner Analytics</TabsTrigger>
          <TabsTrigger value="projects">Project Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="coverage">Regional Coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PerformanceReportCard
          title="Active Partners"
          currentValue={partners.filter(p => p.status === 'active').length}
          icon={Users}
          color="blue"
        />
        <PerformanceReportCard
          title="Quarterly Revenue"
          currentValue={`${(totalRevenue / 1000).toFixed(0)}K`}
          unit="€"
          icon={DollarSign}
          color="green"
        />
        <PerformanceReportCard
          title="Completed Projects"
          currentValue={completedProjects}
          icon={Briefcase}
          color="purple"
        />
        <PerformanceReportCard
          title="Total Bonuses Paid"
          currentValue={`${(totalBonusPaid / 1000).toFixed(0)}K`}
          unit="€"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Partner Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Partner Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Pipeline Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTier}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tier" />
                <YAxis />
                <Tooltip formatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Vertical Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Partners by Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPartners.map((partner, idx) => (
                <div key={partner.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-slate-300 text-slate-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{partner.company_name}</div>
                      <div className="text-xs text-slate-500">{partner.tier} tier</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-900">{partner.tier_score}</div>
                    <div className="text-xs text-slate-500">score</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Vertical Market Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verticalPerformance.map((vertical, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-slate-900">{vertical.name}</div>
                    <div className="text-xs text-slate-500">{vertical.projects} projects</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-700">
                      €{(vertical.value / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="partners" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Partner Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Revenue by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByTier}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tier" />
                    <YAxis />
                    <Tooltip formatter={(value) => `€${(value / 1000).toFixed(0)}K`} />
                    <Bar dataKey="revenue" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Pipeline Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Vertical Market Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verticalPerformance.map((vertical, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-slate-900">{vertical.name}</div>
                        <div className="text-xs text-slate-500">{vertical.projects} projects</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-700">
                          €{(vertical.value / 1000).toFixed(0)}K
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Top Performers by Revenue */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Partners by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...partners]
                  .filter(p => p.status === 'active')
                  .sort((a, b) => (b.quarterly_revenue || 0) - (a.quarterly_revenue || 0))
                  .slice(0, 10)
                  .map((partner, idx) => (
                    <div key={partner.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-slate-300 text-slate-700' :
                          idx === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{partner.company_name}</div>
                          <div className="text-xs text-slate-500">{partner.tier} tier • {partner.partner_type.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-700">€{((partner.quarterly_revenue || 0) / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-slate-500">quarterly</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers by Vertical */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top Performers by Vertical Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {verticals.slice(0, 5).map(vertical => {
                  const verticalPartners = partners
                    .filter(p => p.verticals?.includes(vertical.code) || p.verticals?.includes(vertical.id))
                    .filter(p => p.status === 'active')
                    .map(p => {
                      const verticalProjects = projects.filter(pr => 
                        (pr.vertical_id === vertical.code || pr.vertical_id === vertical.id) && 
                        pr.assigned_partner_id === p.id &&
                        pr.status === 'completed'
                      );
                      return {
                        ...p,
                        verticalRevenue: verticalProjects.reduce((sum, pr) => sum + (pr.final_value || 0), 0),
                        verticalProjects: verticalProjects.length
                      };
                    })
                    .filter(p => p.verticalRevenue > 0)
                    .sort((a, b) => b.verticalRevenue - a.verticalRevenue)
                    .slice(0, 3);

                  return (
                    <div key={vertical.id} className="border-l-4 border-l-blue-500 pl-4">
                      <h3 className="font-bold text-slate-900 mb-3">{vertical.name}</h3>
                      {verticalPartners.length > 0 ? (
                        <div className="space-y-2">
                          {verticalPartners.map((partner, idx) => (
                            <div key={partner.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-slate-200 text-slate-700">#{idx + 1}</Badge>
                                <div>
                                  <div className="font-medium text-sm text-slate-900">{partner.company_name}</div>
                                  <div className="text-xs text-slate-500">{partner.verticalProjects} projects</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700">€{(partner.verticalRevenue / 1000).toFixed(0)}K</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No completed projects yet</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers by Solution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top Performers by Solution Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {solutions.slice(0, 5).map(solution => {
                  const solutionPartners = partners
                    .filter(p => p.solutions?.includes(solution.code) || p.solutions?.includes(solution.id))
                    .filter(p => p.status === 'active')
                    .map(p => {
                      const solutionProjects = projects.filter(pr => 
                        (pr.solution_ids?.includes(solution.code) || 
                         pr.solution_ids?.includes(solution.id) ||
                         pr.primary_solution === solution.code ||
                         pr.primary_solution === solution.id) && 
                        pr.assigned_partner_id === p.id &&
                        pr.status === 'completed'
                      );
                      return {
                        ...p,
                        solutionRevenue: solutionProjects.reduce((sum, pr) => sum + (pr.final_value || 0), 0),
                        solutionProjects: solutionProjects.length
                      };
                    })
                    .filter(p => p.solutionRevenue > 0)
                    .sort((a, b) => b.solutionRevenue - a.solutionRevenue)
                    .slice(0, 3);

                  return (
                    <div key={solution.id} className="border-l-4 border-l-purple-500 pl-4">
                      <h3 className="font-bold text-slate-900 mb-3">{solution.name}</h3>
                      {solutionPartners.length > 0 ? (
                        <div className="space-y-2">
                          {solutionPartners.map((partner, idx) => (
                            <div key={partner.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-slate-200 text-slate-700">#{idx + 1}</Badge>
                                <div>
                                  <div className="font-medium text-sm text-slate-900">{partner.company_name}</div>
                                  <div className="text-xs text-slate-500">{partner.solutionProjects} projects</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700">€{(partner.solutionRevenue / 1000).toFixed(0)}K</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No completed projects yet</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers by Tier Score */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top 10 Partners by Tier Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...partners]
                  .filter(p => p.status === 'active')
                  .sort((a, b) => (b.tier_score || 0) - (a.tier_score || 0))
                  .slice(0, 10)
                  .map((partner, idx) => (
                    <div key={partner.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                          idx === 1 ? 'bg-slate-300 text-slate-700' :
                          idx === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-slate-200 text-slate-600'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{partner.company_name}</div>
                          <div className="text-xs text-slate-500">{partner.tier} tier • {partner.projects_completed || 0} projects</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">{partner.tier_score || 0}</div>
                        <div className="text-xs text-slate-500">score</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coverage" className="space-y-6">
          {/* Top Performers by Service Coverage */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top Performers by Regional Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {serviceCoverageOptions.map(coverage => {
                  const coveragePartners = partners
                    .filter(p => p.service_coverage?.includes(coverage.value))
                    .filter(p => p.status === 'active')
                    .map(p => {
                      const coverageProjects = projects.filter(pr => 
                        pr.required_service_coverage?.includes(coverage.value) &&
                        pr.assigned_partner_id === p.id &&
                        pr.status === 'completed'
                      );
                      return {
                        ...p,
                        coverageRevenue: coverageProjects.reduce((sum, pr) => sum + (pr.final_value || 0), 0),
                        coverageProjects: coverageProjects.length
                      };
                    })
                    .filter(p => p.coverageRevenue > 0)
                    .sort((a, b) => b.coverageRevenue - a.coverageRevenue)
                    .slice(0, 3);

                  return (
                    <div key={coverage.value} className="border-l-4 border-l-indigo-500 pl-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-bold text-slate-900">{coverage.label}</h3>
                        <Badge variant="outline" className="text-xs">{coverage.description}</Badge>
                      </div>
                      {coveragePartners.length > 0 ? (
                        <div className="space-y-2">
                          {coveragePartners.map((partner, idx) => (
                            <div key={partner.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-slate-200 text-slate-700">#{idx + 1}</Badge>
                                <div>
                                  <div className="font-medium text-sm text-slate-900">{partner.company_name}</div>
                                  <div className="text-xs text-slate-500">{partner.coverageProjects} projects</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700">€{(partner.coverageRevenue / 1000).toFixed(0)}K</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500">No completed projects yet</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Coverage Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Partner Coverage Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serviceCoverageOptions.map(coverage => {
                  const count = partners.filter(p => p.service_coverage?.includes(coverage.value)).length;
                  const percentage = partners.length > 0 ? (count / partners.length) * 100 : 0;
                  return (
                    <div key={coverage.value} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-900">{coverage.label}</span>
                        <span className="text-slate-600">{count} partners ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}