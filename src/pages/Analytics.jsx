import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, Users, Briefcase, Award, DollarSign, Target } from 'lucide-react';

export default function Analytics() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Strategic Analytics</h1>
        <p className="text-slate-600 mt-2">Network intelligence and performance insights</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">Network</Badge>
            </div>
            <p className="text-sm text-slate-600">Active Partners</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              {partners.filter(p => p.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <Badge className="bg-green-100 text-green-800">Revenue</Badge>
            </div>
            <p className="text-sm text-slate-600">Quarterly Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">
              €{(totalRevenue / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-800">Quality</Badge>
            </div>
            <p className="text-sm text-slate-600">Avg Tier Score</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{avgTierScore}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-amber-600" />
              <Badge className="bg-amber-100 text-amber-800">Compliance</Badge>
            </div>
            <p className="text-sm text-slate-600">Cert. Compliance</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{certificationCompliance}%</p>
          </CardContent>
        </Card>
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
    </div>
  );
}