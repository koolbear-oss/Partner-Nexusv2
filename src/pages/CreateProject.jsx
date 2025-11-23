import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Briefcase } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function CreateProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { partnerId } = useCurrentUser();

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    description: '',
    primary_solution: '',
    additional_solutions: [],
    product_groups: [],
    vertical_id: '',
    estimated_value: '',
    project_type: 'new_installation',
    complexity: 'medium',
    deadline: '',
    project_language: 'nl',
    required_service_coverage: [],
    project_location: {
      street: '',
      city: '',
      postal_code: '',
      country: 'Belgium'
    },
    customer_contact: {
      name: '',
      email: '',
      phone: ''
    },
    assa_abloy_products: []
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: currentPartner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: productGroups = [] } = useQuery({
    queryKey: ['productGroups'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'product_group' && v.active);
    },
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assaAbloyProducts'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'assa_abloy_products' && v.active);
    },
  });

  const { data: serviceCoverageOptions = [] } = useQuery({
    queryKey: ['serviceCoverageOptions'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'service_region_language' && v.active);
    },
  });

  // Filter product groups based on partner's allowed groups
  const allowedProductGroups = productGroups.filter(pg => 
    !currentPartner?.product_groups || currentPartner.product_groups.length === 0 || 
    currentPartner.product_groups.includes(pg.value)
  );

  // Filter ASSA ABLOY products based on partner's authorization
  const allowedAssaAbloyProducts = assaAbloyProducts.filter(product =>
    !currentPartner?.assa_abloy_products || currentPartner.assa_abloy_products.length === 0 ||
    currentPartner.assa_abloy_products.includes(product.value)
  );

  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const payload = {
        ...projectData,
        source: 'partner_initiated',
        status: 'partner_matching',
        assigned_partner_id: partnerId,
        solution_ids: [projectData.primary_solution, ...(projectData.additional_solutions || [])]
      };
      return base44.entities.Project.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      navigate(createPageUrl('Projects'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createProjectMutation.mutate(formData);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to={createPageUrl('Projects')}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Submit New Project</h1>
        <p className="text-slate-600 mt-2">Register a new project for ASSA ABLOY review and tracking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => updateField('project_name', e.target.value)}
                  placeholder="e.g., Hospital Security Upgrade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  placeholder="e.g., General Hospital Brussels"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of the project scope and objectives..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type *</Label>
                <Select value={formData.project_type} onValueChange={(val) => updateField('project_type', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new_installation">New Installation</SelectItem>
                    <SelectItem value="upgrade">Upgrade</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complexity">Complexity *</Label>
                <Select value={formData.complexity} onValueChange={(val) => updateField('complexity', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solutions & Market */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Solutions & Market</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_solution">Primary Solution *</Label>
                <Select value={formData.primary_solution} onValueChange={(val) => updateField('primary_solution', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select solution" />
                  </SelectTrigger>
                  <SelectContent>
                    {solutions.map(sol => (
                      <SelectItem key={sol.id} value={sol.id}>{sol.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vertical_id">Vertical Market *</Label>
                <Select value={formData.vertical_id} onValueChange={(val) => updateField('vertical_id', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    {verticals.map(vert => (
                      <SelectItem key={vert.id} value={vert.id}>{vert.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected ASSA ABLOY Product Groups *</Label>
              <p className="text-xs text-slate-500 mb-2">Select the product groups you plan to propose for this project</p>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[60px]">
                {allowedProductGroups.length > 0 ? (
                  allowedProductGroups.map(pg => (
                    <label key={pg.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.product_groups?.includes(pg.value)}
                        onChange={(e) => {
                          const current = formData.product_groups || [];
                          const updated = e.target.checked
                            ? [...current, pg.value]
                            : current.filter(v => v !== pg.value);
                          updateField('product_groups', updated);
                        }}
                      />
                      <span className="text-sm">{pg.label}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic">No product groups available for your partner profile</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ASSA ABLOY Product Solutions</Label>
              <p className="text-xs text-slate-500 mb-2">Select which ASSA ABLOY products are likely present in this project</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 bg-slate-50 rounded-lg border border-slate-200">
                {allowedAssaAbloyProducts.length > 0 ? (
                  allowedAssaAbloyProducts.map(product => (
                    <label key={product.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.assa_abloy_products?.includes(product.value)}
                        onChange={(e) => {
                          const current = formData.assa_abloy_products || [];
                          const updated = e.target.checked
                            ? [...current, product.value]
                            : current.filter(v => v !== product.value);
                          updateField('assa_abloy_products', updated);
                        }}
                      />
                      <span className="text-sm">{product.label}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic col-span-3">No ASSA ABLOY products available for your partner profile</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial & Timeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Financial & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value (EUR) *</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => updateField('estimated_value', parseFloat(e.target.value))}
                  placeholder="e.g., 50000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Expected Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service Coverage & Language */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Service Coverage & Language Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_language">Project Language *</Label>
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
            <div className="space-y-2">
              <Label>Required Service Coverage</Label>
              <p className="text-xs text-slate-500 mb-2">Select the regional and language coverage needed for this project</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-80 overflow-y-auto">
                {serviceCoverageOptions.map(option => (
                  <label key={option.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-white bg-white">
                    <input
                      type="checkbox"
                      checked={formData.required_service_coverage?.includes(option.value)}
                      onChange={(e) => {
                        const current = formData.required_service_coverage || [];
                        const updated = e.target.checked
                          ? [...current, option.value]
                          : current.filter(v => v !== option.value);
                        updateField('required_service_coverage', updated);
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
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Project Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.project_location.street}
                onChange={(e) => updateNestedField('project_location', 'street', e.target.value)}
                placeholder="e.g., Rue de la Loi 155"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.project_location.city}
                  onChange={(e) => updateNestedField('project_location', 'city', e.target.value)}
                  placeholder="e.g., Brussels"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.project_location.postal_code}
                  onChange={(e) => updateNestedField('project_location', 'postal_code', e.target.value)}
                  placeholder="e.g., 1040"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.project_location.country}
                  onChange={(e) => updateNestedField('project_location', 'country', e.target.value)}
                  placeholder="Belgium"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Contact */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Customer Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.customer_contact.name}
                  onChange={(e) => updateNestedField('customer_contact', 'name', e.target.value)}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.customer_contact.email}
                  onChange={(e) => updateNestedField('customer_contact', 'email', e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.customer_contact.phone}
                  onChange={(e) => updateNestedField('customer_contact', 'phone', e.target.value)}
                  placeholder="+32 2 xxx xx xx"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('Projects'))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={createProjectMutation.isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            {createProjectMutation.isLoading ? 'Submitting...' : 'Submit Project'}
          </Button>
        </div>
      </form>
    </div>
  );
}