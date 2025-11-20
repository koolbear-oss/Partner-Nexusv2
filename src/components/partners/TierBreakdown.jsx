import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target, Layers } from 'lucide-react';

export default function TierBreakdown({ partnerId }) {
  const { data: verticalScores = [] } = useQuery({
    queryKey: ['partner-vertical-scores', partnerId],
    queryFn: async () => {
      const all = await base44.entities.PartnerVerticalScore.list();
      return all.filter(s => s.partner_id === partnerId).sort((a, b) => b.total_won_value - a.total_won_value);
    },
    enabled: !!partnerId,
  });

  const { data: solutionScores = [] } = useQuery({
    queryKey: ['partner-solution-scores', partnerId],
    queryFn: async () => {
      const all = await base44.entities.PartnerSolutionScore.list();
      return all.filter(s => s.partner_id === partnerId).sort((a, b) => b.total_won_value - a.total_won_value);
    },
    enabled: !!partnerId,
  });

  const { data: nicheScores = [] } = useQuery({
    queryKey: ['partner-niche-scores', partnerId],
    queryFn: async () => {
      const all = await base44.entities.PartnerSolutionVerticalScore.list();
      return all.filter(s => s.partner_id === partnerId && s.specialization_badge).sort((a, b) => b.total_won_value - a.total_won_value);
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

  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'Unknown';
  const getVerticalName = (id) => verticals.find(v => v.id === id)?.name || 'Unknown';

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <div className="space-y-6">
      {/* Specialization Badges */}
      {nicheScores.length > 0 && (
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Specialization Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nicheScores.map(score => (
                <div key={score.id} className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-slate-900">
                        {getSolutionName(score.solution_id)} × {getVerticalName(score.vertical_id)}
                      </span>
                    </div>
                    <Badge className={`${tierColors[score.niche_tier]} border`}>
                      {score.niche_tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                    <div>
                      <div className="text-xs text-slate-500">Projects Won</div>
                      <div className="font-semibold">{score.projects_won_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Total Value</div>
                      <div className="font-semibold">€{(score.total_won_value / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Market Share</div>
                      <div className="font-semibold">{score.percentage_of_niche_total?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vertical Rankings */}
      {verticalScores.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Rankings by Vertical Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verticalScores.map(score => (
                <div key={score.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-900">{getVerticalName(score.vertical_id)}</div>
                    <Badge className={`${tierColors[score.vertical_tier]} border`}>
                      {score.vertical_tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Percentile Rank</span>
                      <span>{score.vertical_rank_percentage?.toFixed(0) || 0}%</span>
                    </div>
                    <Progress value={score.vertical_rank_percentage || 0} className="h-2" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <div className="text-xs text-slate-500">Won</div>
                      <div className="font-semibold">{score.projects_won_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Value</div>
                      <div className="font-semibold">€{(score.total_won_value / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Leads</div>
                      <div className="font-semibold">{score.leads_registered || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Rating</div>
                      <div className="font-semibold">{score.avg_project_rating?.toFixed(1) || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solution Rankings */}
      {solutionScores.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Rankings by Solution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {solutionScores.map(score => (
                <div key={score.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-slate-900">{getSolutionName(score.solution_id)}</div>
                    <Badge className={`${tierColors[score.solution_tier]} border`}>
                      {score.solution_tier.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Percentile Rank</span>
                      <span>{score.solution_rank_percentage?.toFixed(0) || 0}%</span>
                    </div>
                    <Progress value={score.solution_rank_percentage || 0} className="h-2" />
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm mt-3">
                    <div>
                      <div className="text-xs text-slate-500">Won</div>
                      <div className="font-semibold">{score.projects_won_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Value</div>
                      <div className="font-semibold">€{(score.total_won_value / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Certified</div>
                      <div className="font-semibold">{score.certified_team_count || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Rating</div>
                      <div className="font-semibold">{score.avg_project_rating?.toFixed(1) || '-'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {verticalScores.length === 0 && solutionScores.length === 0 && nicheScores.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No performance rankings available yet</p>
            <p className="text-sm mt-2">Rankings will appear after tier calculations are run</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}