import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit, UserPlus, UserMinus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TrainingHistoryLog({ session }) {
  const historyLog = session.history_log || [];

  const getActionIcon = (action) => {
    switch (action) {
      case 'created': return Edit;
      case 'updated': return Edit;
      case 'registration_added': return UserPlus;
      case 'registration_retracted': return UserMinus;
      case 'attendance_confirmed': return CheckCircle2;
      default: return Clock;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'text-blue-600';
      case 'updated': return 'text-amber-600';
      case 'registration_added': return 'text-green-600';
      case 'registration_retracted': return 'text-red-600';
      case 'attendance_confirmed': return 'text-purple-600';
      default: return 'text-slate-600';
    }
  };

  const formatAction = (entry) => {
    switch (entry.action) {
      case 'created':
        return `Training session created by ${entry.user}`;
      case 'updated':
        const changes = Object.keys(entry.details?.changes || {});
        return `Updated: ${changes.join(', ')}`;
      case 'registration_added':
        return `Partner registered for training`;
      case 'registration_retracted':
        return `Partner retracted attendance`;
      case 'attendance_confirmed':
        return `Attendance confirmed`;
      default:
        return entry.action;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {historyLog.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No activity recorded yet</p>
        ) : (
          <div className="space-y-3">
            {historyLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((entry, idx) => {
              const ActionIcon = getActionIcon(entry.action);
              const color = getActionColor(entry.action);

              return (
                <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <ActionIcon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 text-sm">
                      {formatAction(entry)}
                    </div>
                    {entry.user && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                        <User className="w-3 h-3" />
                        {entry.user}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                    {entry.details?.changes && (
                      <div className="mt-2 text-xs">
                        {Object.entries(entry.details.changes).map(([field, change]) => (
                          <div key={field} className="text-slate-600">
                            <span className="font-medium">{field}:</span> 
                            <span className="line-through text-red-600 mx-1">{JSON.stringify(change.from)}</span>
                            → 
                            <span className="text-green-600 mx-1">{JSON.stringify(change.to)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}