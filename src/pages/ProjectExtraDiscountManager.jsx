import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

export default function ProjectExtraDiscountManager() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    min_partner_tier: 'all',
    project_source: 'all',
    min_estimated_value: '',
    max_estimated_value: '',
    extra_discount_percentage: '',
    priority: 0,
    active: true,
    cumulative: false,
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['projectExtraDiscountRules'],
    queryFn: () => base44.entities.ProjectExtraDiscountRule.list('-priority'),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectExtraDiscountRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectExtraDiscountRules']);
      resetForm();
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectExtraDiscountRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectExtraDiscountRules']);
      resetForm();
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectExtraDiscountRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectExtraDiscountRules']);
    },
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      description: '',
      min_partner_tier: 'all',
      project_source: 'all',
      min_estimated_value: '',
      max_estimated_value: '',
      extra_discount_percentage: '',
      priority: 0,
      active: true,
      cumulative: false,
    });
    setEditingRule(null);
    setShowForm(false);
  };

  const handleEdit = (rule) => {
    setFormData({
      rule_name: rule.rule_name,
      description: rule.description || '',
      min_partner_tier: rule.min_partner_tier || 'all',
      project_source: rule.project_source || 'all',
      min_estimated_value: rule.min_estimated_value || '',
      max_estimated_value: rule.max_estimated_value || '',
      extra_discount_percentage: rule.extra_discount_percentage,
      priority: rule.priority,
      active: rule.active,
      cumulative: rule.cumulative || false,
    });
    setEditingRule(rule.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      min_estimated_value: formData.min_estimated_value ? parseFloat(formData.min_estimated_value) : undefined,
      max_estimated_value: formData.max_estimated_value ? parseFloat(formData.max_estimated_value) : undefined,
      extra_discount_percentage: parseFloat(formData.extra_discount_percentage),
      priority: parseInt(formData.priority),
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule, data: payload });
    } else {
      createRuleMutation.mutate(payload);
    }
  };

  const tierColors = {
    platinum: 'bg-purple-100 text-purple-800',
    gold: 'bg-yellow-100 text-yellow-800',
    silver: 'bg-slate-100 text-slate-800',
    bronze: 'bg-orange-100 text-orange-800',
    entry: 'bg-gray-100 text-gray-800',
    all: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Project Extra Discount Rules
          </h1>
          <p className="text-slate-600 mt-2">
            Manage additional discount rules based on tier, project source, and value
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Rule
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-md border-t-4 border-t-blue-600">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingRule ? 'Edit Discount Rule' : 'Create New Discount Rule'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name *</Label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Platinum Tier Bonus"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Extra Discount % *</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={formData.extra_discount_percentage}
                    onChange={(e) => setFormData({ ...formData, extra_discount_percentage: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this rule applies..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Partner Tier</Label>
                  <Select
                    value={formData.min_partner_tier}
                    onValueChange={(val) => setFormData({ ...formData, min_partner_tier: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                </div>
                <div className="space-y-2">
                  <Label>Project Source</Label>
                  <Select
                    value={formData.project_source}
                    onValueChange={(val) => setFormData({ ...formData, project_source: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="partner_initiated">Partner Initiated</SelectItem>
                      <SelectItem value="tender">Tender</SelectItem>
                      <SelectItem value="direct_assignment">Direct Assignment</SelectItem>
                      <SelectItem value="quotation_tool">Quotation Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Estimated Value (EUR)</Label>
                  <Input
                    type="number"
                    value={formData.min_estimated_value}
                    onChange={(e) => setFormData({ ...formData, min_estimated_value: e.target.value })}
                    placeholder="e.g., 10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Estimated Value (EUR)</Label>
                  <Input
                    type="number"
                    value={formData.max_estimated_value}
                    onChange={(e) => setFormData({ ...formData, max_estimated_value: e.target.value })}
                    placeholder="e.g., 100000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.cumulative}
                    onCheckedChange={(checked) => setFormData({ ...formData, cumulative: checked })}
                  />
                  <Label>Cumulative (can combine with other discounts)</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRuleMutation.isLoading || updateRuleMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{rule.rule_name}</h3>
                    <Badge className="bg-green-100 text-green-800">
                      +{rule.extra_discount_percentage}%
                    </Badge>
                    {!rule.active && (
                      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                    )}
                    {rule.cumulative && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        Cumulative
                      </Badge>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this discount rule?')) {
                        deleteRuleMutation.mutate(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Tier:</span>
                  <Badge className={tierColors[rule.min_partner_tier] || tierColors.all}>
                    {rule.min_partner_tier === 'all' ? 'All Tiers' : rule.min_partner_tier}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Source:</span>
                  <Badge variant="outline">
                    {rule.project_source === 'all' ? 'All Sources' : rule.project_source.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {rule.min_estimated_value && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Min Value:</span>
                    <Badge variant="outline">€{(rule.min_estimated_value / 1000).toFixed(0)}K</Badge>
                  </div>
                )}
                {rule.max_estimated_value && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Max Value:</span>
                    <Badge variant="outline">€{(rule.max_estimated_value / 1000).toFixed(0)}K</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Priority:</span>
                  <Badge variant="outline">{rule.priority}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No discount rules yet</h3>
              <p className="text-slate-500">Create your first extra discount rule to get started</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}