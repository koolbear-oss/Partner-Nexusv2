import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, DollarSign, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export default function Bonuses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPaid, setFilterPaid] = useState('all');

  const { data: bonuses = [] } = useQuery({
    queryKey: ['bonuses'],
    queryFn: () => base44.entities.BonusCalculation.list('-year', 100),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const filteredBonuses = bonuses.filter(bonus => {
    const partner = partners.find(p => p.id === bonus.partner_id);
    const matchesSearch = partner?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bonus.quarter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || bonus.year.toString() === filterYear;
    const matchesPaid = filterPaid === 'all' || 
                       (filterPaid === 'paid' && bonus.paid) ||
                       (filterPaid === 'unpaid' && !bonus.paid);
    return matchesSearch && matchesYear && matchesPaid;
  });

  const getPartnerName = (partnerId) => partners.find(p => p.id === partnerId)?.company_name || 'Unknown';

  const years = [...new Set(bonuses.map(b => b.year))].sort((a, b) => b - a);

  const stats = {
    totalAmount: bonuses.reduce((sum, b) => sum + (b.bonus_amount || 0), 0),
    paidAmount: bonuses.filter(b => b.paid).reduce((sum, b) => sum + (b.bonus_amount || 0), 0),
    unpaidAmount: bonuses.filter(b => !b.paid).reduce((sum, b) => sum + (b.bonus_amount || 0), 0),
    totalBonuses: bonuses.length,
    paidBonuses: bonuses.filter(b => b.paid).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bonus Calculations</h1>
        <p className="text-slate-600 mt-2">Quarterly performance-based partner incentives</p>
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
                <p className="text-sm text-slate-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  €{(stats.unpaidAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Pending Payment</SelectItem>
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
                          {bonus.quarter}
                        </Badge>
                        {bonus.paid ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 border">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 border">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
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

                <div className="lg:min-w-[220px] space-y-3">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 text-center border border-green-200">
                    <p className="text-xs text-green-700 mb-1">Bonus Amount</p>
                    <p className="text-3xl font-bold text-green-900">
                      €{bonus.bonus_amount?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {bonus.bonus_percentage}% of revenue
                    </p>
                  </div>
                  {bonus.paid && bonus.paid_date && (
                    <p className="text-xs text-center text-slate-600">
                      Paid on {new Date(bonus.paid_date).toLocaleDateString()}
                    </p>
                  )}
                  {bonus.notes && (
                    <p className="text-xs text-slate-600 italic text-center">{bonus.notes}</p>
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