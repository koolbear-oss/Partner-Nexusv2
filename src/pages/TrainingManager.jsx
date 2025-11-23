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
  CheckCircle2, Clock, MapPin, Video, TrendingUp 
} from 'lucide-react';
import CreateTrainingDialog from '../components/training/CreateTrainingDialog';
import TrainingComplianceOverview from '../components/training/TrainingComplianceOverview';
import { format } from 'date-fns';

export default function TrainingManager() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('all');

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

  const filteredSessions = selectedProduct === 'all' 
    ? trainingSessions 
    : trainingSessions.filter(t => t.assa_abloy_product === selectedProduct);

  const upcomingSessions = filteredSessions.filter(t => 
    t.status === 'scheduled' || t.status === 'registration_open'
  );

  const completedSessions = filteredSessions.filter(t => t.status === 'completed');

  const getProductLabel = (value) => {
    return assaAbloyProducts.find(p => p.value === value)?.label || value;
  };

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

      {/* Product Filter */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={selectedProduct === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedProduct('all')}
              size="sm"
            >
              All Products
            </Button>
            {assaAbloyProducts.map(product => (
              <Button
                key={product.value}
                variant={selectedProduct === product.value ? 'default' : 'outline'}
                onClick={() => setSelectedProduct(product.value)}
                size="sm"
              >
                {product.label}
              </Button>
            ))}
          </div>
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
                            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 border">
                              {getProductLabel(session.assa_abloy_product)}
                            </Badge>
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
      </Tabs>

      {showCreateDialog && (
        <CreateTrainingDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          assaAbloyProducts={assaAbloyProducts}
        />
      )}
    </div>
  );
}