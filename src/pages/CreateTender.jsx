import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function CreateTender() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tender_code: '',
    vertical_id: '',
    required_solutions: [],
    assa_abloy_products: [],
    project_language: 'nl',
    required_service_coverage: [],
    budget_min: 0,
    budget_max: 0,
    estimated_gross_value: 0,
    customer_name: '',
    customer_contact: { name: '', email: '', phone: '' },
    project_location: { street: '', city: '', postal_code: '', country: 'Belgium' },
    response_deadline: '',
    project_start_date: '',
    project_duration: '',
    invitation_strategy: 'qualified_only',
    invited_partners: [],
    status: 'draft',
  });

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

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: serviceCoverageOptions = [] } = useQuery({
    queryKey: ['serviceCoverageOptions'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'service_region_language' && v.active);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tender.create(data),
    onSuccess: (newTender) => {
      queryClient.invalidateQueries(['tenders']);
      navigate(createPageUrl(`TenderDetail?id=${newTender.id}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const tenderData = {
      ...formData,
      budget_min: parseFloat(formData.budget_min) || 0,
      budget_max: parseFloat(formData.budget_max) || 0,
      estimated_gross_value: parseFloat(formData.estimated_gross_value) || 0,
      project_duration: parseInt(formData.project_duration) || 0,
    };
    
    createMutation.mutate(tenderData);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateNestedField = (parent, field, value) => {
    setFormData({
      ...formData,
      [parent]: { ...formData[parent], [field]: value }
    });
  };

  const toggleArrayItem = (field, item) => {
    const current = formData[field] || [];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    setFormData({ ...formData, [field]: updated });
  };

  return (
    <div className="space-y-6">
      <Link to={createPageUrl('Tenders')}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tenders</span>
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Create New Tender</h1>
        <p className="text-slate-600 mt-2">Launch a new tender opportunity for qualified partners</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tender Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tender Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Hospital Access Control System"
                  required
                />
              </div>
              <div>
                <Label>Tender Code *</Label>
                <Input
                  value={formData.tender_code}
                  onChange={(e) => updateField('tender_code', e.target.value)}
                  placeholder="e.g., TND-2024-001"
                  required
                />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed tender description, requirements, and scope"
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => updateField('customer_name', e.target.value)}
                placeholder="End customer/client name"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={formData.customer_contact.name}
                  onChange={(e) => updateNestedField('customer_contact', 'name', e.target.value)}
                  placeholder="Contact person"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.customer_contact.email}
                  onChange={(e) => updateNestedField('customer_contact', 'email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.customer_contact.phone}
                  onChange={(e) => updateNestedField('customer_contact', 'phone', e.target.value)}
                  placeholder="+32 XXX XX XX XX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Location */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Project Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Street</Label>
                <Input
                  value={formData.project_location.street}
                  onChange={(e) => updateNestedField('project_location', 'street', e.target.value)}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.project_location.city}
                  onChange={(e) => updateNestedField('project_location', 'city', e.target.value)}
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={formData.project_location.postal_code}
                  onChange={(e) => updateNestedField('project_location', 'postal_code', e.target.value)}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={formData.project_location.country}
                  onChange={(e) => updateNestedField('project_location', 'country', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Requirements */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Technical Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Vertical Market *</Label>
              <Select value={formData.vertical_id} onValueChange={(val) => updateField('vertical_id', val)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.filter(v => v.active).map(vertical => (
                    <SelectItem key={vertical.id} value={vertical.id}>{vertical.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Required Solutions *</Label>
              <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg">
                {solutions.filter(s => s.active).map(solution => (
                  <label key={solution.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.required_solutions.includes(solution.id)}
                      onChange={() => toggleArrayItem('required_solutions', solution.id)}
                    />
                    <span className="text-sm">{solution.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>ASSA ABLOY Products *</Label>
              <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg">
                {assaAbloyProducts.map(product => (
                  <label key={product.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={formData.assa_abloy_products?.includes(product.value)}
                      onChange={() => toggleArrayItem('assa_abloy_products', product.value)}
                    />
                    <span className="text-sm">{product.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estimated Gross Value (€) *</Label>
                <Input
                  type="number"
                  value={formData.estimated_gross_value}
                  onChange={(e) => updateField('estimated_gross_value', e.target.value)}
                  placeholder="50000"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">ASSA ABLOY list price (before partner discounts)</p>
              </div>
              <div>
                <Label>Budget Min (€)</Label>
                <Input
                  type="number"
                  value={formData.budget_min}
                  onChange={(e) => updateField('budget_min', e.target.value)}
                  placeholder="40000"
                />
              </div>
              <div>
                <Label>Budget Max (€)</Label>
                <Input
                  type="number"
                  value={formData.budget_max}
                  onChange={(e) => updateField('budget_max', e.target.value)}
                  placeholder="60000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Coverage & Language */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Service Coverage & Language</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Project Language *</Label>
              <Select value={formData.project_language} onValueChange={(val) => updateField('project_language', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Dutch (NL)</SelectItem>
                  <SelectItem value="fr">French (FR)</SelectItem>
                  <SelectItem value="en">English (EN)</SelectItem>
                  <SelectItem value="bilingual">Bilingual (NL/FR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Required Service Coverage</Label>
              <p className="text-xs text-slate-500 mb-2">Select regional and language requirements</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-80 overflow-y-auto">
                {serviceCoverageOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white bg-white">
                    <input
                      type="checkbox"
                      checked={formData.required_service_coverage?.includes(option.value)}
                      onChange={() => toggleArrayItem('required_service_coverage', option.value)}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-900">{option.label}</div>
                      <div className="text-xs text-slate-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Response Deadline *</Label>
                <Input
                  type="datetime-local"
                  value={formData.response_deadline}
                  onChange={(e) => updateField('response_deadline', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Expected Project Start</Label>
                <Input
                  type="date"
                  value={formData.project_start_date}
                  onChange={(e) => updateField('project_start_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Project Duration (days)</Label>
                <Input
                  type="number"
                  value={formData.project_duration}
                  onChange={(e) => updateField('project_duration', e.target.value)}
                  placeholder="90"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Selection */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Partner Invitation Strategy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Invitation Strategy *</Label>
              <Select value={formData.invitation_strategy} onValueChange={(val) => updateField('invitation_strategy', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open (All Partners)</SelectItem>
                  <SelectItem value="qualified_only">Qualified Only</SelectItem>
                  <SelectItem value="invited_only">Invited Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.invitation_strategy === 'invited_only' && (
              <div>
                <Label>Invite Specific Partners</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                  {partners.filter(p => p.status === 'active').map(partner => (
                    <label key={partner.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.invited_partners.includes(partner.id)}
                        onChange={() => toggleArrayItem('invited_partners', partner.id)}
                      />
                      <span className="text-sm">{partner.company_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate(createPageUrl('Tenders'))}
          >
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button 
              type="submit" 
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                const draftData = { ...formData, status: 'draft' };
                setFormData(draftData);
                createMutation.mutate(draftData);
              }}
              disabled={createMutation.isPending}
            >
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={(e) => {
                e.preventDefault();
                const publishedData = { ...formData, status: 'published' };
                setFormData(publishedData);
                handleSubmit(e);
              }}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Publish Tender'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}