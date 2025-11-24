import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar, MapPin, Users, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PartnerTraining() {
  const { partnerId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVerticals, setSelectedVerticals] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');

  const { data: trainingSessions = [], isLoading } = useQuery({
    queryKey: ['trainingSessions'],
    queryFn: () => base44.entities.TrainingSession.list('-session_date'),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', partnerId],
    queryFn: async () => {
      const members = await base44.entities.TeamMember.list();
      return members.filter(m => m.partner_id === partnerId && m.active);
    },
    enabled: !!partnerId,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['trainingRegistrations', partnerId],
    queryFn: async () => {
      const allRegs = await base44.entities.TrainingRegistration.list();
      return allRegs.filter(r => r.partner_id === partnerId);
    },
    enabled: !!partnerId,
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assaAbloyProducts'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'assa_abloy_products' && v.active);
    },
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      const registration = await base44.entities.TrainingRegistration.create(data);
      
      // Add to training session history
      const session = trainingSessions.find(s => s.id === data.training_session_id);
      if (session) {
        await base44.entities.TrainingSession.update(session.id, {
          history_log: [
            ...(session.history_log || []),
            {
              timestamp: new Date().toISOString(),
              action: 'registration_added',
              user: user?.email,
              partner_id: partnerId,
              details: { team_member_id: data.team_member_id }
            }
          ]
        });
      }
      
      return registration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingRegistrations', partnerId]);
      queryClient.invalidateQueries(['trainingSessions']);
      setSelectedSession(null);
      setSelectedTeamMember('');
    },
  });

  const retractMutation = useMutation({
    mutationFn: async (registration) => {
      await base44.entities.TrainingRegistration.update(registration.id, {
        status: 'cancelled',
        cancellation_reason: 'Partner retracted attendance'
      });

      // Add to training session history
      const session = trainingSessions.find(s => s.id === registration.training_session_id);
      if (session) {
        await base44.entities.TrainingSession.update(session.id, {
          history_log: [
            ...(session.history_log || []),
            {
              timestamp: new Date().toISOString(),
              action: 'registration_retracted',
              user: user?.email,
              partner_id: partnerId,
              details: { registration_id: registration.id }
            }
          ]
        });
      }

      // Notify admin
      await base44.entities.Notification.create({
        user_email: 'admin@assaabloy.com', // Should be dynamic
        type: 'attendance_retracted',
        title: 'Training Attendance Retracted',
        message: `${partnerId} retracted attendance from "${session?.title}"`,
        link: `/TrainingManager`,
        related_entity_type: 'TrainingSession',
        related_entity_id: registration.training_session_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['trainingRegistrations', partnerId]);
      queryClient.invalidateQueries(['trainingSessions']);
    },
  });

  const availableSessions = trainingSessions.filter(session => {
    const isUpcoming = new Date(session.session_date) > new Date();
    const isOpen = session.status === 'registration_open';
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.assa_abloy_product?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const productMatch = selectedProducts.length === 0 ||
      (session.assa_abloy_product && selectedProducts.includes(session.assa_abloy_product));
    
    const verticalMatch = selectedVerticals.length === 0 ||
      (session.verticals?.some(v => selectedVerticals.includes(v)));
    
    return isUpcoming && isOpen && matchesSearch && productMatch && verticalMatch;
  });

  const toggleProduct = (product) => {
    setSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const toggleVertical = (vertical) => {
    setSelectedVerticals(prev =>
      prev.includes(vertical) ? prev.filter(v => v !== vertical) : [...prev, vertical]
    );
  };

  const getVerticalName = (id) => {
    return verticals.find(v => v.id === id)?.name || 'Unknown';
  };

  const myRegistrations = registrations.filter(r => 
    ['registered', 'confirmed', 'attended'].includes(r.status)
  );

  const getRegistrationForSession = (sessionId) => {
    return registrations.filter(r => r.training_session_id === sessionId);
  };

  const isSessionFull = (session) => {
    return session.registered_count >= session.max_participants;
  };

  const handleRegister = () => {
    if (!selectedTeamMember || !selectedSession) return;

    registerMutation.mutate({
      training_session_id: selectedSession.id,
      partner_id: partnerId,
      team_member_id: selectedTeamMember,
      registration_date: new Date().toISOString(),
      status: 'registered',
      payment_status: 'pending',
    });
  };

  const statusColors = {
    registered: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    attended: 'bg-purple-100 text-purple-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Training Programs</h1>
        <p className="text-slate-600 mt-2">
          Register your team for ASSA ABLOY product training and certification programs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Available Sessions</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{availableSessions.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Your Registrations</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{myRegistrations.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Team Members</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{teamMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search training sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Products</div>
            <div className="flex items-center gap-2 flex-wrap">
              {assaAbloyProducts.map(product => (
                <Button
                  key={product.value}
                  variant={selectedProducts.includes(product.value) ? 'default' : 'outline'}
                  onClick={() => toggleProduct(product.value)}
                  size="sm"
                  className={selectedProducts.includes(product.value) ? 'bg-blue-600' : ''}
                >
                  {product.label}
                  {selectedProducts.includes(product.value) && ' ✓'}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-700 mb-2">Verticals</div>
            <div className="flex items-center gap-2 flex-wrap">
              {verticals.filter(v => v.active).map(vertical => (
                <Button
                  key={vertical.id}
                  variant={selectedVerticals.includes(vertical.id) ? 'default' : 'outline'}
                  onClick={() => toggleVertical(vertical.id)}
                  size="sm"
                  className={selectedVerticals.includes(vertical.id) ? 'bg-purple-600' : ''}
                >
                  {vertical.name}
                  {selectedVerticals.includes(vertical.id) && ' ✓'}
                </Button>
              ))}
            </div>
          </div>

          {(selectedProducts.length > 0 || selectedVerticals.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProducts([]);
                setSelectedVerticals([]);
              }}
              className="text-slate-600"
            >
              Clear All Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Training Sessions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Available Training Sessions</h2>
        <div className="space-y-4">
          {availableSessions.map(session => {
            const sessionRegs = getRegistrationForSession(session.id);
            const isFull = isSessionFull(session);
            const seatsLeft = session.max_participants - session.registered_count;

            return (
              <Card key={session.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{session.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-slate-100 text-slate-800 border-slate-200 border">
                              {session.event_type?.replace(/_/g, ' ') || 'Training'}
                            </Badge>
                            {session.assa_abloy_product && (
                              <Badge className="bg-blue-600 text-white">
                                {session.assa_abloy_product}
                              </Badge>
                            )}
                            {session.verticals?.map(verticalId => (
                              <Badge key={verticalId} className="bg-purple-100 text-purple-800 border-purple-200 border">
                                {getVerticalName(verticalId)}
                              </Badge>
                            ))}
                            {session.is_mandatory && (
                              <Badge className="bg-red-600 text-white font-bold animate-pulse">
                                MANDATORY
                              </Badge>
                            )}
                            {!session.is_mandatory && session.influences_bonus && (
                              <Badge className="bg-green-100 text-green-800 border-green-300 border font-semibold">
                                Optional - Influences Bonus
                              </Badge>
                            )}
                            {isFull && (
                              <Badge className="bg-red-100 text-red-800">FULL</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {session.description && (
                        <p className="text-sm text-slate-600 mb-4">{session.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(session.session_date), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                        {session.session_end_date && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration_days} day(s)</span>
                          </div>
                        )}
                        {session.location?.type && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>
                              <span className="capitalize">{session.location.type}</span>
                              {session.location.address && ` - ${session.location.address}`}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4" />
                          <span>{session.registered_count} / {session.max_participants} registered</span>
                        </div>
                      </div>

                      {sessionRegs.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {sessionRegs.filter(r => r.status !== 'cancelled').map(reg => (
                            <div key={reg.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800 font-medium">
                                ✓ Team member registered
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (confirm('Are you sure you want to retract this registration? The admin will be notified.')) {
                                    retractMutation.mutate(reg);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                Retract
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="lg:min-w-[200px] space-y-3">
                      {session.cost_per_participant > 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg text-center">
                          <div className="text-2xl font-bold text-slate-900">
                            €{session.cost_per_participant}
                          </div>
                          <div className="text-xs text-slate-600">per participant</div>
                        </div>
                      )}
                      {seatsLeft <= 5 && seatsLeft > 0 && (
                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertDescription className="text-amber-900 text-xs">
                            Only {seatsLeft} seat(s) left!
                          </AlertDescription>
                        </Alert>
                      )}
                      <Button
                        onClick={() => setSelectedSession(session)}
                        disabled={isFull}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Register Team Member
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availableSessions.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No training sessions available</h3>
              <p className="text-slate-500">Check back later for upcoming training opportunities</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Registration Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Register Team Member</DialogTitle>
            <DialogDescription>
              Select a team member to register for this training session
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 mb-2">{selectedSession.title}</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Product:</strong> {selectedSession.assa_abloy_product}</p>
                  <p><strong>Date:</strong> {format(new Date(selectedSession.session_date), 'MMM d, yyyy HH:mm')}</p>
                  {selectedSession.location?.type && (
                    <p><strong>Location:</strong> {selectedSession.location.type}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Team Member *
                </label>
                <Select value={selectedTeamMember} onValueChange={setSelectedTeamMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.first_name} {member.last_name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedSession.cost_per_participant > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertDescription className="text-amber-900">
                    <strong>Cost:</strong> €{selectedSession.cost_per_participant} per participant
                    <br />
                    <span className="text-sm">Payment details will be provided after registration.</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSession(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegister}
              disabled={registerMutation.isPending || !selectedTeamMember}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {registerMutation.isPending ? 'Registering...' : 'Confirm Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}