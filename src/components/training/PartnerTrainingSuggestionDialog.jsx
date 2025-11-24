import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '../hooks/useCurrentUser';

export default function PartnerTrainingSuggestionDialog({ open, onClose, productCode }) {
  const queryClient = useQueryClient();
  const { partnerId } = useCurrentUser();
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState('');

  // Fetch relevant sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: async () => {
      const all = await base44.entities.TrainingSession.list('-session_date');
      return all.filter(s => 
        s.assa_abloy_product === productCode &&
        (s.status === 'scheduled' || s.status === 'registration_open') &&
        new Date(s.session_date) > new Date()
      );
    },
    enabled: !!productCode,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members', partnerId],
    queryFn: async () => {
      const all = await base44.entities.TeamMember.list();
      return all.filter(tm => tm.partner_id === partnerId && tm.active);
    },
    enabled: !!partnerId,
  });
  
  const registerMutation = useMutation({
    mutationFn: async () => {
        if (!selectedSessionId || !selectedTeamMemberId) return;

        await base44.entities.TrainingRegistration.create({
            training_session_id: selectedSessionId,
            partner_id: partnerId,
            team_member_id: selectedTeamMemberId,
            registration_date: new Date().toISOString(),
            status: 'registered',
            payment_status: 'pending',
        });
        
        // Add history log
        const session = sessions.find(s => s.id === selectedSessionId);
        if (session) {
            await base44.entities.TrainingSession.update(session.id, {
                history_log: [
                    ...(session.history_log || []),
                    {
                        timestamp: new Date().toISOString(),
                        action: 'registration_added',
                        partner_id: partnerId,
                        details: { team_member_id: selectedTeamMemberId, source: 'suggestion_dialog' }
                    }
                ]
            });
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['trainingRegistrations']);
        queryClient.invalidateQueries(['trainingSessions']);
        alert('Registration successful!');
        onClose();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Training Required: {productCode}</DialogTitle>
          <DialogDescription>
            Your organization needs to complete training for {productCode} to maintain authorization.
            Select a session below to register.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Sessions Selection */}
            <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">Available Sessions</h3>
                {sessions.length > 0 ? (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div 
                                key={session.id} 
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${selectedSessionId === session.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-slate-200'}`}
                                onClick={() => setSelectedSessionId(session.id)}
                            >
                                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${selectedSessionId === session.id ? 'border-blue-600' : 'border-slate-300'}`}>
                                    {selectedSessionId === session.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900">{session.title}</div>
                                    <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(session.session_date), 'MMM d, yyyy')}</span>
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {session.registered_count}/{session.max_participants}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Alert>
                        <AlertDescription>No upcoming training sessions found for {productCode}. Please check back later.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Team Member Selection */}
            {selectedSessionId && (
                <div>
                    <h3 className="text-sm font-medium text-slate-900 mb-2">Select Team Member to Register</h3>
                    <Select value={selectedTeamMemberId} onValueChange={setSelectedTeamMemberId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a team member" />
                        </SelectTrigger>
                        <SelectContent>
                            {teamMembers.map(tm => (
                                <SelectItem key={tm.id} value={tm.id}>
                                    {tm.first_name} {tm.last_name} - {tm.role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => registerMutation.mutate()} 
            disabled={!selectedSessionId || !selectedTeamMemberId || registerMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {registerMutation.isPending ? 'Registering...' : (
                <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Register
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}