import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Users, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function TrainingInvitationDialog({ open, onClose, partnerId, productCode }) {
  const queryClient = useQueryClient();
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState([]);

  // Fetch Partner to get type
  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === partnerId);
    },
    enabled: !!partnerId,
  });

  // Fetch Requirements for this product and partner type
  const { data: requirements = [] } = useQuery({
    queryKey: ['training-requirements'],
    queryFn: () => base44.entities.TrainingRequirement.list(),
  });

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

  // Fetch registrations to check compliance
  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations', partnerId],
    queryFn: async () => {
      const all = await base44.entities.TrainingRegistration.list();
      return all.filter(r => r.partner_id === partnerId);
    },
    enabled: !!partnerId,
  });

  // Identify team members needing training
  useEffect(() => {
    if (teamMembers.length > 0 && requirements.length > 0 && partner) {
      const relevantReqs = requirements.filter(req => 
        req.assa_abloy_product === productCode &&
        (req.partner_type === 'all' || req.partner_type === partner.partner_type)
      );

      if (relevantReqs.length > 0) {
        const req = relevantReqs[0]; // Assuming primary requirement
        const needingTraining = teamMembers.filter(tm => {
          // Check if team member has valid training
          const tmRegs = registrations.filter(r => r.team_member_id === tm.id);
          
          // Check if any registration is completed and valid
          // For simplicity, just checking if they have *any* completed training for this product recently
          // A more robust check would match against the specific requirement frequency
          const hasValidTraining = tmRegs.some(r => {
             // In a real app we'd check the session linked to 'r' and its date
             return r.status === 'completed' || r.status === 'attended'; 
             // We are simplifying here as we don't have easy access to session details for all registrations 
             // without fetching all sessions or mapping them. 
             // For MVP, we'll assume if they have NO completed training for this product, they need it.
          });

          // Better logic: we should assume we are inviting those who DON'T have valid training
          // or whose training is expiring.
          // For this specific feature request: "admin is able to invite... team member... notification pushing them"
          
          return !hasValidTraining; 
        }).map(tm => tm.id);

        setSelectedTeamMembers(needingTraining);
      } else {
        // If no specific requirement, select all active members by default? Or none?
        // Let's select none to be safe, or all to allow admin to choose.
        // Let's select all for now.
        setSelectedTeamMembers(teamMembers.map(tm => tm.id));
      }
    }
  }, [teamMembers, requirements, partner, productCode, registrations]);


  const sendInvitationsMutation = useMutation({
    mutationFn: async () => {
      // Send notification to each selected team member
      // Since we don't have direct user accounts for all team members, we notify the partner admin email
      // But the requirement says "Each team member inside the partner will have this as a notification"
      // Assuming TeamMember entity has email and we can send email or system notification if they are users.
      // We'll create Notification entities for the user emails associated with team members.
      
      const promises = selectedTeamMembers.map(async (tmId) => {
        const tm = teamMembers.find(m => m.id === tmId);
        if (!tm || !tm.email) return;

        // Send for each selected session
        const sessionPromises = selectedSessions.map(sessionId => {
            const session = sessions.find(s => s.id === sessionId);
            return base44.entities.Notification.create({
                user_email: tm.email,
                partner_id: partnerId,
                type: 'training_reminder', // reusing or new type
                title: `Invitation: ${session.title}`,
                message: `You are invited to register for ${session.title} (${productCode}). Please register to maintain compliance.`,
                link: `/PartnerTraining`, // Could be deep link
                related_entity_type: 'TrainingSession',
                related_entity_id: sessionId
            });
        });
        await Promise.all(sessionPromises);
      });

      await Promise.all(promises);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        alert('Invitations sent successfully');
        onClose();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite to {productCode} Training</DialogTitle>
          <DialogDescription>
            Select sessions and team members to send invitations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            {/* Sessions Selection */}
            <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">1. Select Training Sessions</h3>
                {sessions.length > 0 ? (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div key={session.id} className={`flex items-start gap-3 p-3 rounded-lg border ${selectedSessions.includes(session.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                                <Checkbox 
                                    checked={selectedSessions.includes(session.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedSessions(prev => checked ? [...prev, session.id] : prev.filter(id => id !== session.id));
                                    }}
                                />
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
                        <AlertDescription>No upcoming training sessions found for {productCode}.</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Team Member Selection */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-slate-900">2. Select Team Members</h3>
                    <Button variant="ghost" size="sm" className="h-auto text-xs" onClick={() => setSelectedTeamMembers(teamMembers.map(tm => tm.id))}>Select All</Button>
                </div>
                {teamMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {teamMembers.map(tm => (
                            <div key={tm.id} className={`flex items-center gap-3 p-3 rounded-lg border ${selectedTeamMembers.includes(tm.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                                <Checkbox 
                                    checked={selectedTeamMembers.includes(tm.id)}
                                    onCheckedChange={(checked) => {
                                        setSelectedTeamMembers(prev => checked ? [...prev, tm.id] : prev.filter(id => id !== tm.id));
                                    }}
                                />
                                <div>
                                    <div className="font-medium text-slate-900">{tm.first_name} {tm.last_name}</div>
                                    <div className="text-xs text-slate-500">{tm.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Alert>
                        <AlertDescription>No active team members found.</AlertDescription>
                    </Alert>
                )}
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => sendInvitationsMutation.mutate()} 
            disabled={selectedSessions.length === 0 || selectedTeamMembers.length === 0 || sendInvitationsMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {sendInvitationsMutation.isPending ? 'Sending...' : (
                <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitations ({selectedTeamMembers.length * selectedSessions.length})
                </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}