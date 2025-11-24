import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Trophy, Plus, TrendingUp, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AchievementsManager() {
  const queryClient = useQueryClient();

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => base44.entities.Achievement.list('display_order'),
  });

  const { data: partnerAchievements = [] } = useQuery({
    queryKey: ['partner-achievements'],
    queryFn: () => base44.entities.PartnerAchievement.list(),
  });

  const { data: bonusCalculations = [] } = useQuery({
    queryKey: ['bonus-calculations'],
    queryFn: () => base44.entities.BonusCalculation.list('-calculation_date', 50),
  });

  const activeAchievements = achievements.filter(a => a.active);
  const totalAwarded = partnerAchievements.filter(pa => pa.earned_at).length;
  const pendingBonuses = partnerAchievements.filter(pa => pa.earned_at && !pa.bonus_paid).length;
  const totalBonusPaid = partnerAchievements
    .filter(pa => pa.bonus_paid)
    .reduce((sum, pa) => {
      const ach = achievements.find(a => a.id === pa.achievement_id);
      return sum + (ach?.bonus_amount || 0);
    }, 0);

  const achievementsByCategory = achievements.reduce((acc, ach) => {
    acc[ach.category] = (acc[ach.category] || 0) + 1;
    return acc;
  }, {});

  const criteriaTypes = [
    'projects_completed',
    'revenue_milestone',
    'rating_threshold',
    'certification_count',
    'solution_diversity',
    'vertical_diversity',
    'tier_achieved',
    'consecutive_success'
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Achievements Manager</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            Configure and monitor the achievement system that drives partner motivation and bonus calculations. 
            Define objective criteria, set bonus amounts, and track automated award triggers.
          </p>
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Settings className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Admin Control Center:</strong> Use this module to create achievements with quantifiable criteria 
              linked directly to system data. Achievements are automatically awarded and bonuses calculated based on 
              transparent, objective rules—eliminating manual interpretation and potential manipulation.
            </AlertDescription>
          </Alert>
        </div>
        <Button className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Create Achievement
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Achievements</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{activeAchievements.length}</p>
              </div>
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Awarded</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{totalAwarded}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Bonuses</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingBonuses}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bonuses Paid</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">€{(totalBonusPaid / 1000).toFixed(1)}K</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="achievement-definitions" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="achievement-definitions">Achievement Definitions</TabsTrigger>
          <TabsTrigger value="automation-rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="bonus-integration">Bonus Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="achievement-definitions">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Achievement System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Objective Criteria Only:</strong> All achievements must be based on quantifiable, system-tracked 
                  metrics. This ensures fairness, transparency, and eliminates subjective manipulation.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Achievement Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(achievementsByCategory).map(([category, count]) => (
                      <div key={category} className="p-3 bg-slate-50 rounded border border-slate-200">
                        <div className="text-sm font-medium text-slate-700 capitalize">{category}</div>
                        <div className="text-2xl font-bold text-slate-900">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Available Criteria Types</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {criteriaTypes.map(type => (
                      <div key={type} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-700">{type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-900 mb-2">Configuration Guidelines</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Set clear, measurable <code>criteria_value</code> targets (e.g., 10 projects, €50,000 revenue)</li>
                    <li>• Link <code>bonus_amount</code> directly to achievement difficulty and business value</li>
                    <li>• Use <code>tier_restricted</code> to create tier-specific milestone goals</li>
                    <li>• Mark <code>unlocks_bonus</code> for achievements that gate bonus eligibility</li>
                    <li>• Set appropriate <code>rarity</code> to reflect achievement prestige</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation-rules">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Achievement Automation Rules</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-blue-50 border-blue-200">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Fully Automated Awards:</strong> Achievements are evaluated and awarded automatically based on 
                  system events. No manual intervention required—ensuring consistency and fairness.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Project Completion Trigger</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        When a project is marked "won" or "completed", achievement criteria are evaluated:
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>• <code>projects_completed</code>: Increments count and checks thresholds</div>
                        <div>• <code>revenue_milestone</code>: Evaluates cumulative won project values</div>
                        <div>• <code>rating_threshold</code>: Checks average customer satisfaction scores</div>
                        <div>• <code>consecutive_success</code>: Tracks streak of successful deliveries</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Certification & Training Trigger</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        When training attendance is confirmed or certifications are issued:
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>• <code>certification_count</code>: Evaluates total valid certifications</div>
                        <div>• <code>solution_diversity</code>: Checks breadth across different solutions</div>
                        <div>• <code>vertical_diversity</code>: Assesses coverage of vertical markets</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-1">Tier Progression Trigger</h3>
                      <p className="text-sm text-slate-600 mb-2">
                        When partner tier scores are recalculated (quarterly):
                      </p>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>• <code>tier_achieved</code>: Awards achievement when partner reaches specific tier</div>
                        <div>• Automatically unlocks tier-restricted achievements for eligibility evaluation</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-700 mb-2">Future Automation Opportunities</h3>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Real-time achievement checks on every project update</li>
                    <li>• Partner notifications when close to earning achievements (90% progress)</li>
                    <li>• Automatic badge display on public partner profiles</li>
                    <li>• Integration with marketing materials for top achievers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonus-integration">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Bonus Calculation Integration</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Alert className="mb-6 bg-green-50 border-green-200">
                <DollarSign className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Direct Bonus Link:</strong> Achievements feed directly into bonus calculations through 
                  transparent, predefined formulas. Partners can see exactly how their accomplishments translate to rewards.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Achievement → Bonus Flow</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Achievement Earned</div>
                        <div className="text-sm text-slate-600">System automatically creates PartnerAchievement record</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Bonus Calculation</div>
                        <div className="text-sm text-slate-600">Quarterly bonus run includes achievement <code>bonus_amount</code></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Admin Approval</div>
                        <div className="text-sm text-slate-600">Admin reviews and approves BonusCalculation</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">4</div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">Payment & Flag</div>
                        <div className="text-sm text-slate-600">PartnerAchievement marked as <code>bonus_paid: true</code></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">Bonus Transparency Rules</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Achievement <code>bonus_amount</code> is clearly visible to partners before earning</li>
                    <li>• Partners can track bonus status (pending vs. paid) in their Achievements view</li>
                    <li>• BonusCalculation entity includes breakdown showing achievement contributions</li>
                    <li>• All bonus-eligible achievements must have <code>unlocks_bonus: true</code></li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Recent Bonus Activity</h3>
                  <div className="text-sm text-slate-600">
                    <div className="flex justify-between py-2 border-b">
                      <span>Last Quarter Calculations:</span>
                      <span className="font-semibold">{bonusCalculations.filter(bc => bc.period === 'Q4').length}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>Achievement Bonuses Approved:</span>
                      <span className="font-semibold">€{(totalBonusPaid / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span>Awaiting Payment:</span>
                      <span className="font-semibold text-yellow-700">{pendingBonuses} achievements</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}