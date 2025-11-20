import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function AddCompetencyDialog({ open, onClose, partners, solutions, verticals }) {
  const { isAdmin, partnerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    partner_id: partnerId || '',
    solution_id: '',
    vertical_id: '',
    phase: '',
    level: 'basic',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Competency.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['competencies']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Competency</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Partner *</Label>
              <Select 
                value={formData.partner_id} 
                onValueChange={(value) => setFormData({ ...formData, partner_id: value })}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.filter(p => (isAdmin || p.id === partnerId) && p.status === 'active').map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>{partner.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Solution *</Label>
              <Select value={formData.solution_id} onValueChange={(value) => setFormData({ ...formData, solution_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select solution" />
                </SelectTrigger>
                <SelectContent>
                  {solutions.map(solution => (
                    <SelectItem key={solution.id} value={solution.id}>{solution.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vertical (Optional)</Label>
              <Select value={formData.vertical_id} onValueChange={(value) => setFormData({ ...formData, vertical_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {verticals.map(vertical => (
                    <SelectItem key={vertical.id} value={vertical.id}>{vertical.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phase *</Label>
              <Select value={formData.phase} onValueChange={(value) => setFormData({ ...formData, phase: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="commissioning">Commissioning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Level *</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
              {createMutation.isPending ? 'Adding...' : 'Add Competency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}