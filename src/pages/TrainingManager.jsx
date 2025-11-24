import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, Plus, Calendar, Users, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Video, TrendingUp, AlertCircle 
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CreateTrainingDialog from '../components/training/CreateTrainingDialog';
import EditTrainingDialog from '../components/training/EditTrainingDialog';
import TrainingHistoryLog from '../components/training/TrainingHistoryLog';
import TrainingComplianceOverview from '../components/training/TrainingComplianceOverview';
import TrainingRequirementsSettings from '../components/training/TrainingRequirementsSettings';
import { format } from 'date-fns';

export default function TrainingManager() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedVerticals, setSelectedVerticals] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const { data: trainingSessions = [] } = useQuery({
    queryKey: ['training-sessions'],
    queryFn: () => base44.entities.TrainingSession.list('-session_date'),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['training-registrations'],
    queryFn: () => base44.entities.TrainingRegistration.list(),
  });

  const { data: assaAbloyProducts = [] } = useQuery({
    queryKey: ['assa-abloy-products'],
    queryFn: async () => {
      const all = await base44.entities.DropdownValue.list();
      return all.filter(d => d.category === 'assa_abloy_products' && d.active);
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: verticals = [] } = useQuery({
    queryKey: ['verticals'],
    queryFn: () => base44.entities.Vertical.list(),
  });

  const filteredSessions = trainingSessions.filter(session => {
    const productMatch = selectedProducts.length === 0 || 
      (session.assa_abloy_product && selectedProducts.includes(session.assa_abloy_product));
    
    const verticalMatch = selectedVerticals.length === 0 ||
      (session.verticals?.some(v => selectedVerticals.includes(v)));
    
    return productMatch && verticalMatch;
  });

  const upcomingSessions = filteredSessions.filter(t => 
    t.status === 'scheduled' || t.status === 'registration_open'
  );

  const completedSessions = filteredSessions.filter(t => t.status === 'completed');

  const getProductLabel = (value) => {
    return assaAbloyProducts.find(p => p.value === value)?.label || value;
  };

  const getVerticalName = (id) => {
    return verticals.find(v => v.id === id)?.name || 'Unknown';
  };

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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const confirmAttendanceMutation = useMutation({
    mutationFn: async ({ sessionId, attendedRegistrations }) => {
      const session = trainingSessions.find(s => s.id === sessionId);
      const sessionRegs = registrations.filter(r => r.training_session_id === sessionId);
      
      // Update session status with history log
      await base44.entities.TrainingSession.update(sessionId, {
        status: 'completed',
        attendance_confirmed: true,
        attended_count: attendedRegistrations.length,
        history_log: [
          ...(session.history_log || []),
          {
            timestamp: new Date().toISOString(),
            action: 'attendance_confirmed',
            user: user?.email,
            details: { 
              attended_count: attendedRegistrations.length,
              registered_count: sessionRegs.length
            }
          }
        ]
      });

      // Update each registration, create certifications, and send notifications
      for (const regId of attendedRegistrations) {
        const reg = sessionRegs.find(r => r.id === regId);
        const partner = partners.find(p => p.id === reg?.partner_id);
        
        // Update registration status
        await base44.entities.TrainingRegistration.update(regId, {
          status: 'completed',
          attendance_confirmed: true,
          completion_date: session.session_date
        });

        // Auto-create certification if training issues one
        if (session.issues_certification && session.assa_abloy_product) {
          const expiryDate = new Date(session.session_date);
          expiryDate.setMonth(expiryDate.getMonth() + (session.certification_valid_for_months || 12));
          
          await base44.entities.Certification.create({
            partner_id: reg.partner_id,
            certification_name: `${session.assa_abloy_product} - ${session.title}`,
            issue_date: session.session_date,
            expiry_date: expiryDate.toISOString().split('T')[0],
            status: 'valid',
            training_session_id: sessionId,
            assa_abloy_product: session.assa_abloy_product
          });
        }

        // Create notification for partner about completed training
        if (partner?.primary_contact?.email) {
          await base44.entities.Notification.create({
            user_email: partner.primary_contact.email,
            partner_id: reg.partner_id,
            type: 'training_completed',
            title: 'Training Completed',
            message: `You have successfully completed "${session.title}"${session.issues_certification ? ' and earned a certification.' : '.'}`,
            link: `/trainings`,
            related_entity_type: 'TrainingSession',
            related_entity_id: sessionId
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['training-sessions']);
      queryClient.invalidateQueries(['training-registrations']);
      queryClient.invalidateQueries(['certifications']);
      queryClient.invalidateQueries(['notifications']);
      setShowAttendanceDialog(false);
      setSelectedSession(null);
    },
  });

  const getRegistrationsForSession = (sessionId) => {
    return registrations.filter(r => r.training_session_id === sessionId);
  };

  const statusColors = {
    scheduled: 'bg-slate-100 text-slate-800',
    registration_open: 'bg-green-100 text-green-800',
    registration_closed: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const locationIcons = {
    onsite: MapPin,
    online: Video,
    hybrid: Users,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Training Manager</h1>
          <p className="text-slate-600 mt-2">
            Manage product training sessions and track partner compliance
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Training
        </Button>
      </div>

      {/* Compliance Overview */}
      <TrainingComplianceOverview 
        partners={partners}
        trainingSessions={trainingSessions}
        registrations={registrations}
        assaAbloyProducts={assaAbloyProducts}
      />

      {/* Multi-select Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-4">
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

      {/* Training Sessions */}
      <Tabs defaultValue="upcoming">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="requirements">
            Requirements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4 mt-6">
          {upcomingSessions.map(session => {
            const sessionRegistrations = getRegistrationsForSession(session.id);
            const LocationIcon = locationIcons[session.location?.type] || MapPin;
            
            return (
              <Card key={session.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-bold text-slate-900 text-lg">{session.title}</h3>
                            <Badge className="bg-slate-100 text-slate-800 border-slate-200 border">
                              {session.event_type?.replace(/_/g, ' ') || 'Training'}
                            </Badge>
                            {session.assa_abloy_product && (
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 border">
                                {getProductLabel(session.assa_abloy_product)}
                              </Badge>
                            )}
                            {session.verticals?.map(verticalId => (
                              <Badge key={verticalId} className="bg-purple-100 text-purple-800 border-purple-200 border">
                                {getVerticalName(verticalId)}
                              </Badge>
                            ))}
                            {session.is_mandatory && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 border font-semibold">
                                MANDATORY
                              </Badge>
                            )}
                            {session.influences_bonus && (
                              <Badge className="bg-green-100 text-green-800 border-green-200 border">
                                +Bonus
                              </Badge>
                            )}
                            <Badge className={statusColors[session.status]}>
                              {session.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          {session.description && (
                            <p className="text-sm text-slate-600 mb-3">{session.description}</p>
                          )}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(session.session_date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <LocationIcon className="w-4 h-4" />
                              <span>{session.location?.type || 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Users className="w-4 h-4" />
                              <span>{sessionRegistrations.length}/{session.max_participants}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span>{session.duration_days} day{session.duration_days > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:min-w-[200px] flex flex-col gap-2">
                      <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600 mb-1">Registrations</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {sessionRegistrations.length}
                        </div>
                      </div>
                      {session.issues_certification && (
                        <div className="text-xs text-center text-green-700 bg-green-50 rounded p-2 border border-green-200">
                          <CheckCircle2 className="w-4 h-4 inline mr-1" />
                          Issues {session.certification_valid_for_months}mo cert
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSession(session);
                          setShowEditDialog(true);
                        }}
                      >
                        Edit Training
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSession(session);
                          setShowHistoryDialog(true);
                        }}
                      >
                        View History
                      </Button>
                      {session.status === 'in_progress' && !session.attendance_confirmed && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session);
                            setShowAttendanceDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Confirm Attendance
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {upcomingSessions.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No upcoming sessions</h3>
                <p className="text-slate-500 mb-4">Schedule a training session to get started</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Training
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedSessions.map(session => {
            const sessionRegistrations = getRegistrationsForSession(session.id);
            const attendedCount = sessionRegistrations.filter(r => r.status === 'completed' || r.status === 'attended').length;
            
            return (
              <Card key={session.id} className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900">{session.title}</h3>
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 border">
                              {getProductLabel(session.assa_abloy_product)}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            {format(new Date(session.session_date), 'MMMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-slate-500">Registered</div>
                        <div className="font-bold text-slate-900">{sessionRegistrations.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-500">Attended</div>
                        <div className="font-bold text-green-700">{attendedCount}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {completedSessions.length === 0 && (
            <Card className="shadow-sm">
              <CardContent className="py-16 text-center">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No completed sessions</h3>
                <p className="text-slate-500">Completed training sessions will appear here</p>
              </CardContent>
              </Card>
              )}
              </TabsContent>

              <TabsContent value="requirements" className="mt-6">
              <TrainingRequirementsSettings />
              </TabsContent>
              </Tabs>

      {showCreateDialog && (
        <CreateTrainingDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          assaAbloyProducts={assaAbloyProducts}
        />
      )}

      {showEditDialog && selectedSession && (
        <EditTrainingDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          assaAbloyProducts={assaAbloyProducts}
        />
      )}

      {showHistoryDialog && selectedSession && (
        <Dialog open={showHistoryDialog} onOpenChange={() => { setShowHistoryDialog(false); setSelectedSession(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSession.title} - History</DialogTitle>
            </DialogHeader>
            <TrainingHistoryLog session={selectedSession} />
          </DialogContent>
        </Dialog>
      )}

      {/* Attendance Confirmation Dialog */}
      {showAttendanceDialog && selectedSession && (
        <AttendanceConfirmationDialog
          session={selectedSession}
          registrations={getRegistrationsForSession(selectedSession.id)}
          partners={partners}
          onConfirm={(attendedIds) => {
            confirmAttendanceMutation.mutate({
              sessionId: selectedSession.id,
              attendedRegistrations: attendedIds
            });
          }}
          onClose={() => {
            setShowAttendanceDialog(false);
            setSelectedSession(null);
          }}
          isLoading={confirmAttendanceMutation.isPending}
        />
      )}
    </div>
  );
}

function AttendanceConfirmationDialog({ session, registrations, partners, onConfirm, onClose, isLoading }) {
  const [attendedIds, setAttendedIds] = useState(registrations.map(r => r.id));

  const toggleAttendance = (regId) => {
    setAttendedIds(prev =>
      prev.includes(regId) ? prev.filter(id => id !== regId) : [...prev, regId]
    );
  };

  const getPartnerName = (partnerId) => {
    return partners.find(p => p.id === partnerId)?.company_name || 'Unknown';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Attendance</DialogTitle>
          <DialogDescription>
            Select the participants who attended {session.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {registrations.map(reg => (
            <label
              key={reg.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                attendedIds.includes(reg.id)
                  ? 'bg-green-50 border-green-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Checkbox
                checked={attendedIds.includes(reg.id)}
                onCheckedChange={() => toggleAttendance(reg.id)}
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">
                  {getPartnerName(reg.partner_id)}
                </div>
                <div className="text-sm text-slate-600">
                  Team Member ID: {reg.team_member_id}
                </div>
              </div>
              {attendedIds.includes(reg.id) && (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
            </label>
          ))}

          {registrations.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No registrations for this session
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-slate-600">
            {attendedIds.length} of {registrations.length} attended
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(attendedIds)}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Confirming...' : 'Confirm Attendance'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}