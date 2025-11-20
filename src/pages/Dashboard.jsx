import React from 'react';
import { useCurrentUser } from '../components/hooks/useCurrentUser';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import PartnerDashboard from '../components/dashboards/PartnerDashboard';

export default function Dashboard() {
  const { isAdmin, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <PartnerDashboard />;
}