import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Calendar, MapPin, TrendingUp, Shield } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Tenders() {
  const { isAdmin, partnerId } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: allTenders = [], isLoading } = useQuery({
    queryKey: ['tenders'],
    queryFn: () => base44.entities.Tender.list('-created_date'),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: !isAdmin,
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  // Filter tenders based on user role and visibility logic
  const tenders = isAdmin ? allTenders : allTenders.filter(tender => {
    // Only show non-draft tenders to partners
    if (tender.status === 'draft') return false;

    // Get current partner data
    const currentPartner = partners.find(p => p.id === partnerId);
    if (!currentPartner) return false;

    // Open tenders
    if (tender.invitation_strategy === 'open') return true;

    // Invited only
    if (tender.invitation_strategy === 'invited_only') {
      return tender.invited_partners?.includes(partnerId);
    }

    // Qualified only
    if (tender.invitation_strategy === 'qualified_only') {
      const tenderVertical = verticals.find(v => v.id === tender.vertical_id);
      const hasVertical = tenderVertical ? currentPartner.verticals?.includes(tenderVertical.code) : false;
      
      const hasSolutions = tender.required_solutions?.some(solId => {
        const solution = solutions.find(s => s.id === solId);
        return solution && currentPartner.solutions?.includes(solution.code);
      });
      
      return hasVertical && hasSolutions;
    }

    return false;
  });

  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.tender_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || tender.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-blue-100 text-blue-800',
    response_period: 'bg-green-100 text-green-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    awarded: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const getVerticalName = (id) => verticals.find(v => v.id === id)?.name || 'Unknown';
  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'Unknown';

  const stats = {
    total: tenders.length,
    active: tenders.filter(t => ['published', 'response_period', 'under_review'].includes(t.status)).length,
    awarded: tenders.filter(t => t.status === 'awarded').length,
    responses: tenders.reduce((sum, t) => sum + (t.responses?.length || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Tender Management' : 'Project Opportunities'}
          </h1>
          <p className="text-slate-600 mt-2">
            {isAdmin 
              ? `${tenders.length} active tenders across various industries` 
              : `${tenders.length} project opportunities from ASSA ABLOY available for your response`
            }
          </p>
        </div>
        {isAdmin && (
          <Link to={createPageUrl('CreateTender')}>
            <Button className="bg-blue-900 hover:bg-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Create Tender
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Tenders</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Awarded</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.awarded}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Responses</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.responses}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="response_period">Response Period</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="awarded">Awarded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenders List */}
      <div className="space-y-4">
        {filteredTenders.map(tender => (
          <Card key={tender.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{tender.title}</h3>
                      {tender.tender_code && (
                        <p className="text-sm text-slate-500">Code: {tender.tender_code}</p>
                      )}
                    </div>
                    <Badge className={statusColors[tender.status]}>
                      {(tender.status || 'draft').replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{tender.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {getVerticalName(tender.vertical_id)}
                    </Badge>
                    {tender.required_solutions?.slice(0, 2).map(solId => (
                      <Badge key={solId} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getSolutionName(solId)}
                      </Badge>
                    ))}
                    {tender.required_solutions?.length > 2 && (
                      <Badge variant="outline" className="bg-slate-50">
                        +{tender.required_solutions.length - 2} more
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {format(new Date(tender.response_deadline), 'MMM d, yyyy')}</span>
                    </div>
                    {tender.project_location?.city && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span>{tender.project_location.city}</span>
                      </div>
                    )}
                    {tender.budget_max && (
                      <div className="text-slate-600">
                        Budget: €{(tender.budget_min / 1000).toFixed(0)}K - €{(tender.budget_max / 1000).toFixed(0)}K
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:min-w-[200px] space-y-3">
                  {tender.responses?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-900">{tender.responses.length}</div>
                      <div className="text-xs text-blue-700">Response(s)</div>
                    </div>
                  )}
                  <Link to={createPageUrl(`TenderDetail?id=${tender.id}`)} className="w-full">
                    <Button className="w-full" variant="outline">
                      View Details
                    </Button>
                  </Link>
                  {!isAdmin && tender.status === 'response_period' && (
                    <Button className="w-full bg-blue-900 hover:bg-blue-800">
                      Submit Response
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenders.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No tenders found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}