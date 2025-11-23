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
import { ArrowLeft, AlertCircle, MapPin } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { inferServiceRequirements } from '../components/utils/regionInference';

export default function AssignProject() {
  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('partnerId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    customer_contact: { name: '', email: '', phone: '' },
    project_type: 'new_installation',
    source: 'direct_assignment',
    status: 'assigned',
    primary_solution: '',
    additional_solutions: [],
    vertical_id: '',
    assa_abloy_products: [],
    project_language: 'nl',
    required_service_coverage: [],
    complexity: 'medium',
    project_location: { street: '', city: '', postal_code: '', country: 'Belgium' },
    estimated_value: '',
    start_date: '',
    deadline: '',
    assigned_partner_id: partnerId,
    notes: ''
  });

  // Track location-based inference
  const [locationInference, setLocationInference] = React.useState(null);

  const { data: partner, isLoading: loadingPartner, isError, error } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      const foundPartner = partners.find(p => p.id === partnerId);
      if (!foundPartner) {
        throw new Error('Partner not found');
      }
      return foundPartner;
    },
    enabled: !!partnerId,
    retry: false,
  });

  React.useEffect(() => {
    if (formData.project_location?.postal_code) {
      const inference = inferServiceRequirements(formData.project_location);
      setLocationInference(inference);
    } else {
      setLocationInference(null);
    }
  }, [formData.project_location?.postal_code, formData.project_location?.city]);

  const { data: allSolutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const { data: allVerticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: allProducts = [] } = useQuery({
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

  // Filter based on partner capabilities
  const availableSolutions = allSolutions.filter(s => 
    partner?.solutions?.includes(s.code) || partner?.solutions?.includes(s.id)
  );

  const availableVerticals = allVerticals.filter(v => 
    partner?.verticals?.includes(v.code) || partner?.verticals?.includes(v.id)
  );

  const availableProducts = allProducts.filter(p => 
    partner?.assa_abloy_products?.includes(p.value)
  );

  const availableCoverage = serviceCoverageOptions.filter(c =>
    partner?.service_coverage?.includes(c.value)
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries(['projects']);
      queryClient.invalidateQueries(['partner-projects', partnerId]);
      navigate(createPageUrl(`ProjectDetail?id=${newProject.id}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const projectData = {
      ...formData,
      estimated_value: parseFloat(formData.estimated_value) || 0,
    };
    createMutation.mutate(projectData);
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

  if (loadingPartner) {
    return <div className="flex items-center justify-center h-64">Loading partner information...</div>;
  }

  if (isError || !partner) {
    return (
      <div className="space-y-6">
        <Link to={createPageUrl('Partners')}>
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Partners</span>
          </button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Partner not found. The partner may have been deleted or the link is invalid.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const hasNoCapabilities = availableSolutions.length === 0 && availableVerticals.length === 0;

  return (
    <div className="space-y-6">
      <Link to={createPageUrl(`PartnerDetail?id=${partnerId}`)}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Partner Details</span>
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assign Project to {partner.company_name}</h1>
        <p className="text-slate-600 mt-2">Create and directly assign a project to this partner based on their capabilities</p>
      </div>

      {/* Partner Capabilities Summary */}
      <Card className="border-l-4 border-l-blue-600 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Partner Tier:</span>
              <Badge>{partner.tier.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Authorized Verticals:</span>
              <span className="text-slate-600">{availableVerticals.length} available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Authorized Solutions:</span>
              <span className="text-slate-600">{availableSolutions.length} available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Authorized Products:</span>
              <span className="text-slate-600">{availableProducts.length} available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-700">Service Coverage:</span>
              <span className="text-slate-600">{availableCoverage.length} regions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasNoCapabilities && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This partner has no authorized verticals or solutions configured. Please update their profile before assigning projects.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Name *</Label>
                <Input
                  value={formData.project_name}
                  onChange={(e) => updateField('project_name', e.target.value)}
                  placeholder="e.g., Hospital Access Control Installation"
                  required
                />
              </div>
              <div>
                <Label>Client Name *</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => updateField('client_name', e.target.value)}
                  placeholder="End customer name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Project Type</Label>
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
              <div>
                <Label>Complexity</Label>
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

        {/* Customer Contact */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Customer Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Contact Name</Label>
                <Input
                  value={formData.customer_contact.name}
                  onChange={(e) => updateNestedField('customer_contact', 'name', e.target.value)}
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.customer_contact.email}
                  onChange={(e) => updateNestedField('customer_contact', 'email', e.target.value)}
                />
              </div>
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.customer_contact.phone}
                  onChange={(e) => updateNestedField('customer_contact', 'phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Requirements - Filtered by Partner Capabilities */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Technical Requirements (Filtered by Partner Capabilities)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Vertical Market *</Label>
              {availableVerticals.length > 0 ? (
                <Select value={formData.vertical_id} onValueChange={(val) => updateField('vertical_id', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vertical" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVerticals.map(vertical => (
                      <SelectItem key={vertical.id} value={vertical.id}>{vertical.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-red-600 p-3 bg-red-50 rounded">Partner has no authorized verticals</p>
              )}
            </div>

            <div>
              <Label>Primary Solution *</Label>
              {availableSolutions.length > 0 ? (
                <Select value={formData.primary_solution} onValueChange={(val) => updateField('primary_solution', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary solution" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSolutions.map(solution => (
                      <SelectItem key={solution.id} value={solution.id}>{solution.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-red-600 p-3 bg-red-50 rounded">Partner has no authorized solutions</p>
              )}
            </div>

            {availableSolutions.length > 1 && (
              <div>
                <Label>Additional Solutions</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg">
                  {availableSolutions.map(solution => (
                    <label key={solution.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.additional_solutions.includes(solution.id)}
                        onChange={() => toggleArrayItem('additional_solutions', solution.id)}
                      />
                      <span className="text-sm">{solution.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {availableProducts.length > 0 && (
              <div>
                <Label>ASSA ABLOY Products</Label>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg max-h-60 overflow-y-auto">
                  {availableProducts.map(product => (
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
            )}
          </CardContent>
        </Card>

        {/* Service Coverage & Language */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Service Coverage & Language</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              System will intelligently match based on location and explicit requirements
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {locationInference?.region && (
              <Alert className="bg-blue-50 border-blue-200">
                <MapPin className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Location detected:</strong> {locationInference.notes}
                  {locationInference.primaryLanguage && (
                    <span className="block mt-1">
                      Recommended: <strong>{locationInference.primaryLanguage.toUpperCase()}</strong>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
            {availableCoverage.length > 0 && (
              <div>
                <Label>
                  Required Service Coverage
                  <span className="text-xs font-normal text-slate-500 ml-2">(Optional - will infer from location)</span>
                </Label>
                <p className="text-xs text-slate-500 mb-2">Only showing regions this partner can serve</p>
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg">
                  {availableCoverage.map(option => (
                    <label key={option.id} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.required_service_coverage?.includes(option.value)}
                        onChange={() => toggleArrayItem('required_service_coverage', option.value)}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Estimated Value (€)</Label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => updateField('estimated_value', e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateField('deadline', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                placeholder="Additional project details or requirements"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
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
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
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
            disabled={createMutation.isPending || hasNoCapabilities}
          >
            {createMutation.isPending ? 'Creating...' : 'Assign Project to Partner'}
          </Button>
        </div>
      </form>
    </div>
  );
}