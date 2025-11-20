import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PerformanceReportCard({ title, currentValue, previousValue, unit = '', icon: Icon, color = "blue" }) {
  const change = previousValue ? ((currentValue - previousValue) / previousValue * 100).toFixed(1) : 0;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  
  const colorClasses = {
    blue: 'border-l-blue-600',
    green: 'border-l-green-600',
    purple: 'border-l-purple-600',
    amber: 'border-l-amber-600',
    red: 'border-l-red-600',
  };

  const trendColors = {
    up: 'bg-green-100 text-green-800',
    down: 'bg-red-100 text-red-800',
    stable: 'bg-gray-100 text-gray-800',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={`shadow-sm border-l-4 ${colorClasses[color]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {unit === '€' && unit}
              {currentValue}
              {unit !== '€' && unit}
            </div>
            {previousValue && (
              <Badge className={`${trendColors[trend]} mt-2 text-xs`}>
                <TrendIcon className="w-3 h-3 mr-1" />
                {Math.abs(change)}% vs prev
              </Badge>
            )}
          </div>
          {Icon && <Icon className={`w-8 h-8 text-${color}-400`} />}
        </div>
      </CardContent>
    </Card>
  );
}