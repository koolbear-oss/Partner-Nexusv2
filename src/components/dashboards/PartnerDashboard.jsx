import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function PartnerDashboard() {
  const { user, partnerId } = useCurrentUser();

  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['partner-projects'],
    queryFn: () => base44.entities.Project.list(),
    enabled: !!partnerId,
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['partner-certifications'],
    queryFn: () => base44.entities.Certification.list(),
    enabled: !!partnerId,
  });

  const { data: competencies = [] } = useQuery({
    queryKey: ['partner-competencies'],
    queryFn: () => base44.entities.Competency.list(),
    enabled: !!partnerId,
  });

  if (!partner) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Partner Profile Found</h2>
          <p className="text-slate-600">Please contact administrator to set up your partner profile.</p>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'in_progress' || p.status === 'assigned').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const expiringCerts = certifications.filter(c => c.status === 'expiring_soon').length;
  const verifiedCompetencies = competencies.filter(c => c.verified).length;

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  const statusColors = {
    'in_progress': 'bg-blue-100 text-blue-800',
    'completed': 'bg-green-100 text-green-800',
    'assigned': 'bg-cyan-100 text-cyan-800',
  };

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{partner.company_name}</h1>
          <Badge className={`${tierColors[partner.tier]} border text-sm font-bold px-3 py-1`}>
            {partner.tier.toUpperCase()}
          </Badge>
        </div>
        <p className="text-slate-600">Welcome back, {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Projects</CardTitle>
            <Briefcase className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{activeProjects}</div>
            <p className="text-xs text-slate-500 mt-2">{completedProjects} completed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tier Score</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{partner.tier_score}</div>
            <p className="text-xs text-slate-500 mt-2">Out of 100</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Certifications</CardTitle>
            <Award className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{certifications.length}</div>
            <p className="text-xs text-slate-500 mt-2">
              {expiringCerts > 0 ? `${expiringCerts} expiring soon` : 'All valid'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-600 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Competencies</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{verifiedCompetencies}</div>
            <p className="text-xs text-slate-500 mt-2">Verified</p>
          </CardContent>
        </Card>
      </div>

      {expiringCerts > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-semibold text-yellow-900">Certification Renewal Required</div>
                <div className="text-sm text-yellow-700 mt-1">
                  {expiringCerts} certification{expiringCerts > 1 ? 's' : ''} expiring within 30 days
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Your Performance</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Projects Completed</span>
                <span className="font-bold text-slate-900">{partner.projects_completed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Average Rating</span>
                <span className="font-bold text-amber-600">
                  {partner.avg_project_rating > 0 ? `${partner.avg_project_rating.toFixed(1)} ★` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Quarterly Revenue</span>
                <span className="font-bold text-green-700">€{(partner.quarterly_revenue / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
                    <div className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-slate-900 text-sm">{project.project_name}</div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[project.status]}`}>
                          {project.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">{project.client_name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No projects assigned yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}