import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useCurrentUser() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    user,
    isLoading,
    error,
    isAdmin: user?.role === 'admin',
    isPartnerUser: user?.role === 'partner_user',
    partnerId: user?.partner_id,
    canViewAllPartners: user?.role === 'admin',
    canEditPartnerData: user?.role === 'admin' || user?.user_role === 'owner' || user?.user_role === 'editor',
  };
}