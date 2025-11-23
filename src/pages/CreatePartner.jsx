import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function CreatePartner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    company_name: '',
    legal_name: '',
    partner_type: 'installer',
    status: 'pending_onboarding',
    tier: 'entry',
    primary_contact: {
      name: '',
      email: '',
      phone: '',
      language_preference: 'nl'
    },
    addresses: [{
      type: 'headquarters',
      street: '',
      city: '',
      postal_code: '',
      country: 'Belgium',
      is_primary: true
    }],
    website: '',
    vat_number: '',
    team_size: '',
    language_preferences: ['nl'],
    service_coverage: [],
    services: [],
    solutions: [],
    verticals: [],
    assa_abloy_products: [],
    notes: ''
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: partnerTypes = [] } = useQuery({
    queryKey: ['dropdownValues', 'partner_type'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'partner_type' && d.active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['dropdownValues', 'assa_abloy_products'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'assa_abloy_products' && d.active);
    },
  });

  const { data: serviceCoverageOptions = [] } = useQuery({
    queryKey: ['dropdownValues', 'service_region_language'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'service_region_language' && d.active).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    },
  });

  const createPartnerMutation = useMutation({
    mutationFn: (partnerData) => base44.entities.Partner.create(partnerData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['partners']);
      navigate(createPageUrl(`PartnerDetail?id=${data.id}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure backward compatibility with legacy contact fields
    const dataToSubmit = {
      ...formData,
      contact_email: formData.primary_contact?.email || '',
      contact_name: formData.primary_contact?.name || '',
      contact_phone: formData.primary_contact?.phone || '',
    };
    createPartnerMutation.mutate(dataToSubmit);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value }
    }));
  };

  const updateAddressField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      addresses: [{ ...(prev.addresses?.[0] || {}), [field]: value }]
    }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      return {
        ...prev,
        [field]: currentArray.includes(value)
          ? currentArray.filter(item => item !== value)
          : [...currentArray, value]
      };
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to={createPageUrl('Partners')}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partners</span>
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create New Partner</h1>
        <p className="text-slate-600 mt-2">Add a new partner to your network</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name (Trading Name) *</Label>
                <Input
                  id="company_name"
                  value={formData?.company_name || ''}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="e.g., SecureGate Solutions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={formData?.legal_name || ''}
                  onChange={(e) => updateField('legal_name', e.target.value)}
                  placeholder="e.g., SecureGate Solutions BV"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner_type">Partner Type *</Label>
                <Select value={formData?.partner_type || 'installer'} onValueChange={(val) => updateField('partner_type', val)}>
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
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input
                  id="vat_number"
                  value={formData?.vat_number || ''}
                  onChange={(e) => updateField('vat_number', e.target.value)}
                  placeholder="BE0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_size">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  value={formData?.team_size || ''}
                  onChange={(e) => updateField('team_size', parseInt(e.target.value))}
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData?.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="www.example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Primary Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  value={formData.primary_contact?.name || ''}
                  onChange={(e) => updateNestedField('primary_contact', 'name', e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.primary_contact?.email || ''}
                  onChange={(e) => updateNestedField('primary_contact', 'email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.primary_contact?.phone || ''}
                  onChange={(e) => updateNestedField('primary_contact', 'phone', e.target.value)}
                  placeholder="+32 2 xxx xx xx"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Headquarters Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={formData.addresses?.[0]?.street || ''}
                onChange={(e) => updateAddressField('street', e.target.value)}
                placeholder="Rue de la Loi 155"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.addresses?.[0]?.city || ''}
                  onChange={(e) => updateAddressField('city', e.target.value)}
                  placeholder="Brussels"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.addresses?.[0]?.postal_code || ''}
                  onChange={(e) => updateAddressField('postal_code', e.target.value)}
                  placeholder="1040"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.addresses?.[0]?.country || 'Belgium'}
                  onChange={(e) => updateAddressField('country', e.target.value)}
                  placeholder="Belgium"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Coverage */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Service Coverage & Language Capabilities</CardTitle>
            <p className="text-sm text-slate-600">Define which regions and languages this partner can support for project delivery</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Service Coverage Areas</Label>
              <p className="text-xs text-slate-500 mb-2">Select all regions and language combinations this partner can support</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {serviceCoverageOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white bg-white">
                    <input
                      type="checkbox"
                      checked={formData.service_coverage?.includes(option.value) || false}
                      onChange={() => toggleArrayItem('service_coverage', option.value)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-900">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-slate-500">{option.description}</div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Communication Languages</Label>
              <p className="text-xs text-slate-500 mb-2">Languages for internal communication and documentation</p>
              <div className="flex flex-wrap gap-2">
                {['nl', 'fr', 'en'].map(lang => (
                  <label key={lang} className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-slate-50 bg-white">
                    <input
                      type="checkbox"
                      checked={formData.language_preferences?.includes(lang) || false}
                      onChange={() => toggleArrayItem('language_preferences', lang)}
                    />
                    <span className="text-sm font-medium">
                      {lang === 'nl' ? 'Dutch (NL)' : lang === 'fr' ? 'French (FR)' : 'English (EN)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solutions & Verticals */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Solutions & Verticals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Solutions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {solutions.filter(s => s.active).map(solution => (
                  <div key={solution.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`solution-${solution.id}`}
                      checked={formData.solutions?.includes(solution.code) || false}
                      onCheckedChange={() => toggleArrayItem('solutions', solution.code)}
                    />
                    <label htmlFor={`solution-${solution.id}`} className="text-sm cursor-pointer">
                      {solution.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Vertical Markets</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {verticals.filter(v => v.active).map(vertical => (
                  <div key={vertical.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vertical-${vertical.id}`}
                      checked={formData.verticals?.includes(vertical.code) || false}
                      onCheckedChange={() => toggleArrayItem('verticals', vertical.code)}
                    />
                    <label htmlFor={`vertical-${vertical.id}`} className="text-sm cursor-pointer">
                      {vertical.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ASSA ABLOY Products Authorization */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">ASSA ABLOY Product Authorization</CardTitle>
            <p className="text-sm text-slate-600">Select which ASSA ABLOY products this partner is authorized to sell and include in the discount matrix</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Authorized ASSA ABLOY Products</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-slate-50 rounded-lg border border-slate-200">
                {assaAbloyProducts.map(product => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.assa_abloy_products?.includes(product.value) || false}
                      onCheckedChange={() => toggleArrayItem('assa_abloy_products', product.value)}
                    />
                    <label htmlFor={`product-${product.id}`} className="text-sm cursor-pointer">
                      {product.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData?.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any additional information about this partner..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Partners'))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createPartnerMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {createPartnerMutation.isPending ? 'Creating...' : 'Create Partner'}
          </Button>
        </div>
      </form>
    </div>
  );
}