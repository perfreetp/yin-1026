import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { HealthIndicator } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface AbnormalIndicatorProps {
  indicators: HealthIndicator[];
}

export function AbnormalIndicator({ indicators }: AbnormalIndicatorProps) {
  if (indicators.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-6">
        <CheckCircle className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium text-green-600">暂无异常指标</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {indicators.map((indicator) => (
        <div
          key={indicator.id}
          className={cn(
            "flex items-center justify-between rounded-xl border border-red-200 bg-white p-4"
          )}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">{indicator.name}</span>
              <span className="text-xs text-gray-500">
                正常范围: {indicator.lowerLimit} - {indicator.upperLimit} {indicator.unit}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="danger">
              {indicator.value} {indicator.unit}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
