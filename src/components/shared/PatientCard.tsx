import React from "react";
import { AlertTriangle } from "lucide-react";
import { Patient } from "@/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

interface PatientCardProps {
  patient: Patient;
  abnormalCount: number;
  followupInfo: {
    date: string;
    status: 'none' | 'active' | 'delayed' | 'completed' | 'cancelled';
  };
  onClick: () => void;
}

function getAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function PatientCard({ patient, abnormalCount, followupInfo, onClick }: PatientCardProps) {
  const age = getAge(patient.birthDate);
  const genderLabel = patient.gender === "male" ? "男" : "女";

  const statusConfig: Record<string, { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
    active: { label: '待复诊', variant: 'primary' },
    delayed: { label: '已延期', variant: 'warning' },
    completed: { label: '已完成', variant: 'success' },
    cancelled: { label: '已取消', variant: 'danger' },
    none: { label: '未安排', variant: 'default' },
  };

  const status = statusConfig[followupInfo.status] || statusConfig.none;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4",
        "transition-shadow duration-200 hover:shadow-md cursor-pointer"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar src={patient.avatar} name={patient.name} size="lg" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-900">{patient.name}</span>
          <span className="text-xs text-gray-500">
            {genderLabel} · {age}岁
          </span>
          <div className="flex flex-wrap gap-1">
            {patient.tags.map((tag) => (
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className={cn("flex items-center gap-1 text-sm font-medium", abnormalCount > 0 ? "text-red-500" : "text-green-500")}>
          <AlertTriangle className={cn("h-4 w-4", abnormalCount > 0 ? "text-red-500" : "text-green-500")} />
          <span>{abnormalCount > 0 ? `${abnormalCount}项异常` : "正常"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">下次随访:</span>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
            {status.label}
          </Badge>
          <span className="text-xs text-gray-500">{followupInfo.date}</span>
        </div>
      </div>
    </div>
  );
}
