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

  const activePartners = partners.filter(p => p.status === 'active');

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400" />
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-64 bg-white">
          <SelectValue placeholder="View as Partner..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>Admin View (All Data)</SelectItem>
          {activePartners.map(partner => (
            <SelectItem key={partner.id} value={partner.id}>
              {partner.company_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}