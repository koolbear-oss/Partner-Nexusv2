import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Granular admin roles (can be extended based on user metadata or additional fields)
  const isSuperAdmin = user?.role === 'admin' && user?.user_role === 'owner';
  const isAccountManager = user?.role === 'admin' && (user?.user_role === 'editor' || user?.user_role === 'viewer');
  const isFinanceAdmin = user?.role === 'admin' && user?.finance_access === true; // Placeholder for future finance role

  // Partner roles
  const isPartnerAdmin = user?.role === 'partner_user' && user?.user_role === 'owner';
  const isProjectManager = user?.role === 'partner_user' && user?.user_role === 'editor';
  const isTechnician = user?.role === 'partner_user' && user?.user_role === 'viewer';
  const isViewOnly = user?.role === 'partner_user' && user?.view_only === true; // Placeholder for future view-only role

  return {
    user,
    isLoading,
    error,
    
    // Legacy/simplified roles
    isAdmin: user?.role === 'admin',
    isPartnerUser: user?.role === 'partner_user',
    partnerId: user?.partner_id,
    
    // Granular admin roles
    isSuperAdmin,
    isAccountManager,
    isFinanceAdmin,
    
    // Granular partner roles
    isPartnerAdmin,
    isProjectManager,
    isTechnician,
    isViewOnly,
    
    // Permissions
    canViewAllPartners: user?.role === 'admin',
    canEditPartnerData: user?.role === 'admin' || user?.user_role === 'owner' || user?.user_role === 'editor',
    canManageTeam: user?.role === 'admin' || (user?.role === 'partner_user' && user?.user_role === 'owner'),
    canApproveDiscounts: isSuperAdmin || isFinanceAdmin,
    canLaunchTenders: user?.role === 'admin',
    canAwardProjects: user?.role === 'admin',
    canRespondToTenders: user?.role === 'partner_user' && (user?.user_role === 'owner' || user?.user_role === 'editor'),
  };
}