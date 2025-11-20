import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Calendar, MapPin, DollarSign, Users, FileText, 
  MessageSquare, CheckCircle2, AlertCircle, Clock, TrendingUp 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { format } from 'date-fns';

export default function ProjectDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const { isAdmin } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.list();
      return projects.find(p => p.id === projectId);
    },
    enabled: !!projectId,
  });

  const { data: partner } = useQuery({
    queryKey: ['partner', project?.assigned_partner_id],
    queryFn: async () => {
      if (!project?.assigned_partner_id) return null;
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === project.assigned_partner_id);
    },
    enabled: !!project?.assigned_partner_id,
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', project?.assigned_partner_id],
    queryFn: async () => {
      if (!project?.assigned_partner_id) return [];
      const all = await base44.entities.TeamMember.list();
      return all.filter(tm => project.assigned_team_members?.includes(tm.id));
    },
    enabled: !!project?.assigned_partner_id && !!project?.assigned_team_members,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['project', projectId]),
  });

  if (isLoading || !project) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const statusColors = {
    tender_stage: 'bg-yellow-100 text-yellow-800',
    partner_matching: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-slate-100 text-slate-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const healthColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  const getSolutionName = (id) => solutions.find(s => s.id === id || s.code === id)?.name || 'Unknown';
  const getVerticalName = (id) => verticals.find(v => v.id === id || v.code === id)?.name || 'Unknown';

  const phaseProgress = project.phase_history?.length 
    ? (project.phase_history.filter(ph => ph.completed).length / project.phase_history.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <Link to={createPageUrl('Projects')}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </Link>

      {/* Header */}
      <Card className="shadow-md border-t-4 border-t-blue-600">
        <CardContent className="pt-8">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-slate-900">{project.project_name}</h1>
                <Badge className={statusColors[project.status]}>
                  {project.status.replace(/_/g, ' ')}
                </Badge>
                {project.health_status && (
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${healthColors[project.health_status]}`} />
                    <span className="text-sm text-slate-600">
                      {project.overall_status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              {project.project_code && (
                <p className="text-sm text-slate-500 mb-2">Project Code: {project.project_code}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <Users className="w-5 h-5" />
                  <div>
                    <div className="text-xs text-slate-500">Client</div>
                    <div className="font-medium">{project.client_name}</div>
                  </div>
                </div>
                {project.estimated_value && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Estimated Value</div>
                      <div className="font-medium">€{(project.estimated_value / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                )}
                {project.deadline && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Deadline</div>
                      <div className="font-medium">{format(new Date(project.deadline), 'MMM d, yyyy')}</div>
                    </div>
                  </div>
                )}
                {project.project_location?.city && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5" />
                    <div>
                      <div className="text-xs text-slate-500">Location</div>
                      <div className="font-medium">{project.project_location.city}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {project.primary_solution && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {getSolutionName(project.primary_solution)}
                  </Badge>
                )}
                {project.vertical_id && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {getVerticalName(project.vertical_id)}
                  </Badge>
                )}
                {project.complexity && (
                  <Badge variant="outline" className={
                    project.complexity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                    project.complexity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-slate-50'
                  }>
                    {project.complexity} complexity
                  </Badge>
                )}
              </div>
            </div>

            {partner && (
              <div className="lg:min-w-[280px]">
                <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                  <CardContent className="pt-6">
                    <div className="text-center mb-4">
                      <div className="text-sm text-slate-600 mb-1">Assigned Partner</div>
                      <div className="text-xl font-bold text-slate-900 mb-2">{partner.company_name}</div>
                      <Badge className="bg-slate-200 text-slate-700">{partner.tier}</Badge>
                    </div>
                    {teamMembers.length > 0 && (
                      <div className="pt-4 border-t border-slate-200">
                        <div className="text-xs text-slate-600 mb-2">Team Members</div>
                        <div className="space-y-1">
                          {teamMembers.slice(0, 3).map(tm => (
                            <div key={tm.id} className="text-sm text-slate-700">
                              {tm.first_name} {tm.last_name}
                            </div>
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="text-xs text-slate-500">+{teamMembers.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          {project.status === 'completed' && <TabsTrigger value="completion">Completion</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">Project Type</div>
                  <div className="text-slate-900">{project.project_type?.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700 mb-1">Source</div>
                  <div className="text-slate-900">{project.source?.replace(/_/g, ' ')}</div>
                </div>
                {project.customer_contact && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Customer Contact</div>
                    <div className="text-slate-900">{project.customer_contact.name}</div>
                    <div className="text-sm text-slate-600">{project.customer_contact.email}</div>
                  </div>
                )}
                {project.notes && (
                  <div>
                    <div className="text-sm font-semibold text-slate-700 mb-1">Notes</div>
                    <div className="text-slate-900">{project.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Financial Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.financial_tracking ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Budget</span>
                      <span className="font-semibold">€{(project.financial_tracking.budget / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Actual Cost</span>
                      <span className="font-semibold">€{(project.financial_tracking.actual_cost / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Invoiced</span>
                      <span className="font-semibold text-green-700">€{(project.financial_tracking.invoiced / 1000).toFixed(0)}K</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">No financial data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Phases</CardTitle>
            </CardHeader>
            <CardContent>
              {project.current_phase && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-slate-700">Current Phase</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {project.current_phase}
                    </Badge>
                  </div>
                  {phaseProgress > 0 && (
                    <Progress value={phaseProgress} className="h-2" />
                  )}
                </div>
              )}
              {project.phase_history && project.phase_history.length > 0 ? (
                <div className="space-y-3">
                  {project.phase_history.map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                      {phase.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{phase.phase}</div>
                        <div className="text-xs text-slate-500">
                          Started: {format(new Date(phase.started), 'MMM d, yyyy')}
                          {phase.completed && ` • Completed: ${format(new Date(phase.completed), 'MMM d, yyyy')}`}
                        </div>
                      </div>
                      <Badge className={phase.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {phase.status || (phase.completed ? 'completed' : 'in progress')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No phase history available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {project.documents && project.documents.length > 0 ? (
                <div className="space-y-3">
                  {project.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-600" />
                        <div>
                          <div className="font-semibold text-slate-900">{doc.name}</div>
                          <div className="text-xs text-slate-500">
                            {doc.type} • Uploaded by {doc.uploaded_by}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No documents uploaded yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {project.comments && project.comments.length > 0 ? (
                <div className="space-y-4">
                  {project.comments.map((comment, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-slate-900">{comment.author}</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(comment.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No comments yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {project.status === 'completed' && (
          <TabsContent value="completion">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Completion Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.completion_date && (
                    <div>
                      <div className="text-sm font-semibold text-slate-700 mb-1">Completion Date</div>
                      <div className="text-slate-900">{format(new Date(project.completion_date), 'MMM d, yyyy')}</div>
                    </div>
                  )}
                  {project.final_value && (
                    <div>
                      <div className="text-sm font-semibold text-slate-700 mb-1">Final Value</div>
                      <div className="text-slate-900 text-2xl font-bold text-green-700">
                        €{(project.final_value / 1000).toFixed(0)}K
                      </div>
                    </div>
                  )}
                  {project.final_rating && (
                    <div>
                      <div className="text-sm font-semibold text-slate-700 mb-1">Overall Rating</div>
                      <div className="text-slate-900 text-2xl font-bold text-yellow-600">
                        {project.final_rating.toFixed(1)} ★
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {project.customer_satisfaction && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Satisfaction</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Overall</span>
                      <span className="font-semibold">{project.customer_satisfaction.overall_rating} ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Quality</span>
                      <span className="font-semibold">{project.customer_satisfaction.quality_rating} ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Timeliness</span>
                      <span className="font-semibold">{project.customer_satisfaction.timeliness_rating} ★</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Communication</span>
                      <span className="font-semibold">{project.customer_satisfaction.communication_rating} ★</span>
                    </div>
                    {project.customer_satisfaction.feedback && (
                      <div className="pt-3 border-t border-slate-200">
                        <div className="text-sm font-semibold text-slate-700 mb-1">Feedback</div>
                        <p className="text-slate-600 text-sm italic">"{project.customer_satisfaction.feedback}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}