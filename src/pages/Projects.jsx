import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Briefcase, Calendar, DollarSign, Building2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function Projects() {
  const { isAdmin, partnerId } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', partnerId],
    queryFn: async () => {
      const allProjects = await base44.entities.Project.list('-created_date');
      if (isAdmin) return allProjects;
      return allProjects.filter(p => 
        p.assigned_partner_id === partnerId || 
        p.ai_matched_partners?.some(m => m.partner_id === partnerId)
      );
    },
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPartnerName = (partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner?.company_name || 'Unassigned';
  };

  const getVerticalName = (verticalId) => {
    const vertical = verticals.find(v => v.code === verticalId);
    return vertical?.name || verticalId;
  };

  const statusColors = {
    'tender_stage': 'bg-purple-100 text-purple-800 border-purple-200',
    'partner_matching': 'bg-amber-100 text-amber-800 border-amber-200',
    'assigned': 'bg-cyan-100 text-cyan-800 border-cyan-200',
    'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
    'completed': 'bg-green-100 text-green-800 border-green-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Portfolio</h1>
        <p className="text-slate-600 mt-2">
          {isAdmin 
            ? `Track and orchestrate ${projects.length} projects across your partner network`
            : `Your assigned and matched projects (${projects.length})`
          }
        </p>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="tender_stage">Tender Stage</SelectItem>
                <SelectItem value="partner_matching">Partner Matching</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => (
          <Link key={project.id} to={createPageUrl(`ProjectDetail?id=${project.id}`)}>
            <Card className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <Briefcase className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                         <h3 className="text-lg font-bold text-slate-900">{project.project_name}</h3>
                         <Badge className={`${statusColors[project.status]} border font-medium px-2 py-1 text-xs`}>
                           {project.status.replace(/_/g, ' ')}
                         </Badge>
                         {!isAdmin && project.assigned_partner_id === partnerId && (
                           <Badge className="bg-blue-600 text-white px-2 py-1 text-xs">
                             Your Project
                           </Badge>
                         )}
                         {!isAdmin && project.assigned_partner_id !== partnerId && 
                          project.ai_matched_partners?.some(m => m.partner_id === partnerId) && (
                           <Badge variant="outline" className="border-purple-300 text-purple-700 flex items-center gap-1 px-2 py-1 text-xs">
                             <Sparkles className="w-3 h-3" />
                             Potential Match
                           </Badge>
                         )}
                         {isAdmin && (project.status === 'tender_stage' || project.status === 'partner_matching') && 
                          project.ai_matched_partners?.length > 0 && (
                           <Badge variant="outline" className="border-purple-300 text-purple-700 flex items-center gap-1 px-2 py-1 text-xs">
                             <Sparkles className="w-3 h-3" />
                             AI Matched
                           </Badge>
                         )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Building2 className="w-4 h-4" />
                          <span className="font-medium">{project.client_name}</span>
                          <span className="text-slate-400">•</span>
                          <span>{getVerticalName(project.vertical_id)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.solution_ids?.slice(0, 3).map(solutionCode => {
                            const solution = solutions.find(s => s.code === solutionCode);
                            return solution ? (
                              <Badge key={solutionCode} variant="outline" className="text-xs bg-slate-50">
                                {solution.name}
                              </Badge>
                            ) : null;
                          })}
                          {project.solution_ids?.length > 3 && (
                            <Badge variant="outline" className="text-xs bg-slate-50">
                              +{project.solution_ids.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col lg:items-end gap-3 lg:min-w-[280px]">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Estimated Value</div>
                        <div className="flex items-center gap-1 text-lg font-bold text-slate-900">
                          <DollarSign className="w-4 h-4" />
                          €{(project.estimated_value / 1000).toFixed(0)}K
                        </div>
                      </div>
                      {project.deadline && (
                        <div>
                          <div className="text-xs text-slate-500 mb-1">Deadline</div>
                          <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(project.deadline), 'MMM d, yyyy')}
                          </div>
                        </div>
                      )}
                    </div>
                    {project.assigned_partner_id && (
                      <div className="text-sm">
                        <span className="text-slate-500">Assigned to: </span>
                        <span className="font-semibold text-slate-900">{getPartnerName(project.assigned_partner_id)}</span>
                      </div>
                    )}
                    {project.final_rating > 0 && (
                      <div className="text-sm">
                        <span className="text-slate-500">Final Rating: </span>
                        <span className="font-bold text-amber-600">{project.final_rating.toFixed(1)} ★</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}