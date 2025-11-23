import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateTrainingDialog({ open, onClose, assaAbloyProducts }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    assa_abloy_product: '',
    training_type: 'annual_certification',
    title: '',
    description: '',
    session_date: '',
    session_end_date: '',
    duration_days: 1,
    location: {
      type: 'online',
      address: '',
      online_link: ''
    },
    trainer: '',
    max_participants: 20,
    issues_certification: true,
    certification_valid_for_months: 12,
    status: 'registration_open',
    language: 'nl',
    cost_per_participant: 0
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Training Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>ASSA ABLOY Product *</Label>
              <Select 
                value={formData.assa_abloy_product} 
                onValueChange={(val) => setFormData({...formData, assa_abloy_product: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {assaAbloyProducts.map(product => (
                    <SelectItem key={product.value} value={product.value}>
                      {product.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Training Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., SMARTair Annual Certification 2025"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Training objectives and agenda..."
                rows={3}
              />
            </div>

            <div>
              <Label>Training Type</Label>
              <Select 
                value={formData.training_type} 
                onValueChange={(val) => setFormData({...formData, training_type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual_certification">Annual Certification</SelectItem>
                  <SelectItem value="initial_certification">Initial Certification</SelectItem>
                  <SelectItem value="recertification">Recertification</SelectItem>
                  <SelectItem value="advanced_training">Advanced Training</SelectItem>
                  <SelectItem value="product_introduction">Product Introduction</SelectItem>
                  <SelectItem value="technical_deep_dive">Technical Deep Dive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Language</Label>
              <Select 
                value={formData.language} 
                onValueChange={(val) => setFormData({...formData, language: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Session Date *</Label>
              <Input
                type="date"
                value={formData.session_date}
                onChange={(e) => setFormData({...formData, session_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            <div>
              <Label>Location Type</Label>
              <Select 
                value={formData.location.type} 
                onValueChange={(val) => setFormData({...formData, location: {...formData.location, type: val}})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                min="1"
              />
            </div>

            {formData.location.type === 'online' && (
              <div className="col-span-2">
                <Label>Online Meeting Link</Label>
                <Input
                  value={formData.location.online_link}
                  onChange={(e) => setFormData({...formData, location: {...formData.location, online_link: e.target.value}})}
                  placeholder="https://teams.microsoft.com/..."
                />
              </div>
            )}

            {formData.location.type === 'onsite' && (
              <div className="col-span-2">
                <Label>Location Address</Label>
                <Input
                  value={formData.location.address}
                  onChange={(e) => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
                  placeholder="Rue de la Loi 155, Brussels"
                />
              </div>
            )}

            <div>
              <Label>Trainer</Label>
              <Input
                value={formData.trainer}
                onChange={(e) => setFormData({...formData, trainer: e.target.value})}
                placeholder="Trainer name"
              />
            </div>

            <div>
              <Label>Certification Valid For (months)</Label>
              <Input
                type="number"
                value={formData.certification_valid_for_months}
                onChange={(e) => setFormData({...formData, certification_valid_for_months: parseInt(e.target.value)})}
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Training Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}