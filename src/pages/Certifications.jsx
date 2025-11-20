import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, AlertCircle, CheckCircle2, Clock, Award } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import AddCertificationDialog from '../components/certifications/AddCertificationDialog';
import { useCurrentUser } from '../components/hooks/useCurrentUser';

export default function Certifications() {
  const { isAdmin, partnerId } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ['certifications', partnerId],
    queryFn: async () => {
      const allCerts = await base44.entities.Certification.list('-expiry_date');
      return isAdmin ? allCerts : allCerts.filter(c => c.partner_id === partnerId);
    },
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.list(),
  });

  const { data: solutions = [] } = useQuery({
    queryKey: ['solutions'],
    queryFn: () => base44.entities.Solution.list(),
  });

  const renewNotificationMutation = useMutation({
    mutationFn: (id) => 
      base44.entities.Certification.update(id, { renewal_notified: true }),
    onSuccess: () => queryClient.invalidateQueries(['certifications']),
  });

  // Calculate real-time status
  const getCertificationStatus = (cert) => {
    const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'valid';
  };

  const filteredCertifications = certifications.filter(cert => {
    const partner = partners.find(p => p.id === cert.partner_id);
    const realStatus = getCertificationStatus(cert);
    
    const matchesSearch = partner?.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || realStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getPartnerName = (partnerId) => partners.find(p => p.id === partnerId)?.company_name || 'Unknown';
  const getSolutionName = (solutionId) => solutions.find(s => s.id === solutionId)?.name || 'Unknown';

  const statusConfig = {
    valid: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2, label: 'Valid' },
    expiring_soon: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Expiring Soon' },
    expired: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Expired' },
  };

  const stats = {
    total: certifications.length,
    valid: certifications.filter(c => getCertificationStatus(c) === 'valid').length,
    expiring: certifications.filter(c => getCertificationStatus(c) === 'expiring_soon').length,
    expired: certifications.filter(c => getCertificationStatus(c) === 'expired').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Certification Management</h1>
          <p className="text-slate-600 mt-2">
            {isAdmin ? 'Network-wide tracking and compliance' : 'Your organization\'s certifications'}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-slate-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <Award className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Valid</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.valid}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-yellow-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.expiring}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-600">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Expired</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.expired}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certifications List */}
      <div className="space-y-4">
        {filteredCertifications.map(cert => {
          const realStatus = getCertificationStatus(cert);
          const config = statusConfig[realStatus];
          const Icon = config.icon;
          const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());

          return (
            <Card key={cert.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{cert.certification_name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{getPartnerName(cert.partner_id)}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${config.color} border font-medium`}>
                            {config.label}
                          </Badge>
                          {cert.solution_id && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {getSolutionName(cert.solution_id)}
                            </Badge>
                          )}
                          {cert.certification_code && (
                            <Badge variant="outline" className="bg-slate-50">
                              {cert.certification_code}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {cert.certified_technician_name && (
                      <div className="text-sm text-slate-600 ml-13">
                        Technician: {cert.certified_technician_name}
                      </div>
                    )}
                  </div>

                  <div className="lg:min-w-[280px] space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Issue Date</p>
                        <p className="font-medium text-slate-900">{format(new Date(cert.issue_date), 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Expiry Date</p>
                        <p className="font-medium text-slate-900">{format(new Date(cert.expiry_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    {realStatus === 'expiring_soon' && daysUntilExpiry >= 0 && (
                      <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <span className="text-xs text-yellow-800 font-medium">
                          Expires in {daysUntilExpiry} days
                        </span>
                        {!cert.renewal_notified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => renewNotificationMutation.mutate(cert.id)}
                            className="text-xs h-7"
                          >
                            Send Reminder
                          </Button>
                        )}
                      </div>
                    )}
                    {realStatus === 'expired' && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-center">
                        <span className="text-xs text-red-800 font-medium">
                          Expired {Math.abs(daysUntilExpiry)} days ago
                        </span>
                      </div>
                    )}
                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Certificate →
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCertifications.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No certifications found</h3>
            <p className="text-slate-500">Try adjusting your filters or add a new certification</p>
          </CardContent>
        </Card>
      )}

      {showAddDialog && (
        <AddCertificationDialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          partners={partners}
          solutions={solutions}
        />
      )}
    </div>
  );
}