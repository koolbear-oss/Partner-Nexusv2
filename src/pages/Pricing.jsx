import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, DollarSign, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import AddPricingRuleDialog from '../components/pricing/AddPricingRuleDialog';

export default function Pricing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: pricingRules = [], isLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: () => base44.entities.PricingRule.list('-created_date'),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const syncMutation = useMutation({
    mutationFn: (id) => 
      base44.entities.PricingRule.update(id, { 
        sync_status: 'synced',
        last_sync: new Date().toISOString()
      }),
    onSuccess: () => queryClient.invalidateQueries(['pricing-rules']),
  });

  const filteredRules = pricingRules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || rule.partner_tier === filterTier;
    return matchesSearch && matchesTier;
  });

  const getSolutionName = (id) => solutions.find(s => s.id === id)?.name || 'All Solutions';
  const getVerticalName = (id) => verticals.find(v => v.id === id)?.name || 'All Verticals';

  const syncStatusConfig = {
    synced: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Synced' },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending' },
    failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Failed' },
  };

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800',
    gold: 'bg-yellow-100 text-yellow-800',
    silver: 'bg-slate-100 text-slate-800',
    bronze: 'bg-orange-100 text-orange-800',
    entry: 'bg-gray-100 text-gray-800',
    all: 'bg-blue-100 text-blue-800',
  };

  const stats = {
    total: pricingRules.length,
    active: pricingRules.filter(r => r.active).length,
    synced: pricingRules.filter(r => r.sync_status === 'synced').length,
    pending: pricingRules.filter(r => r.sync_status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pricing Management</h1>
          <p className="text-slate-600 mt-2">Real-time quotation tool synchronization</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing Rule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Rules</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Synced</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.synced}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pending Sync</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
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
                placeholder="Search pricing rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Rules */}
      <div className="space-y-4">
        {filteredRules.map(rule => {
          const syncConfig = syncStatusConfig[rule.sync_status];
          const SyncIcon = syncConfig.icon;

          return (
            <Card key={rule.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">{rule.rule_name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${tierColors[rule.partner_tier]} font-medium`}>
                            {rule.partner_tier.toUpperCase()}
                          </Badge>
                          <Badge className={`${syncConfig.color} border`}>
                            <SyncIcon className="w-3 h-3 mr-1" />
                            {syncConfig.label}
                          </Badge>
                          {rule.active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ml-13 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500">Solution:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {getSolutionName(rule.solution_id)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Vertical:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {getVerticalName(rule.vertical_id)}
                          </span>
                        </div>
                      </div>
                      {rule.effective_date && (
                        <div>
                          <span className="text-slate-500">Effective:</span>
                          <span className="ml-2 font-medium text-slate-900">
                            {format(new Date(rule.effective_date), 'MMM d, yyyy')}
                          </span>
                          {rule.expiry_date && (
                            <>
                              <span className="text-slate-400 mx-2">→</span>
                              <span className="font-medium text-slate-900">
                                {format(new Date(rule.expiry_date), 'MMM d, yyyy')}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:min-w-[280px] space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Base Discount</p>
                        <p className="text-2xl font-bold text-slate-900">{rule.base_discount}%</p>
                      </div>
                      {rule.volume_discount > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 mb-1">Volume Bonus</p>
                          <p className="text-2xl font-bold text-blue-700">+{rule.volume_discount}%</p>
                        </div>
                      )}
                    </div>
                    {rule.volume_threshold > 0 && (
                      <div className="text-xs text-slate-600 text-center">
                        Volume threshold: €{rule.volume_threshold.toLocaleString()}
                      </div>
                    )}
                    {rule.sync_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => syncMutation.mutate(rule.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Sync to Quotation Tool
                      </Button>
                    )}
                    {rule.sync_status === 'synced' && rule.last_sync && (
                      <p className="text-xs text-green-600 text-center">
                        Last synced: {format(new Date(rule.last_sync), 'MMM d, HH:mm')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRules.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No pricing rules found</h3>
            <p className="text-slate-500">Try adjusting your filters or add a new rule</p>
          </CardContent>
        </Card>
      )}

      {showAddDialog && (
        <AddPricingRuleDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          solutions={solutions}
          verticals={verticals}
        />
      )}
    </div>
  );
}