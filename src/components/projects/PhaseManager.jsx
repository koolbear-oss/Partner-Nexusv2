import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function PhaseManager({ project, canEdit }) {
  const queryClient = useQueryClient();
  const [selectedPhase, setSelectedPhase] = useState(project.current_phase || '');

  const phases = [
    'planning',
    'design',
    'procurement',
    'installation',
    'commissioning',
    'handover',
    'maintenance'
  ];

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['project', project.id]);
    },
  });

  const handlePhaseChange = async () => {
    if (!selectedPhase || selectedPhase === project.current_phase) return;

    const phaseHistoryEntry = {
      phase: project.current_phase,
      started: project.phase_started,
      completed: new Date().toISOString().split('T')[0],
      status: 'completed',
    };

    const updatedHistory = [...(project.phase_history || []), phaseHistoryEntry];

    await updateProjectMutation.mutateAsync({
      id: project.id,
      data: {
        current_phase: selectedPhase,
        phase_started: new Date().toISOString().split('T')[0],
        phase_history: updatedHistory,
      }
    });

    setSelectedPhase('');
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Move to Next Phase
              </label>
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map(phase => (
                    <SelectItem key={phase} value={phase} disabled={phase === project.current_phase}>
                      {phase.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handlePhaseChange}
              disabled={!selectedPhase || selectedPhase === project.current_phase || updateProjectMutation.isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Phase
            </Button>
          </div>
        </Card>
      )}

      {/* Current Phase */}
      {project.current_phase && (
        <Card className="p-6 border-l-4 border-l-blue-600">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-slate-500">Current Phase</div>
              <div className="text-xl font-bold text-slate-900 capitalize">
                {(project.current_phase || 'planning').replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          {project.phase_started && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              Started: {format(new Date(project.phase_started), 'MMM d, yyyy')}
            </div>
          )}
        </Card>
      )}

      {/* Phase History */}
      {project.phase_history && project.phase_history.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Phase History</h3>
          {project.phase_history.map((phase, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-slate-900 capitalize">
                      {(phase.phase || 'unknown').replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(phase.started), 'MMM d, yyyy')} - {format(new Date(phase.completed), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {phase.status || 'completed'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(!project.phase_history || project.phase_history.length === 0) && !project.current_phase && (
        <div className="text-center py-8 text-slate-500">
          No phase information available
        </div>
      )}
    </div>
  );
}