import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

export default function TenderNDADialog({ open, tender, userEmail, partnerId, onAccept }) {
  const [agreed, setAgreed] = useState(false);
  const queryClient = useQueryClient();

  const acceptNDAMutation = useMutation({
    mutationFn: async () => {
      return base44.entities.TenderNDA.create({
        tender_id: tender.id,
        user_email: userEmail,
        partner_id: partnerId,
        accepted_at: new Date().toISOString(),
        nda_version: '1.0'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenderNDA', tender.id, userEmail]);
      onAccept();
    },
  });

  const handleAccept = () => {
    if (agreed) {
      acceptNDAMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
            <DialogTitle className="text-2xl">Non-Disclosure Agreement</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Before accessing confidential tender information, you must agree to our NDA terms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-900 text-sm">
              <strong>Legal Notice:</strong> By accepting this NDA, you agree not to disclose tender information 
              to third parties outside your organization or use it for competitive purposes.
            </AlertDescription>
          </Alert>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-sm">
            <h3 className="font-bold text-slate-900">Confidentiality Agreement</h3>
            
            <p className="text-slate-700">
              This Non-Disclosure Agreement ("Agreement") is entered into by and between ASSA ABLOY ("Disclosing Party") 
              and {partnerId} ("Receiving Party") for the purpose of protecting confidential information related to tender: 
              <strong> {tender.tender_code}</strong>.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">1. Confidential Information</h4>
            <p className="text-slate-700">
              "Confidential Information" includes all project details, customer information, technical specifications, 
              pricing, documents, and any other information disclosed through this tender platform.
            </p>

            <h4 className="font-semibold text-slate-900 mt-4">2. Obligations</h4>
            <p className="text-slate-700">
              The Receiving Party agrees to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Keep all Confidential Information strictly confidential</li>
              <li>Not disclose information to any third party without prior written consent</li>
              <li>Use information solely for the purpose of responding to this tender</li>
              <li>Not use information for competitive advantage or business development outside this tender</li>
              <li>Protect information with at least the same degree of care as own confidential information</li>
            </ul>

            <h4 className="font-semibold text-slate-900 mt-4">3. Consequences of Breach</h4>
            <p className="text-slate-700">
              Unauthorized disclosure or use of Confidential Information may result in:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Immediate termination from tender process</li>
              <li>Removal from partner network</li>
              <li>Legal action and claims for damages</li>
            </ul>

            <h4 className="font-semibold text-slate-900 mt-4">4. Duration</h4>
            <p className="text-slate-700">
              This Agreement remains in effect for 3 years from the date of acceptance or until information 
              becomes publicly available through no fault of the Receiving Party.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This agreement is digitally recorded with your email address ({userEmail}), 
              timestamp, and is legally binding. A copy will be available in your account records.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg border border-slate-300">
          <Checkbox
            id="nda-agree"
            checked={agreed}
            onCheckedChange={setAgreed}
          />
          <label
            htmlFor="nda-agree"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            I have read and agree to the terms of this Non-Disclosure Agreement on behalf of my organization
          </label>
        </div>

        <DialogFooter>
          <Button
            onClick={handleAccept}
            disabled={!agreed || acceptNDAMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            {acceptNDAMutation.isPending ? 'Processing...' : 'Accept NDA & View Tender Details'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}