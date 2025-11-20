import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Award, TrendingUp, CheckCircle2 } from 'lucide-react';
import AddCompetencyDialog from '../components/competencies/AddCompetencyDialog';

export default function Competencies() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPartner, setFilterPartner] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: competencies = [], isLoading } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => base44.entities.Competency.list('-created_date'),
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

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }) => 
      base44.entities.Competency.update(id, { 
        verified,
        verified_date: verified ? new Date().toISOString().split('T')[0] : null
      }),
    onSuccess: () => queryClient.invalidateQueries(['competencies']),
  });

  const filteredCompetencies = competencies.filter(comp => {
    const partner = partners.find(p => p.id === comp.partner_id);
    const solution = solutions.find(s => s.id === comp.solution_id);
    
    const matchesSearch = partner?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         solution?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = filterPartner === 'all' || comp.partner_id === filterPartner;
    const matchesLevel = filterLevel === 'all' || comp.level === filterLevel;
    
    return matchesSearch && matchesPartner && matchesLevel;
  });

  const getPartnerName = (partnerId) => partners.find(p => p.id === partnerId)?.company_name || 'Unknown';
  const getSolutionName = (solutionId) => solutions.find(s => s.id === solutionId)?.name || 'Unknown';
  const getVerticalName = (verticalId) => verticals.find(v => v.id === verticalId)?.name || 'N/A';

  const levelColors = {
    basic: 'bg-blue-100 text-blue-800 border-blue-200',
    intermediate: 'bg-green-100 text-green-800 border-green-200',
    advanced: 'bg-amber-100 text-amber-800 border-amber-200',
    expert: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const stats = {
    total: competencies.length,
    verified: competencies.filter(c => c.verified).length,
    expert: competencies.filter(c => c.level === 'expert').length,
    advanced: competencies.filter(c => c.level === 'advanced').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Competency Matrix</h1>
          <p className="text-slate-600 mt-2">Multi-dimensional tracking of partner capabilities</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Competency
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <Award className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Verified</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.verified}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expert Level</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.expert}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Advanced</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.advanced}</p>
              </div>
              <Award className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by partner or solution..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPartner} onValueChange={setFilterPartner}>
              <SelectTrigger>
                <SelectValue placeholder="All Partners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.filter(p => p.status === 'active').map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>{partner.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger>
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Competencies List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCompetencies.map(comp => (
          <Card key={comp.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">{getPartnerName(comp.partner_id)}</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className={`${levelColors[comp.level]} border font-semibold`}>
                      {comp.level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="bg-slate-50">
                      {comp.phase}
                    </Badge>
                    {comp.verified && (
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="text-slate-600">
                      <span className="font-medium">Solution:</span> {getSolutionName(comp.solution_id)}
                    </div>
                    {comp.vertical_id && (
                      <div className="text-slate-600">
                        <span className="font-medium">Vertical:</span> {getVerticalName(comp.vertical_id)}
                      </div>
                    )}
                    {comp.projects_completed > 0 && (
                      <div className="text-slate-600">
                        <span className="font-medium">Projects:</span> {comp.projects_completed} completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!comp.verified && (
                <Button
                  onClick={() => verifyMutation.mutate({ id: comp.id, verified: true })}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Verified
                </Button>
              )}
              {comp.verified && comp.verified_date && (
                <p className="text-xs text-green-600 text-center">
                  Verified on {new Date(comp.verified_date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompetencies.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No competencies found</h3>
            <p className="text-slate-500">Try adjusting your filters or add a new competency</p>
          </CardContent>
        </Card>
      )}

      {showAddDialog && (
        <AddCompetencyDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          partners={partners}
          solutions={solutions}
          verticals={verticals}
        />
      )}
    </div>
  );
}