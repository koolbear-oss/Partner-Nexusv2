import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Store, Mail, Phone, MapPin, Award, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSolution, setFilterSolution] = useState('all');
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterTier, setFilterTier] = useState('all');

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

  // Filter only opt-in partners
  const visiblePartners = partners.filter(p => 
    p.visibility_opt_in && p.status === 'active'
  );

  const filteredPartners = visiblePartners.filter(partner => {
    const matchesSearch = partner.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSolution = filterSolution === 'all' || 
      partner.solutions?.some(s => solutions.find(sol => sol.id === s)?.code === filterSolution);
    const matchesVertical = filterVertical === 'all' || 
      partner.verticals?.some(v => verticals.find(vert => vert.id === v)?.code === filterVertical);
    const matchesTier = filterTier === 'all' || partner.tier === filterTier;
    
    return matchesSearch && matchesSolution && matchesVertical && matchesTier;
  });

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800 border-purple-300',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    silver: 'bg-slate-100 text-slate-800 border-slate-300',
    bronze: 'bg-orange-100 text-orange-800 border-orange-300',
    entry: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  const getSolutionNames = (solutionIds) => {
    if (!solutionIds || solutionIds.length === 0) return [];
    return solutionIds.map(id => solutions.find(s => s.id === id)?.name).filter(Boolean);
  };

  const getVerticalNames = (verticalIds) => {
    if (!verticalIds || verticalIds.length === 0) return [];
    return verticalIds.map(id => verticals.find(v => v.id === id)?.name).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Partner Marketplace</h1>
          <p className="text-slate-600 mt-2">
            Browse {filteredPartners.length} partners available for collaboration
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
            <Eye className="w-4 h-4" />
            <span>Partners must opt-in to appear in the marketplace</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Visible Partners</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{visiblePartners.length}</p>
              </div>
              <Store className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Platinum Tier</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {visiblePartners.filter(p => p.tier === 'platinum').length}
                </p>
              </div>
              <Award className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Avg Rating</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {(visiblePartners.reduce((sum, p) => sum + (p.avg_project_rating || 0), 0) / 
                    visiblePartners.filter(p => p.avg_project_rating > 0).length || 1).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Total Projects</p>
                <p className="text-2xl font-bold text-amber-900 mt-1">
                  {visiblePartners.reduce((sum, p) => sum + (p.projects_completed || 0), 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
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
            <Select value={filterSolution} onValueChange={setFilterSolution}>
              <SelectTrigger>
                <SelectValue placeholder="All Solutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Solutions</SelectItem>
                {solutions.map(sol => (
                  <SelectItem key={sol.id} value={sol.code}>{sol.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterVertical} onValueChange={setFilterVertical}>
              <SelectTrigger>
                <SelectValue placeholder="All Verticals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verticals</SelectItem>
                {verticals.map(vert => (
                  <SelectItem key={vert.id} value={vert.code}>{vert.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPartners.map(partner => (
          <Link key={partner.id} to={createPageUrl(`PartnerDetail?id=${partner.id}`)}>
            <Card className="h-full shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-t-4 border-t-purple-600 hover:border-t-purple-700 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{partner.company_name}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={`${tierColors[partner.tier]} border font-semibold`}>
                        {partner.tier.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-50">
                        {partner.partner_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-700">{partner.tier_score}</div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{partner.contact_email}</span>
                  </div>
                  {partner.contact_phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{partner.contact_phone}</span>
                    </div>
                  )}
                  {partner.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{partner.address.split(',')[0]}</span>
                    </div>
                  )}
                </div>

                {/* Solutions */}
                {getSolutionNames(partner.solutions).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 mb-2">Solutions</div>
                    <div className="flex flex-wrap gap-1">
                      {getSolutionNames(partner.solutions).slice(0, 3).map((name, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {name}
                        </Badge>
                      ))}
                      {getSolutionNames(partner.solutions).length > 3 && (
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          +{getSolutionNames(partner.solutions).length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Verticals */}
                {getVerticalNames(partner.verticals).length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-slate-500 mb-2">Verticals</div>
                    <div className="flex flex-wrap gap-1">
                      {getVerticalNames(partner.verticals).slice(0, 2).map((name, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                          {name}
                        </Badge>
                      ))}
                      {getVerticalNames(partner.verticals).length > 2 && (
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          +{getVerticalNames(partner.verticals).length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Performance */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">{partner.projects_completed}</div>
                    <div className="text-xs text-slate-500">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">
                      {partner.avg_project_rating > 0 ? partner.avg_project_rating.toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-slate-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700">
                      {partner.certifications_valid ? <CheckCircle2 className="w-5 h-5 mx-auto" /> : '-'}
                    </div>
                    <div className="text-xs text-slate-500">Certified</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredPartners.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No partners found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms</p>
          </CardContent>
        </Card>
      )}

      {/* Privacy Note */}
      <Card className="shadow-sm bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-900 mb-1">Privacy & Visibility</h4>
              <p className="text-sm text-slate-600">
                Only partners who have opted-in to marketplace visibility are shown here. 
                {partners.filter(p => !p.visibility_opt_in).length} partners have chosen to remain private.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { CheckCircle2 } from 'lucide-react';