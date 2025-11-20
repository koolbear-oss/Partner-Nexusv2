import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw, Save, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TierSettings() {
  const queryClient = useQueryClient();
  const [selectedScope, setSelectedScope] = useState('overall');
  const [calculating, setCalculating] = useState(false);

  const { data: configurations = [] } = useQuery({
    queryKey: ['tier-configurations'],
    queryFn: () => base44.entities.TierConfiguration.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const overallConfig = configurations.find(c => c.config_type === 'overall') || {
    tier_thresholds: {
      platinum_percentile: 90,
      gold_percentile: 70,
      silver_percentile: 40,
      bronze_percentile: 10,
    },
    scoring_weights: {
      won_value_weight: 40,
      leads_weight: 20,
      performance_weight: 25,
      diversity_weight: 15,
    }
  };

  const [thresholds, setThresholds] = useState(overallConfig.tier_thresholds || {});
  const [weights, setWeights] = useState(overallConfig.scoring_weights || {});

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (overallConfig.id) {
        return base44.entities.TierConfiguration.update(overallConfig.id, data);
      } else {
        return base44.entities.TierConfiguration.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tier-configurations']);
      alert('Configuration saved successfully');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      config_type: 'overall',
      tier_thresholds: thresholds,
      scoring_weights: weights,
      active: true,
      last_modified: new Date().toISOString(),
    });
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      // In a real implementation, this would call a backend function
      // For now, we'll show a placeholder
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Tier recalculation completed! This would normally trigger a backend process.');
      queryClient.invalidateQueries(['partners']);
      queryClient.invalidateQueries(['tier-scores']);
    } catch (error) {
      alert('Error during recalculation: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const isWeightValid = totalWeight === 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tier Settings</h1>
          <p className="text-slate-600 mt-2">
            Configure automated partner tier calculation thresholds and weights
          </p>
        </div>
        <Button
          onClick={handleRecalculate}
          disabled={calculating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {calculating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Recalculate All Tiers
            </>
          )}
        </Button>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-slate-700">
          Partner tiers are automatically calculated based on percentile rankings. The system compares each partner's 
          performance across all metrics to determine their tier dynamically.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overall" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="overall">Overall Tiers</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="history">Calculation History</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Tier Percentile Thresholds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Define the top percentile ranges for each tier. For example, setting Platinum to 90 means 
                partners in the top 10% by score will be Platinum tier.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Platinum Tier (Top %)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.platinum_percentile || 90}
                    onChange={(e) => setThresholds({...thresholds, platinum_percentile: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Top {100 - (thresholds.platinum_percentile || 90)}% of partners</p>
                </div>
                <div>
                  <Label>Gold Tier (Top %)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.gold_percentile || 70}
                    onChange={(e) => setThresholds({...thresholds, gold_percentile: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Top {100 - (thresholds.gold_percentile || 70)}% of partners</p>
                </div>
                <div>
                  <Label>Silver Tier (Top %)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.silver_percentile || 40}
                    onChange={(e) => setThresholds({...thresholds, silver_percentile: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Top {100 - (thresholds.silver_percentile || 40)}% of partners</p>
                </div>
                <div>
                  <Label>Bronze Tier (Top %)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={thresholds.bronze_percentile || 10}
                    onChange={(e) => setThresholds({...thresholds, bronze_percentile: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Top {100 - (thresholds.bronze_percentile || 10)}% of partners</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Scoring Weights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 mb-4">
                Define how much each factor contributes to the overall tier score. Total must equal 100%.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Won Project Value Weight (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={weights.won_value_weight || 40}
                    onChange={(e) => setWeights({...weights, won_value_weight: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Total value of won projects with validated quotes</p>
                </div>
                <div>
                  <Label>Project Leads Weight (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={weights.leads_weight || 20}
                    onChange={(e) => setWeights({...weights, leads_weight: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of project leads registered</p>
                </div>
                <div>
                  <Label>Performance Weight (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={weights.performance_weight || 25}
                    onChange={(e) => setWeights({...weights, performance_weight: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Project ratings and completion quality</p>
                </div>
                <div>
                  <Label>Diversity Weight (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={weights.diversity_weight || 15}
                    onChange={(e) => setWeights({...weights, diversity_weight: Number(e.target.value)})}
                  />
                  <p className="text-xs text-slate-500 mt-1">Solution and vertical market diversity</p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isWeightValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isWeightValid ? 'text-green-900' : 'text-red-900'}`}>
                    Total Weight: {totalWeight}%
                  </span>
                  {isWeightValid ? (
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Must equal 100%</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!isWeightValid || saveMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="methodology" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How Automated Tiering Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-semibold text-slate-900">Dynamic, Percentile-Based Tiers</h3>
                <p className="text-slate-700">
                  Partner tiers are calculated dynamically based on performance relative to all other partners in the network. 
                  This ensures that tiers remain meaningful and competitive as your partner network grows.
                </p>

                <h3 className="text-base font-semibold text-slate-900 mt-6">Scoring Components</h3>
                <ul className="text-slate-700 space-y-2">
                  <li>
                    <strong>Won Project Value (Default 40%):</strong> Sum of all project values with status "won" and 
                    validated quote numbers, compared to total won project value across all partners.
                  </li>
                  <li>
                    <strong>Project Leads (Default 20%):</strong> Number of project opportunities registered by the partner, 
                    regardless of outcome, compared to total leads registered.
                  </li>
                  <li>
                    <strong>Performance (Default 25%):</strong> Average project ratings, completion rates, and customer 
                    satisfaction scores.
                  </li>
                  <li>
                    <strong>Diversity (Default 15%):</strong> Number of different solutions and vertical markets the partner 
                    successfully operates in.
                  </li>
                </ul>

                <h3 className="text-base font-semibold text-slate-900 mt-6">Tier Assignment</h3>
                <p className="text-slate-700">
                  Once all partners are scored, they're ranked by their total score. Tiers are assigned based on percentile 
                  rankings:
                </p>
                <ul className="text-slate-700 space-y-2">
                  <li><strong>Platinum:</strong> Top 10% of partners (configurable)</li>
                  <li><strong>Gold:</strong> Next 20% of partners</li>
                  <li><strong>Silver:</strong> Next 30% of partners</li>
                  <li><strong>Bronze:</strong> Next 30% of partners</li>
                  <li><strong>Entry:</strong> Remaining 10% of partners</li>
                </ul>

                <h3 className="text-base font-semibold text-slate-900 mt-6">Granular Rankings</h3>
                <p className="text-slate-700">
                  Beyond overall tiers, partners are also ranked within specific:
                </p>
                <ul className="text-slate-700 space-y-2">
                  <li><strong>Verticals:</strong> Partner performance within each industry vertical (Healthcare, Education, etc.)</li>
                  <li><strong>Solutions:</strong> Partner expertise in specific ASSA ABLOY solutions (Access Control, etc.)</li>
                  <li><strong>Solution-Vertical Niches:</strong> Specialized rankings for solution-vertical combinations</li>
                </ul>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-900">
                    <strong>Marketing Validation:</strong> As your partner network grows and becomes more competitive, 
                    achieving Platinum tier becomes more significant, providing valuable marketing validation for high-performing partners.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Tier Calculations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <p>Calculation history will appear here after the first automated tier calculation.</p>
                <p className="text-sm mt-2">Click "Recalculate All Tiers" to perform the first calculation.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}