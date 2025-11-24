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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditTrainingDialog({ open, onClose, session, assaAbloyProducts }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ...session,
    location: session.location || { type: 'online', address: '', online_link: '' }
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations'],
    queryFn: () => base44.entities.TrainingRegistration.list(),
  });

  const sessionRegistrations = registrations.filter(r => r.training_session_id === session.id);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const changes = {};
      Object.keys(data).forEach(key => {
        if (JSON.stringify(data[key]) !== JSON.stringify(session[key])) {
          changes[key] = { from: session[key], to: data[key] };
        }
      });

      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: 'updated',
        user: user?.email,
        details: { changes }
      };

      const updatedSession = await base44.entities.TrainingSession.update(session.id, {
        ...data,
        history_log: [...(session.history_log || []), historyEntry]
      });

      // Notify registered partners
      if (Object.keys(changes).length > 0) {
        for (const reg of sessionRegistrations) {
          await base44.entities.Notification.create({
            user_email: reg.registered_by || reg.partner_id,
            partner_id: reg.partner_id,
            type: 'training_updated',
            title: 'Training Updated',
            message: `The training "${session.title}" has been updated. Please review the changes.`,
            link: `/PartnerTraining`,
            related_entity_type: 'TrainingSession',
            related_entity_id: session.id
          });
        }
      }

      return updatedSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      queryClient.invalidateQueries(['trainingSessions']);
      onClose();
    },
  });

  const toggleVertical = (verticalId) => {
    setFormData(prev => ({
      ...prev,
      verticals: (prev.verticals || []).includes(verticalId)
        ? prev.verticals.filter(id => id !== verticalId)
        : [...(prev.verticals || []), verticalId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Training Session</DialogTitle>
        </DialogHeader>

        {sessionRegistrations.length > 0 && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>{sessionRegistrations.length} partner(s) registered.</strong> They will be notified of any changes.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(formData); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Event Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
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
                value={formData.location?.type} 
                onValueChange={(val) => setFormData({...formData, location: {...formData.location, type: val}})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
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

            {formData.location?.type === 'online' && (
              <div className="col-span-2">
                <Label>Online Meeting Link</Label>
                <Input
                  value={formData.location?.online_link || ''}
                  onChange={(e) => setFormData({...formData, location: {...formData.location, online_link: e.target.value}})}
                />
              </div>
            )}

            {(formData.location?.type === 'onsite' || formData.location?.type === 'hybrid') && (
              <div className="col-span-2">
                <Label>Location Address</Label>
                <Input
                  value={formData.location?.address || ''}
                  onChange={(e) => setFormData({...formData, location: {...formData.location, address: e.target.value}})}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}