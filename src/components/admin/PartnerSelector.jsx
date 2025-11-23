import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export default function PartnerSelector({ value, onChange }) {
  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const allPartners = partners.filter(p => ['active', 'pending_onboarding'].includes(p.status));

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400" />
      <Select value={value || 'admin'} onValueChange={(val) => onChange(val === 'admin' ? null : val)}>
        <SelectTrigger className="w-64 bg-white">
          <SelectValue>
            {value ? allPartners.find(p => p.id === value)?.company_name : 'Admin View (All Data)'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin View (All Data)</SelectItem>
          {allPartners.map(partner => (
            <SelectItem key={partner.id} value={partner.id}>
              {partner.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}