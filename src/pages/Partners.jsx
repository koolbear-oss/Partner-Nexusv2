import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MapPin, Phone, Mail, ExternalLink, Award, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Partners() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || partner.partner_type === filterType;
    const matchesTier = filterTier === 'all' || partner.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;
    return matchesSearch && matchesType && matchesTier && matchesStatus;
  });

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    pending_onboarding: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Partner Network</h1>
          <p className="text-slate-600 mt-2">Manage your {partners.length} partners across all tiers and types</p>
        </div>
        <Link to={createPageUrl('CreatePartner')}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Partner
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search partners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Partner Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="installer">Installer</SelectItem>
                <SelectItem value="integrator">Integrator</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="technology_partner">Technology Partner</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="Tier" />
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending_onboarding">Pending Onboarding</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPartners.map((partner) => (
          <Link key={partner.id} to={createPageUrl(`PartnerDetail?id=${partner.id}`)}>
            <Card className="h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-t-4 border-t-blue-600 hover:border-t-blue-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-slate-900 mb-2">
                      {partner.company_name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={`${tierColors[partner.tier]} border text-xs font-semibold px-2 py-1`}>
                        {partner.tier.toUpperCase()}
                      </Badge>
                      <Badge className={`${statusColors[partner.status]} text-xs px-2 py-1`}>
                        {partner.status.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {partner.partner_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{partner.tier_score}</div>
                    <div className="text-xs text-slate-500">Tier Score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{partner.contact_email}</span>
                  </div>
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{partner.contact_phone}</span>
                    </div>
                  )}
                  {partner.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{partner.address.split(',')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{partner.projects_completed}</div>
                    <div className="text-xs text-slate-500">Projects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {partner.avg_project_rating > 0 ? partner.avg_project_rating.toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-slate-500">Rating</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{partner.solutions?.length || 0}</div>
                    <div className="text-xs text-slate-500">Solutions</div>
                  </div>
                </div>

                {/* Alerts */}
                {!partner.certifications_valid && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                    <Award className="w-4 h-4" />
                    <span>Certification issues</span>
                  </div>
                )}
                {partner.certifications_expiring_soon > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                    <Award className="w-4 h-4" />
                    <span>{partner.certifications_expiring_soon} cert(s) expiring soon</span>
                  </div>
                )}
                {partner.bonus_eligible && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
                    <TrendingUp className="w-4 h-4" />
                    <span>Bonus eligible</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No partners found</h3>
            <p className="text-slate-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}