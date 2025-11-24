import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function EditTender() {
  const urlParams = new URLSearchParams(window.location.search);
  const tenderId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: tender, isLoading } = useQuery({
    queryKey: ['tender', tenderId],
    queryFn: async () => {
      const tenders = await base44.entities.Tender.list();
      return tenders.find(t => t.id === tenderId);
    },
    enabled: !!tenderId,
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
    queryKey: ['dropdownValues', 'assa_abloy_products'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'assa_abloy_products' && d.active);
    },
  });

  const [formData, setFormData] = useState(null);

  React.useEffect(() => {
    if (tender && !formData) {
      setFormData(tender);
    }
  }, [tender]);

  const updateTenderMutation = useMutation({
    mutationFn: (data) => base44.entities.Tender.update(tenderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tender', tenderId]);
      queryClient.invalidateQueries(['tenders']);
      navigate(createPageUrl(`TenderDetail?id=${tenderId}`));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTenderMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  if (isLoading || !formData) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const hasValidationError = formData.estimated_gross_value && formData.budget_max && 
    formData.estimated_gross_value > formData.budget_max;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to={createPageUrl(`TenderDetail?id=${tenderId}`)}>
        <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tender</span>
        </button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Tender</h1>
        <p className="text-slate-600 mt-2">Update tender details and specifications</p>
      </div>

      {hasValidationError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Validation Error:</strong> ASSA ABLOY Gross Value (€{(formData.estimated_gross_value / 1000).toFixed(0)}K) 
            cannot exceed Total Project Budget Maximum (€{(formData.budget_max / 1000).toFixed(0)}K)
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tender Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tender_code">Tender Code</Label>
              <Input
                id="tender_code"
                value={formData.tender_code || ''}
                onChange={(e) => updateField('tender_code', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget_min">End User Total Budget Min (EUR)</Label>
                <Input
                  id="budget_min"
                  type="number"
                  value={formData.budget_min || ''}
                  onChange={(e) => updateField('budget_min', parseFloat(e.target.value))}
                  placeholder="1500000"
                />
                <p className="text-xs text-slate-500">Minimum total project budget from end customer</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget_max">End User Total Budget Max (EUR)</Label>
                <Input
                  id="budget_max"
                  type="number"
                  value={formData.budget_max || ''}
                  onChange={(e) => updateField('budget_max', parseFloat(e.target.value))}
                  placeholder="2000000"
                />
                <p className="text-xs text-slate-500">Maximum total project budget from end customer</p>
              </div>
            </div>
            {formData.budget_min && formData.budget_max && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-sm text-slate-700">
                  <strong>Budget Range:</strong> €{(formData.budget_min / 1000).toFixed(0)}K - €{(formData.budget_max / 1000).toFixed(0)}K
                  <span className="ml-3 text-slate-500">
                    (±{(((formData.budget_max - formData.budget_min) / ((formData.budget_min + formData.budget_max) / 2)) * 100).toFixed(1)}% variance)
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="estimated_gross_value">ASSA ABLOY Estimated Gross Value (EUR)</Label>
              <Input
                id="estimated_gross_value"
                type="number"
                value={formData.estimated_gross_value || ''}
                onChange={(e) => updateField('estimated_gross_value', parseFloat(e.target.value))}
                placeholder="500000"
              />
              <p className="text-xs text-slate-500">
                Estimated ASSA ABLOY list price (before partner discounts). Partners will see a range based on budget variance.
              </p>
              {formData.estimated_gross_value && formData.budget_min && formData.budget_max && (
                <div className="text-xs text-blue-700 mt-2">
                  Partners will see: €{((formData.estimated_gross_value * (1 - ((formData.budget_max - formData.budget_min) / ((formData.budget_min + formData.budget_max) / 2)) / 2)) / 1000).toFixed(0)}K - 
                  €{((formData.estimated_gross_value * (1 + ((formData.budget_max - formData.budget_min) / ((formData.budget_min + formData.budget_max) / 2)) / 2)) / 1000).toFixed(0)}K
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Technical Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Vertical Market *</Label>
              <Select value={formData.vertical_id} onValueChange={(val) => updateField('vertical_id', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {verticals.filter(v => v.active).map(vertical => (
                    <SelectItem key={vertical.id} value={vertical.id}>
                      {vertical.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Required Solutions *</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {solutions.filter(s => s.active).map(solution => (
                  <div key={solution.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`solution-${solution.id}`}
                      checked={formData.required_solutions?.includes(solution.id)}
                      onCheckedChange={() => toggleArrayItem('required_solutions', solution.id)}
                    />
                    <label htmlFor={`solution-${solution.id}`} className="text-sm cursor-pointer">
                      {solution.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>ASSA ABLOY Products</Label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-60 overflow-y-auto">
                {assaAbloyProducts.map(product => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={formData.assa_abloy_products?.includes(product.value)}
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

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Timeline & Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="response_deadline">Response Deadline *</Label>
                <Input
                  id="response_deadline"
                  type="datetime-local"
                  value={formData.response_deadline?.slice(0, 16)}
                  onChange={(e) => updateField('response_deadline', new Date(e.target.value).toISOString())}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_start_date">Expected Project Start</Label>
                <Input
                  id="project_start_date"
                  type="date"
                  value={formData.project_start_date}
                  onChange={(e) => updateField('project_start_date', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Project Location (City)</Label>
              <Input
                id="city"
                value={formData.project_location?.city || ''}
                onChange={(e) => updateField('project_location', { ...formData.project_location, city: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl(`TenderDetail?id=${tenderId}`))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={updateTenderMutation.isPending || hasValidationError}
          >
            <Save className="w-4 h-4 mr-2" />
            {updateTenderMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}