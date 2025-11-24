import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function TrainingRequirementsSettings() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);

  const { data: requirements = [] } = useQuery({
    queryKey: ['training-requirements'],
    queryFn: () => base44.entities.TrainingRequirement.list(),
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assa-abloy-products'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'assa_abloy_products' && d.active);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingRequirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-requirements']);
      setShowAddDialog(false);
      setEditingRequirement(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrainingRequirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-requirements']);
      setShowAddDialog(false);
      setEditingRequirement(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingRequirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-requirements']);
    },
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Training Requirements Configuration
        </CardTitle>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Requirement
        </Button>
      </CardHeader>
      <CardContent>
        {requirements.length > 0 ? (
          <div className="space-y-3">
            {requirements.map(req => {
              const product = assaAbloyProducts.find(p => p.value === req.assa_abloy_product);
              return (
                <div key={req.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-slate-900 mb-1">
                        {product?.label || req.assa_abloy_product}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {req.partner_type === 'all' ? 'All Partners' : req.partner_type}
                        </Badge>
                        <Badge variant="outline">{req.training_type.replace(/_/g, ' ')}</Badge>
                        {req.is_mandatory && (
                          <Badge className="bg-red-100 text-red-800">Mandatory</Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-600">
                        Required every {req.frequency_days} days • Reminder {req.reminder_days_before} days before
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingRequirement(req);
                          setShowAddDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Delete this requirement?')) {
                            deleteMutation.mutate(req.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {req.description && (
                    <div className="text-sm text-slate-600 mt-2">{req.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            No training requirements configured yet
          </div>
        )}
      </CardContent>

      <RequirementDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setEditingRequirement(null);
        }}
        requirement={editingRequirement}
        products={assaAbloyProducts}
        onSubmit={(data) => {
          if (editingRequirement) {
            updateMutation.mutate({ id: editingRequirement.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </Card>
  );
}

function RequirementDialog({ open, onClose, requirement, products, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState(requirement || {
    assa_abloy_product: '',
    partner_type: 'all',
    training_type: 'annual_certification',
    frequency_days: 365,
    is_mandatory: true,
    grace_period_days: 30,
    reminder_days_before: 60,
    affects_bonus: true,
    affects_tier: true,
    description: '',
    active: true,
  });

  React.useEffect(() => {
    if (requirement) setFormData(requirement);
  }, [requirement]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{requirement ? 'Edit' : 'Add'} Training Requirement</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product *</Label>
              <Select value={formData.assa_abloy_product} onValueChange={(val) => setFormData({ ...formData, assa_abloy_product: val })}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Partner Type</Label>
              <Select value={formData.partner_type} onValueChange={(val) => setFormData({ ...formData, partner_type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners</SelectItem>
                  <SelectItem value="installer">Installer</SelectItem>
                  <SelectItem value="integrator">Integrator</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Training Type</Label>
              <Select value={formData.training_type} onValueChange={(val) => setFormData({ ...formData, training_type: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual_certification">Annual Certification</SelectItem>
                  <SelectItem value="initial_certification">Initial Certification</SelectItem>
                  <SelectItem value="recertification">Recertification</SelectItem>
                  <SelectItem value="advanced_training">Advanced Training</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frequency (days) *</Label>
              <Input
                type="number"
                value={formData.frequency_days}
                onChange={(e) => setFormData({ ...formData, frequency_days: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Reminder Days Before</Label>
              <Input
                type="number"
                value={formData.reminder_days_before}
                onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Grace Period (days)</Label>
              <Input
                type="number"
                value={formData.grace_period_days}
                onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
              />
              <span className="text-sm font-medium">Mandatory for product authorization</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.affects_bonus}
                onCheckedChange={(checked) => setFormData({ ...formData, affects_bonus: checked })}
              />
              <span className="text-sm font-medium">Affects bonus eligibility</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.affects_tier}
                onCheckedChange={(checked) => setFormData({ ...formData, affects_tier: checked })}
              />
              <span className="text-sm font-medium">Affects tier calculation</span>
            </label>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details about this requirement"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : requirement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}