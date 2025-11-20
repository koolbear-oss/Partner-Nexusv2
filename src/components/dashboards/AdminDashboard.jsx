import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle,
  Award,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AdminDashboard() {
  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const activePartners = partners.filter(p => p.status === 'active').length;
  const pendingOnboarding = partners.filter(p => p.status === 'pending_onboarding').length;
  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'assigned').length;
  const tenderProjects = projects.filter(p => p.status === 'tender_stage' || p.status === 'partner_matching').length;
  const expiringCerts = partners.reduce((sum, p) => sum + (p.certifications_expiring_soon || 0), 0);
  const totalQuarterlyRevenue = partners.reduce((sum, p) => sum + (p.quarterly_revenue || 0), 0);

  const topPerformers = [...partners]
    .filter(p => p.status === 'active')
    .sort((a, b) => b.tier_score - a.tier_score)
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusColors = {
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'tender_stage': 'bg-purple-100 text-purple-800',
    'partner_matching': 'bg-amber-100 text-amber-800',
    'assigned': 'bg-cyan-100 text-cyan-800',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Network Overview</h1>
        <p className="text-slate-600 mt-2">Administrator view - All partners and projects</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Partners</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activePartners}</div>
            <p className="text-xs text-slate-500 mt-2">
              {pendingOnboarding > 0 && `+${pendingOnboarding} pending`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Projects</CardTitle>
            <Briefcase className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeProjects}</div>
            <p className="text-xs text-slate-500 mt-2">{tenderProjects} in tender stage</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Quarterly Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              €{(totalQuarterlyRevenue / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> Network-wide
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Cert Alerts</CardTitle>
            <Award className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{expiringCerts}</div>
            <p className="text-xs text-slate-500 mt-2">Expiring soon</p>
          </CardContent>
        </Card>
      </div>

      {expiringCerts > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <div className="font-semibold text-red-900">Network-wide Certification Alerts</div>
                <div className="text-sm text-red-700 mt-1">
                  {expiringCerts} certifications expiring within 30 days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Top Performing Partners</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {topPerformers.map((partner, index) => (
                <Link key={partner.id} to={createPageUrl(`PartnerDetail?id=${partner.id}`)}>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-slate-300 text-slate-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-slate-200 text-slate-600'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{partner.company_name}</div>
                        <div className="text-sm text-slate-500">
                          {partner.projects_completed} projects • {partner.avg_project_rating.toFixed(1)} ★
                        </div>
                      </div>
                    </div>
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${tierColors[partner.tier]}`}>
                      {partner.tier.toUpperCase()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Project Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                  <div className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-semibold text-slate-900">{project.project_name}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[project.status]}`}>
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">{project.client_name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}