import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw } from 'lucide-react';

export default function ProductGroupDiscountManager() {
  const queryClient = useQueryClient();
  const [discountMatrix, setDiscountMatrix] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: assaAbloyProducts = [], isLoading: loadingPG } = useQuery({
    queryKey: ['assaAbloyProducts'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'assa_abloy_products' && v.active);
    },
  });

  const { data: partnerTypes = [], isLoading: loadingPT } = useQuery({
    queryKey: ['partnerTypes'],
    queryFn: async () => {
      const values = await base44.entities.DropdownValue.list();
      return values.filter(v => v.category === 'partner_type' && v.active);
    },
  });

  const { data: existingDiscounts = [] } = useQuery({
    queryKey: ['productGroupDiscounts'],
    queryFn: () => base44.entities.ProductGroupDiscount.list(),
    onSuccess: (data) => {
      const matrix = {};
      data.forEach(discount => {
        const productKey = discount.assa_abloy_product || discount.product_group_value;
        const key = `${discount.partner_type}-${productKey}`;
        matrix[key] = {
          id: discount.id,
          percentage: discount.base_discount_percentage,
        };
      });
      setDiscountMatrix(matrix);
    },
  });

  const saveDiscountsMutation = useMutation({
    mutationFn: async (updates) => {
      const promises = updates.map(update => {
        if (update.id) {
          return base44.entities.ProductGroupDiscount.update(update.id, {
            base_discount_percentage: update.percentage,
          });
        } else {
          return base44.entities.ProductGroupDiscount.create({
            partner_type: update.partner_type,
            assa_abloy_product: update.assa_abloy_product,
            base_discount_percentage: update.percentage,
            effective_date: new Date().toISOString().split('T')[0],
          });
        }
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['productGroupDiscounts']);
      setHasChanges(false);
    },
  });

  const handleDiscountChange = (partnerType, assaAbloyProduct, value) => {
    const key = `${partnerType}-${assaAbloyProduct}`;
    const percentage = parseFloat(value) || 0;
    
    setDiscountMatrix(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        percentage,
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updates = [];
    Object.entries(discountMatrix).forEach(([key, data]) => {
      if (data.percentage > 0) {
        const [partner_type, assa_abloy_product] = key.split('-');
        updates.push({
          id: data.id,
          partner_type,
          assa_abloy_product,
          percentage: data.percentage,
        });
      }
    });
    saveDiscountsMutation.mutate(updates);
  };

  if (loadingPG || loadingPT) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            ASSA ABLOY Product Discount Matrix
          </h1>
          <p className="text-slate-600 mt-2">
            Manage base discount percentages for each Partner Type and ASSA ABLOY Product combination
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries(['productGroupDiscounts'])}
            disabled={saveDiscountsMutation.isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saveDiscountsMutation.isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveDiscountsMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-800">Unsaved Changes</Badge>
              <span className="text-sm text-slate-700">
                You have unsaved changes. Click "Save Changes" to apply them.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Discount Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left p-3 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10">
                    ASSA ABLOY Product / Partner Type
                  </th>
                  {partnerTypes.map(pt => (
                    <th key={pt.id} className="text-center p-3 font-semibold text-slate-700 bg-slate-50 min-w-[120px]">
                      {pt.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assaAbloyProducts.map(product => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-900 bg-white sticky left-0 z-10 border-r border-slate-200">
                      {product.label}
                    </td>
                    {partnerTypes.map(pt => {
                      const key = `${pt.value}-${product.value}`;
                      const currentValue = discountMatrix[key]?.percentage || 0;
                      return (
                        <td key={pt.id} className="p-2 text-center">
                          <div className="relative inline-flex items-center">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentValue}
                              onChange={(e) => handleDiscountChange(pt.value, product.value, e.target.value)}
                              className="w-24 text-center"
                            />
                            <span className="absolute right-2 text-slate-400 pointer-events-none">%</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">How to use this matrix:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each cell represents the base discount for a specific Partner Type and ASSA ABLOY Product.</li>
              <li>• Enter discount percentages (0-100%). Leave at 0 if no discount applies.</li>
              <li>• These base discounts will be used in future quotation and pricing calculations.</li>
              <li>• Additional project-specific discounts can be managed separately in the Extra Discount Rules.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}