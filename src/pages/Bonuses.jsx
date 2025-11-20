import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, DollarSign, TrendingUp, CheckCircle2, Clock, Check, X } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function Bonuses() {
  const { isAdmin, partnerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPaid, setFilterPaid] = useState('all');

  const { data: bonuses = [] } = useQuery({
    queryKey: ['bonuses'],
    queryFn: async () => {
      const allBonuses = await base44.entities.BonusCalculation.list('-year', 100);
      if (isAdmin) return allBonuses;
      return allBonuses.filter(b => b.partner_id === partnerId);
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.BonusCalculation.update(id, {
      payment_status: 'approved',
      approved_at: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries(['bonuses']),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => base44.entities.BonusCalculation.update(id, {
      payment_status: 'rejected'
    }),
    onSuccess: () => queryClient.invalidateQueries(['bonuses']),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => base44.entities.BonusCalculation.update(id, {
      payment_status: 'paid',
      paid: true,
      paid_date: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries(['bonuses']),
  });

  const filteredBonuses = bonuses.filter(bonus => {
    const partner = partners.find(p => p.id === bonus.partner_id);
    const matchesSearch = partner?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.quarter?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.period?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || bonus.year.toString() === filterYear;
    const matchesPaid = filterPaid === 'all' || 
                       (filterPaid === 'paid' && bonus.payment_status === 'paid') ||
                       (filterPaid === 'pending' && bonus.payment_status === 'pending') ||
                       (filterPaid === 'approved' && bonus.payment_status === 'approved');
    return matchesSearch && matchesYear && matchesPaid;
  });

  const getPartnerName = (partnerId) => partners.find(p => p.id === partnerId)?.company_name || 'Unknown';

  const years = [...new Set(bonuses.map(b => b.year))].sort((a, b) => b - a);

  const stats = {
    totalAmount: bonuses.reduce((sum, b) => sum + (b.total_bonus || b.bonus_amount || 0), 0),
    paidAmount: bonuses.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_bonus || b.bonus_amount || 0), 0),
    pendingAmount: bonuses.filter(b => b.payment_status === 'pending').reduce((sum, b) => sum + (b.total_bonus || b.bonus_amount || 0), 0),
    approvedAmount: bonuses.filter(b => b.payment_status === 'approved').reduce((sum, b) => sum + (b.total_bonus || b.bonus_amount || 0), 0),
    totalBonuses: bonuses.length,
    paidBonuses: bonuses.filter(b => b.payment_status === 'paid').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {isAdmin ? 'Bonus Management' : 'Your Bonuses'}
        </h1>
        <p className="text-slate-600 mt-2">
          {isAdmin ? 'Track and manage partner bonuses across all periods' : 'View your bonus history and payment status'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  €{(stats.totalAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Paid Out</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  €{(stats.paidAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Approved</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  €{(stats.approvedAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Bonuses</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalBonuses}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
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
                placeholder="Search partners or quarters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaid} onValueChange={setFilterPaid}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bonuses List */}
      <div className="space-y-4">
        {filteredBonuses.map(bonus => (
          <Card key={bonus.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">{getPartnerName(bonus.partner_id)}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {bonus.period || bonus.quarter} {bonus.year}
                        </Badge>
                        {bonus.payment_status === 'paid' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 border">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : bonus.payment_status === 'approved' ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {!bonus.eligible && (
                          <Badge className="bg-red-100 text-red-800 border-red-200 border">
                            Ineligible
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ml-13 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Revenue</p>
                      <p className="font-bold text-slate-900">€{(bonus.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Projects</p>
                      <p className="font-bold text-slate-900">{bonus.projects_completed}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Avg Rating</p>
                      <p className="font-bold text-slate-900">{bonus.avg_project_rating?.toFixed(1) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Tier Score</p>
                      <p className="font-bold text-slate-900">{bonus.tier_score}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:min-w-[280px] space-y-3">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <p className="text-xs text-green-700 mb-2 text-center font-semibold">Total Bonus</p>
                  <p className="text-3xl font-bold text-green-900 text-center mb-3">
                    €{(bonus.total_bonus || bonus.bonus_amount)?.toLocaleString() || 0}
                  </p>
                  {bonus.bonus_breakdown && (
                    <div className="space-y-1 text-xs border-t border-green-200 pt-2">
                      {bonus.bonus_breakdown.revenue_bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Revenue:</span>
                          <span className="font-semibold text-green-900">€{bonus.bonus_breakdown.revenue_bonus.toLocaleString()}</span>
                        </div>
                      )}
                      {bonus.bonus_breakdown.quality_bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Quality:</span>
                          <span className="font-semibold text-green-900">€{bonus.bonus_breakdown.quality_bonus.toLocaleString()}</span>
                        </div>
                      )}
                      {bonus.bonus_breakdown.growth_bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Growth:</span>
                          <span className="font-semibold text-green-900">€{bonus.bonus_breakdown.growth_bonus.toLocaleString()}</span>
                        </div>
                      )}
                      {bonus.bonus_breakdown.certification_bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Certification:</span>
                          <span className="font-semibold text-green-900">€{bonus.bonus_breakdown.certification_bonus.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {bonus.payment_status === 'paid' && bonus.paid_date && (
                  <p className="text-xs text-center text-slate-600">
                    Paid on {new Date(bonus.paid_date).toLocaleDateString()}
                  </p>
                )}
                {bonus.approved_by && (
                  <p className="text-xs text-center text-blue-600">
                    Approved by {bonus.approved_by}
                  </p>
                )}
                {bonus.notes && (
                 <p className="text-xs text-slate-600 italic text-center">{bonus.notes}</p>
                )}

                {isAdmin && bonus.payment_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => approveMutation.mutate(bonus.id)}
                      disabled={approveMutation.isLoading}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => rejectMutation.mutate(bonus.id)}
                      disabled={rejectMutation.isLoading}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {isAdmin && bonus.payment_status === 'approved' && (
                  <Button
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => markPaidMutation.mutate(bonus.id)}
                    disabled={markPaidMutation.isLoading}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Mark as Paid
                  </Button>
                )}
                </div>
                </div>
                </CardContent>
                </Card>
                ))}
      </div>

      {filteredBonuses.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No bonus calculations found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}