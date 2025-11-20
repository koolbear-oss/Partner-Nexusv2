import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AddPricingRuleDialog({ open, onClose, solutions, verticals }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    rule_name: '',
    solution_id: '',
    vertical_id: '',
    partner_tier: 'all',
    base_discount: '',
    volume_threshold: '',
    volume_discount: '',
    effective_date: '',
    expiry_date: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PricingRule.create({
      ...data,
      base_discount: parseFloat(data.base_discount),
      volume_threshold: data.volume_threshold ? parseFloat(data.volume_threshold) : 0,
      volume_discount: data.volume_discount ? parseFloat(data.volume_discount) : 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pricing-rules']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Pricing Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name *</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Solution</Label>
                <Select value={formData.solution_id} onValueChange={(value) => setFormData({ ...formData, solution_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Solutions</SelectItem>
                    {solutions.map(solution => (
                      <SelectItem key={solution.id} value={solution.id}>{solution.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vertical</Label>
                <Select value={formData.vertical_id} onValueChange={(value) => setFormData({ ...formData, vertical_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Verticals</SelectItem>
                    {verticals.map(vertical => (
                      <SelectItem key={vertical.id} value={vertical.id}>{vertical.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Partner Tier *</Label>
                <Select value={formData.partner_tier} onValueChange={(value) => setFormData({ ...formData, partner_tier: value })}>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Base Discount (%) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.base_discount}
                  onChange={(e) => setFormData({ ...formData, base_discount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Volume Threshold (€)</Label>
                <Input
                  type="number"
                  value={formData.volume_threshold}
                  onChange={(e) => setFormData({ ...formData, volume_threshold: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Volume Discount (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.volume_discount}
                  onChange={(e) => setFormData({ ...formData, volume_discount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
              {createMutation.isPending ? 'Creating...' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}