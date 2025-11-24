import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateTrainingDialog({ open, onClose, assaAbloyProducts }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    assa_abloy_product: '',
    verticals: [],
    event_type: 'product_training',
    is_mandatory: false,
    influences_bonus: true,
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

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingSession.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      queryClient.invalidateQueries(['trainingSessions']);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const toggleVertical = (verticalId) => {
    setFormData(prev => ({
      ...prev,
      verticals: prev.verticals.includes(verticalId)
        ? prev.verticals.filter(id => id !== verticalId)
        : [...prev.verticals, verticalId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Training or Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type */}
          <div>
            <Label>Event Type *</Label>
            <Select 
              value={formData.event_type} 
              onValueChange={(val) => setFormData({...formData, event_type: val})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product_training">Product Training</SelectItem>
                <SelectItem value="vertical_training">Vertical Training</SelectItem>
                <SelectItem value="networking_event">Networking Event</SelectItem>
                <SelectItem value="certification_exam">Certification Exam</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mandatory & Bonus Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-start gap-3">
              <Checkbox
                id="is_mandatory"
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData({...formData, is_mandatory: checked})}
              />
              <div>
                <label htmlFor="is_mandatory" className="text-sm font-medium cursor-pointer">
                  Mandatory Training
                </label>
                <p className="text-xs text-slate-600 mt-1">
                  Required for maintaining product authorization/certification
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="influences_bonus"
                checked={formData.influences_bonus}
                onCheckedChange={(checked) => setFormData({...formData, influences_bonus: checked})}
              />
              <div>
                <label htmlFor="influences_bonus" className="text-sm font-medium cursor-pointer">
                  Influences Bonus
                </label>
                <p className="text-xs text-slate-600 mt-1">
                  Attendance affects partner bonus calculations
                </p>
              </div>
            </div>
          </div>

          {formData.is_mandatory && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <strong>Mandatory Training:</strong> Partners will see this as required for maintaining certification.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Event Title *</Label>
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
                placeholder="Event objectives and agenda..."
                rows={3}
              />
            </div>

            {/* Product Selection - Optional */}
            {(formData.event_type === 'product_training' || formData.event_type === 'certification_exam') && (
              <div className="col-span-2">
                <Label>ASSA ABLOY Product {formData.event_type === 'product_training' ? '*' : '(optional)'}</Label>
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
            )}

            {/* Verticals Selection */}
            <div className="col-span-2">
              <Label>Target Verticals (optional)</Label>
              <p className="text-xs text-slate-500 mb-2">
                Select relevant industries for this {formData.event_type === 'networking_event' ? 'event' : 'training'}
              </p>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white max-h-48 overflow-y-auto">
                {verticals.filter(v => v.active).map(vertical => (
                  <label
                    key={vertical.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
                      formData.verticals.includes(vertical.id)
                        ? 'bg-blue-100 border-blue-300 text-blue-900'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Checkbox
                      checked={formData.verticals.includes(vertical.id)}
                      onCheckedChange={() => toggleVertical(vertical.id)}
                    />
                    <span className="text-sm font-medium">{vertical.name}</span>
                  </label>
                ))}
              </div>
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

            {(formData.location.type === 'onsite' || formData.location.type === 'hybrid') && (
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
              <Label>Cost per Participant (€)</Label>
              <Input
                type="number"
                value={formData.cost_per_participant}
                onChange={(e) => setFormData({...formData, cost_per_participant: parseFloat(e.target.value) || 0})}
                min="0"
                step="0.01"
              />
            </div>

            {formData.issues_certification && (
              <div className="col-span-2">
                <Label>Certification Valid For (months)</Label>
                <Input
                  type="number"
                  value={formData.certification_valid_for_months}
                  onChange={(e) => setFormData({...formData, certification_valid_for_months: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            )}
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