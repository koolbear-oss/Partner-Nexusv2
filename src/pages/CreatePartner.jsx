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
    services: [],
    solutions: [],
    verticals: [],
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

  const createPartnerMutation = useMutation({
    mutationFn: (partnerData) => base44.entities.Partner.create(partnerData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['partners']);
      navigate(createPageUrl(`PartnerDetail?id=${data.id}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createPartnerMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const updateAddressField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      addresses: [{ ...prev.addresses[0], [field]: value }]
    }));
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
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
                  value={formData.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="e.g., SecureGate Solutions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legal_name">Legal Name</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => updateField('legal_name', e.target.value)}
                  placeholder="e.g., SecureGate Solutions BV"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partner_type">Partner Type *</Label>
                <Select value={formData.partner_type} onValueChange={(val) => updateField('partner_type', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installer">Installer</SelectItem>
                    <SelectItem value="integrator">Integrator</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="reseller">Reseller</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="service_provider">Service Provider</SelectItem>
                    <SelectItem value="technology_partner">Technology Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vat_number">VAT Number</Label>
                <Input
                  id="vat_number"
                  value={formData.vat_number}
                  onChange={(e) => updateField('vat_number', e.target.value)}
                  placeholder="BE0123456789"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_size">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  value={formData.team_size}
                  onChange={(e) => updateField('team_size', parseInt(e.target.value))}
                  placeholder="e.g., 25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
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
                  value={formData.primary_contact.name}
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
                  value={formData.primary_contact.email}
                  onChange={(e) => updateNestedField('primary_contact', 'email', e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.primary_contact.phone}
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
                value={formData.addresses[0].street}
                onChange={(e) => updateAddressField('street', e.target.value)}
                placeholder="Rue de la Loi 155"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.addresses[0].city}
                  onChange={(e) => updateAddressField('city', e.target.value)}
                  placeholder="Brussels"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.addresses[0].postal_code}
                  onChange={(e) => updateAddressField('postal_code', e.target.value)}
                  placeholder="1040"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.addresses[0].country}
                  onChange={(e) => updateAddressField('country', e.target.value)}
                  placeholder="Belgium"
                />
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
                {solutions.map(solution => (
                  <div key={solution.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`solution-${solution.id}`}
                      checked={formData.solutions.includes(solution.id)}
                      onCheckedChange={() => toggleArrayItem('solutions', solution.id)}
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
                {verticals.map(vertical => (
                  <div key={vertical.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vertical-${vertical.id}`}
                      checked={formData.verticals.includes(vertical.id)}
                      onCheckedChange={() => toggleArrayItem('verticals', vertical.id)}
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

        {/* Notes */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
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
            disabled={createPartnerMutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {createPartnerMutation.isLoading ? 'Creating...' : 'Create Partner'}
          </Button>
        </div>
      </form>
    </div>
  );
}