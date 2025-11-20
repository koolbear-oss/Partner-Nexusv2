import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useMimic } from '../contexts/MimicContext';

export function useCurrentUser() {
  const { mimicPartnerId } = useMimic();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: mimicPartner } = useQuery({
    queryKey: ['mimicPartner', mimicPartnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.list();
      return partners.find(p => p.id === mimicPartnerId);
    },
    enabled: !!mimicPartnerId && user?.role === 'admin',
    staleTime: 5 * 60 * 1000,
  });

  // If admin is mimicking a partner, override user properties
  const effectiveUser = mimicPartnerId && mimicPartner && user?.role === 'admin' 
    ? {
        ...user,
        role: 'partner_user',
        partner_id: mimicPartnerId,
        full_name: `${user.full_name} (viewing as ${mimicPartner.company_name})`,
      }
    : user;

  // Granular admin roles (can be extended based on user metadata or additional fields)
  const isSuperAdmin = effectiveUser?.role === 'admin' && effectiveUser?.user_role === 'owner';
  const isAccountManager = effectiveUser?.role === 'admin' && (effectiveUser?.user_role === 'editor' || effectiveUser?.user_role === 'viewer');
  const isFinanceAdmin = effectiveUser?.role === 'admin' && effectiveUser?.finance_access === true; // Placeholder for future finance role

  // Partner roles
  const isPartnerAdmin = effectiveUser?.role === 'partner_user' && effectiveUser?.user_role === 'owner';
  const isProjectManager = effectiveUser?.role === 'partner_user' && effectiveUser?.user_role === 'editor';
  const isTechnician = effectiveUser?.role === 'partner_user' && effectiveUser?.user_role === 'viewer';
  const isViewOnly = effectiveUser?.role === 'partner_user' && effectiveUser?.view_only === true; // Placeholder for future view-only role

  return {
    user: effectiveUser,
    originalUser: user, // Always return the original user data
    isLoading,
    error,
    
    // Legacy/simplified roles
    isAdmin: user?.role === 'admin' && !mimicPartnerId, // Only true admin if not mimicking
    isPartnerUser: effectiveUser?.role === 'partner_user',
    partnerId: effectiveUser?.partner_id,
    
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
    canViewAllPartners: user?.role === 'admin' && !mimicPartnerId,
    canEditPartnerData: (user?.role === 'admin' && !mimicPartnerId) || effectiveUser?.user_role === 'owner' || effectiveUser?.user_role === 'editor',
    canManageTeam: (user?.role === 'admin' && !mimicPartnerId) || (effectiveUser?.role === 'partner_user' && effectiveUser?.user_role === 'owner'),
    canApproveDiscounts: (isSuperAdmin || isFinanceAdmin) && !mimicPartnerId,
    canLaunchTenders: user?.role === 'admin' && !mimicPartnerId,
    canAwardProjects: user?.role === 'admin' && !mimicPartnerId,
    canRespondToTenders: effectiveUser?.role === 'partner_user' && (effectiveUser?.user_role === 'owner' || effectiveUser?.user_role === 'editor'),
  };
}