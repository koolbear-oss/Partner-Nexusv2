import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function AddCertificationDialog({ open, onClose, partners, solutions }) {
  const { isAdmin, partnerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    partner_id: partnerId || '',
    solution_id: '',
    certification_name: '',
    certification_code: '',
    issue_date: '',
    expiry_date: '',
    certified_technician_name: '',
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Certification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['certifications']);
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
          <DialogTitle>Add Certification</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {partners.filter(p => isAdmin || p.id === partnerId).map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>{partner.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Solution (Optional)</Label>
                <Select value={formData.solution_id} onValueChange={(value) => setFormData({ ...formData, solution_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select solution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {solutions.map(solution => (
                      <SelectItem key={solution.id} value={solution.id}>{solution.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Certification Name *</Label>
                <Input
                  value={formData.certification_name}
                  onChange={(e) => setFormData({ ...formData, certification_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Certification Code</Label>
                <Input
                  value={formData.certification_code}
                  onChange={(e) => setFormData({ ...formData, certification_code: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Certified Technician Name</Label>
              <Input
                value={formData.certified_technician_name}
                onChange={(e) => setFormData({ ...formData, certified_technician_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="bg-blue-900 hover:bg-blue-800">
              {createMutation.isPending ? 'Adding...' : 'Add Certification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}