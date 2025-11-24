import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Trophy, Star, Target, TrendingUp } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AchievementsView() {
  const { isAdmin, partnerId } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list('display_order'),
  });

  const { data: partnerAchievements = [] } = useQuery({
    queryKey: ['partner-achievements', partnerId],
    queryFn: async () => {
      const all = await base44.entities.PartnerAchievement.list();
      return isAdmin ? all : all.filter(pa => pa.partner_id === partnerId);
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: isAdmin,
  });

  const claimMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PartnerAchievement.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['partner-achievements']),
  });

  const rarityColors = {
    common: 'bg-gray-100 text-gray-800 border-gray-300',
    rare: 'bg-blue-100 text-blue-800 border-blue-300',
    epic: 'bg-purple-100 text-purple-800 border-purple-300',
    legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };

  const categoryIcons = {
    revenue: TrendingUp,
    quality: Star,
    growth: TrendingUp,
    certification: Award,
    diversity: Target,
    milestone: Trophy,
  };

  const earnedAchievements = partnerAchievements.filter(pa => pa.earned_at);
  const inProgressAchievements = partnerAchievements.filter(pa => !pa.earned_at && pa.progress > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Achievements</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            {isAdmin 
              ? 'View partner achievements across your network. For system configuration, use Achievements Manager.' 
              : `You've earned ${earnedAchievements.length} achievements. Track your progress towards milestones and unlock bonus rewards.`}
          </p>
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Trophy className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Automated Recognition:</strong> Achievements are automatically earned when you reach specific milestones 
              (e.g., revenue targets, project completions, quality ratings). Each achievement has predefined criteria and bonus amounts, 
              eliminating subjective evaluation and ensuring fair, transparent rewards.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Stats */}
      {!isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-yellow-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Earned</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">{earnedAchievements.length}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{inProgressAchievements.length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Claimed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {earnedAchievements.filter(pa => pa.claimed).length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-purple-600">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Shared</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {earnedAchievements.filter(pa => pa.shared_publicly).length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue={isAdmin ? "all" : "earned"} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          {!isAdmin && <TabsTrigger value="earned">Earned</TabsTrigger>}
          {!isAdmin && <TabsTrigger value="progress">In Progress</TabsTrigger>}
          <TabsTrigger value="all">All Achievements</TabsTrigger>
        </TabsList>

        {!isAdmin && (
          <TabsContent value="earned">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedAchievements.map(pa => {
                const achievement = achievements.find(a => a.id === pa.achievement_id);
                if (!achievement) return null;
                const Icon = categoryIcons[achievement.category] || Award;
                
                return (
                  <Card key={pa.id} className="shadow-sm hover:shadow-md transition-shadow border-t-4 border-t-yellow-600">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                          <Icon className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">{achievement.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{achievement.description}</p>
                          <Badge className={`${rarityColors[achievement.rarity]} border text-xs`}>
                            {achievement.rarity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">
                        Earned: {new Date(pa.earned_at).toLocaleDateString()}
                      </div>
                      {achievement.bonus_amount > 0 && (
                        <div className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800 mb-3">
                          Bonus: €{achievement.bonus_amount}
                          {pa.bonus_paid ? ' (Paid)' : ' (Pending)'}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {!pa.claimed && (
                          <Button
                            size="sm"
                            onClick={() => claimMutation.mutate({ id: pa.id, data: { claimed: true, claimed_at: new Date().toISOString() } })}
                            className="flex-1"
                          >
                            Claim
                          </Button>
                        )}
                        {pa.claimed && !pa.shared_publicly && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => claimMutation.mutate({ id: pa.id, data: { shared_publicly: true } })}
                            className="flex-1"
                          >
                            Share
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {earnedAchievements.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-16 text-center">
                  <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No achievements earned yet</h3>
                  <p className="text-slate-500">Keep working to unlock your first achievement!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {!isAdmin && (
          <TabsContent value="progress">
            <div className="space-y-4">
              {inProgressAchievements.map(pa => {
                const achievement = achievements.find(a => a.id === pa.achievement_id);
                if (!achievement) return null;
                const Icon = categoryIcons[achievement.category] || Award;
                const progressPercent = (pa.progress_current / pa.progress_target) * 100;
                
                return (
                  <Card key={pa.id} className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 mb-1">{achievement.name}</h3>
                          <p className="text-sm text-slate-600 mb-3">{achievement.description}</p>
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600">Progress</span>
                              <span className="font-semibold text-slate-900">
                                {pa.progress_current} / {pa.progress_target}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <Badge className={`${rarityColors[achievement.rarity]} border text-xs`}>
                            {achievement.rarity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {inProgressAchievements.length === 0 && (
              <Card className="shadow-sm">
                <CardContent className="py-16 text-center">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No achievements in progress</h3>
                  <p className="text-slate-500">Start working towards new achievements!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.filter(a => a.active).map(achievement => {
              const Icon = categoryIcons[achievement.category] || Award;
              const partnerAch = partnerAchievements.find(pa => pa.achievement_id === achievement.id);
              const isEarned = partnerAch?.earned_at;
              
              return (
                <Card key={achievement.id} className={`shadow-sm ${isEarned ? 'border-t-4 border-t-yellow-600' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEarned ? 'bg-yellow-100' : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isEarned ? 'text-yellow-600' : 'text-slate-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{achievement.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{achievement.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${rarityColors[achievement.rarity]} border text-xs`}>
                            {achievement.rarity.toUpperCase()}
                          </Badge>
                          {isEarned && (
                            <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">
                              Earned
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="text-slate-600">
                        <span className="font-semibold">Category:</span> {achievement.category}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-semibold">Target:</span> {achievement.criteria_value} {achievement.criteria_type.replace(/_/g, ' ')}
                      </div>
                      {achievement.bonus_amount > 0 && (
                        <div className="text-green-700 font-semibold">
                          Bonus: €{achievement.bonus_amount}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}