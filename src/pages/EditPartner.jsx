import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function EditPartner() {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  const [formData, setFormData] = useState(partner || {});

  React.useEffect(() => {
    if (partner) setFormData(partner);
  }, [partner]);

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assaAbloyProducts'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'assa_abloy_products' && v.active);
    },
  });

  const { data: partnerTypes = [] } = useQuery({
    queryKey: ['dropdownValues', 'partner_type'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'partner_type' && d.active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  const { data: serviceCoverageOptions = [] } = useQuery({
    queryKey: ['serviceCoverageOptions'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'service_region_language' && v.active);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Partner.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['partner', partnerId]);
      queryClient.invalidateQueries(['partners']);
      navigate(createPageUrl(`PartnerDetail?id=${partnerId}`));
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
      console.error('Logo upload failed:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: partnerId, data: formData });
  };

  if (isLoading || !partner) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Link to={createPageUrl(`PartnerDetail?id=${partnerId}`)}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Details</span>
        </button>
      </Link>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Partner: {partner.company_name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.logo_url && (
                  <div className="relative">
                    <img src={formData.logo_url} alt="Logo" className="w-20 h-20 object-contain border rounded" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo_url: null })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo'}</span>
                  </div>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                </label>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Legal Name</Label>
                <Input
                  value={formData.legal_name || ''}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Partner Type *</Label>
                <Select value={formData.partner_type} onValueChange={(val) => setFormData({ ...formData, partner_type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {partnerTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_onboarding">Pending Onboarding</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tier (Auto-Calculated)</Label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <Badge className={`text-sm font-bold px-3 py-1 ${
                      formData.tier === 'platinum' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      formData.tier === 'gold' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                      formData.tier === 'silver' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                      formData.tier === 'bronze' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                      'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {(formData.tier || 'entry').toUpperCase()}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">Score: {formData.tier_score || 0}</div>
                      {formData.tier_rank_percentage && (
                        <div className="text-xs text-slate-500">Top {(100 - formData.tier_rank_percentage).toFixed(0)}%</div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Tier is automatically calculated. Visit Tier Settings to configure.
                </p>
              </div>
              <div>
                <Label>Team Size</Label>
                <Input
                  type="number"
                  value={formData.team_size || ''}
                  onChange={(e) => setFormData({ ...formData, team_size: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.primary_contact?.name || formData.contact_name || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      primary_contact: { ...(formData.primary_contact || {}), name: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={formData.primary_contact?.email || formData.contact_email || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      primary_contact: { ...(formData.primary_contact || {}), email: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.primary_contact?.phone || formData.contact_phone || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      primary_contact: { ...(formData.primary_contact || {}), phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Service Coverage */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Service Area & Language Capabilities</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Service Coverage</Label>
                  <p className="text-xs text-slate-500 mb-2">Select which regions and languages this partner can support</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {serviceCoverageOptions.map(option => (
                      <label key={option.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white bg-white">
                        <input
                          type="checkbox"
                          checked={formData.service_coverage?.includes(option.value)}
                          onChange={(e) => {
                            const current = formData.service_coverage || [];
                            const updated = e.target.checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value);
                            setFormData({ ...formData, service_coverage: updated });
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm text-slate-900">{option.label}</div>
                          <div className="text-xs text-slate-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Preferred Languages</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['nl', 'fr', 'en'].map(lang => (
                      <label key={lang} className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={formData.language_preferences?.includes(lang)}
                          onChange={(e) => {
                            const current = formData.language_preferences || [];
                            const updated = e.target.checked
                              ? [...current, lang]
                              : current.filter(l => l !== lang);
                            setFormData({ ...formData, language_preferences: updated });
                          }}
                        />
                        <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions & Verticals */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Solutions & Markets</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Solutions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {solutions.map(solution => (
                      <label key={solution.code} className="flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={formData.solutions?.includes(solution.code) || formData.solutions?.includes(solution.id)}
                          onChange={(e) => {
                            const current = formData.solutions || [];
                            const updated = e.target.checked
                              ? [...current.filter(s => !solutions.find(sol => sol.id === s || sol.code === s)), solution.code]
                              : current.filter(s => s !== solution.code && s !== solution.id);
                            setFormData({ ...formData, solutions: updated });
                          }}
                        />
                        <span className="text-sm">{solution.name}</span>
                      </label>
                    ))}
                    {formData.solutions?.filter(s => !solutions.find(sol => sol.code === s || sol.id === s)).length > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 border px-2 py-1 text-xs">
                        {formData.solutions.filter(s => !solutions.find(sol => sol.code === s || sol.id === s)).length} legacy item(s)
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Vertical Markets</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {verticals.map(vertical => (
                      <label key={vertical.code} className="flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={formData.verticals?.includes(vertical.code) || formData.verticals?.includes(vertical.id)}
                          onChange={(e) => {
                            const current = formData.verticals || [];
                            const updated = e.target.checked
                              ? [...current.filter(v => !verticals.find(vert => vert.id === v || vert.code === v)), vertical.code]
                              : current.filter(v => v !== vertical.code && v !== vertical.id);
                            setFormData({ ...formData, verticals: updated });
                          }}
                        />
                        <span className="text-sm">{vertical.name}</span>
                      </label>
                    ))}
                    {formData.verticals?.filter(v => !verticals.find(vert => vert.code === v || vert.id === v)).length > 0 && (
                      <Badge className="bg-red-100 text-red-800 border-red-300 border px-2 py-1 text-xs">
                        {formData.verticals.filter(v => !verticals.find(vert => vert.code === v || vert.id === v)).length} legacy item(s)
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Authorized ASSA ABLOY Products</Label>
                  <p className="text-xs text-slate-500 mb-2">Select which ASSA ABLOY products this partner is authorized to sell (used in discount matrix)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-lg border border-slate-200">
                    {assaAbloyProducts.map(product => (
                      <label key={product.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.assa_abloy_products?.includes(product.value)}
                          onChange={(e) => {
                            const current = formData.assa_abloy_products || [];
                            const updated = e.target.checked
                              ? [...current, product.value]
                              : current.filter(v => v !== product.value);
                            setFormData({ ...formData, assa_abloy_products: updated });
                          }}
                        />
                        <span className="text-sm">{product.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  if (confirm('This will remove all legacy data (UUIDs) and duplicates. Continue?')) {
                    // Clean and deduplicate solutions
                    const cleanSolutions = [...new Set(
                      formData.solutions
                        ?.map(s => {
                          const sol = solutions.find(sol => sol.code === s || sol.id === s);
                          return sol ? sol.code : null;
                        })
                        .filter(Boolean) || []
                    )];
                    
                    // Clean and deduplicate verticals
                    const cleanVerticals = [...new Set(
                      formData.verticals
                        ?.map(v => {
                          const vert = verticals.find(vert => vert.code === v || vert.id === v);
                          return vert ? vert.code : null;
                        })
                        .filter(Boolean) || []
                    )];
                    
                    setFormData({ ...formData, solutions: cleanSolutions, verticals: cleanVerticals });
                  }
                }}
                className="text-orange-600 hover:text-orange-700"
              >
                Clean Up Legacy Data
              </Button>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(createPageUrl(`PartnerDetail?id=${partnerId}`))}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}