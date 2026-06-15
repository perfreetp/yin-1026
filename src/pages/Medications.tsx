import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Pill,
  Clock,
  Stethoscope,
  FileText,
  ClipboardList,
  Calendar,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import { useMedicationStore } from '@/stores/medicationStore';
import { useConsultationStore } from '@/stores/consultationStore';
import { usePatientStore } from '@/stores/patientStore';
import { formatDate } from '@/utils/date';
import { formatGender, getTagColor } from '@/utils/format';
import { getAge } from '@/utils/date';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

const quickLinks = [
  { label: '问诊室', icon: Stethoscope, path: 'consultation' },
  { label: '病历', icon: FileText, path: 'records' },
  { label: '检查资料', icon: ClipboardList, path: 'examinations' },
  { label: '随访计划', icon: Calendar, path: 'followup' },
];

const medTabs = [
  { key: 'list', label: '用药清单' },
  { key: 'reminders', label: '用药提醒' },
  { key: 'prescriptions', label: '处方记录' },
];

const statusMap: Record<string, { label: string; variant: 'success' | 'danger' | 'default' }> = {
  active: { label: '使用中', variant: 'success' },
  stopped: { label: '已停药', variant: 'danger' },
  completed: { label: '已完成', variant: 'default' },
};

const severityStyle: Record<string, string> = {
  high: 'border-red-300 bg-red-50',
  medium: 'border-yellow-300 bg-yellow-50',
  low: 'border-yellow-200 bg-yellow-50',
};

const severityIcon: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-600',
  low: 'text-yellow-500',
};

function getTimePeriod(time: string): 'morning' | 'noon' | 'evening' | 'night' {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 20) return 'evening';
  return 'night';
}

const periodLabels: Record<string, string> = {
  morning: '早晨',
  noon: '中午',
  evening: '傍晚',
  night: '晚间',
};

export default function Medications() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patient } = usePatient(patientId || '');
  const getMedicationsByPatient = useMedicationStore((s) => s.getMedicationsByPatient);
  const getRemindersByPatient = useMedicationStore((s) => s.getRemindersByPatient);
  const getInteractionsForPatient = useMedicationStore((s) => s.getInteractionsForPatient);
  const stopMedication = useMedicationStore((s) => s.stopMedication);
  const toggleReminder = useMedicationStore((s) => s.toggleReminder);
  const medications = useMedicationStore((s) => s.medications);
  const getPrescriptionsByPatient = useConsultationStore((s) => s.getPrescriptionsByPatient);
  const doctors = usePatientStore((s) => s.doctors);

  const [activeTab, setActiveTab] = useState('list');

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span className="text-gray-500">患者不存在</span>
      </div>
    );
  }

  const patientMeds = getMedicationsByPatient(patient.id);
  const interactions = getInteractionsForPatient(patient.id);
  const reminders = getRemindersByPatient(patient.id);
  const prescriptions = getPrescriptionsByPatient(patient.id);

  const groupedReminders = reminders.reduce<Record<string, typeof reminders>>(
    (acc, r) => {
      const period = getTimePeriod(r.time);
      if (!acc[period]) acc[period] = [];
      acc[period].push(r);
      return acc;
    },
    {},
  );

  const periodOrder = ['morning', 'noon', 'evening', 'night'] as const;

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar src={patient.avatar} name={patient.name} size="lg" />
            <div>
              <p className="font-medium text-gray-900">{patient.name}</p>
              <p className="text-xs text-gray-500">
                {formatGender(patient.gender)} · {getAge(patient.birthDate)}岁
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {patient.tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.path}
                onClick={() => navigate(`/${link.path}/${patientId}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 text-gray-600 hover:bg-gray-50"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">用药管理</h1>

          <Tabs tabs={medTabs} activeKey={activeTab} onChange={setActiveTab} />

          {activeTab === 'list' && (
            <div className="mt-4 space-y-4">
              {interactions.length > 0 && (
                <div className="space-y-2">
                  {interactions.map((interaction, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg border p-4 ${severityStyle[interaction.severity]}`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${severityIcon[interaction.severity]}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {interaction.drug1} + {interaction.drug2}
                            <Badge variant={interaction.severity === 'high' ? 'danger' : 'warning'} className="ml-2">
                              {interaction.severity === 'high' ? '高风险' : interaction.severity === 'medium' ? '中风险' : '低风险'}
                            </Badge>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {patientMeds.length > 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">药品名称</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">剂量</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">频次</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">开始日期</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">结束日期</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientMeds.map((med) => (
                        <tr key={med.id} className="border-b border-gray-50 last:border-0">
                          <td className="px-4 py-3 font-medium text-gray-900">{med.name}</td>
                          <td className="px-4 py-3 text-gray-700">{med.dosage}</td>
                          <td className="px-4 py-3 text-gray-700">{med.frequency}</td>
                          <td className="px-4 py-3 text-gray-500">{formatDate(med.startDate)}</td>
                          <td className="px-4 py-3 text-gray-500">{med.endDate ? formatDate(med.endDate) : '-'}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusMap[med.status]?.variant || 'default'}>
                              {statusMap[med.status]?.label || med.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {med.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => stopMedication(med.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                停药
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Pill className="h-12 w-12 mb-3" />
                  <span className="text-sm">暂无用药记录</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="mt-4 space-y-6">
              {reminders.length > 0 ? (
                periodOrder.map((period) => {
                  const group = groupedReminders[period];
                  if (!group || group.length === 0) return null;
                  return (
                    <div key={period}>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-5 w-5 text-[#0A6EBD]" />
                        <h3 className="text-sm font-semibold text-gray-900">{periodLabels[period]}</h3>
                      </div>
                      <div className="space-y-2 ml-7">
                        {group.map((reminder) => {
                          const med = medications.find((m) => m.id === reminder.medicationId);
                          return (
                            <div
                              key={reminder.id}
                              className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-[#0A6EBD]">{reminder.time}</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{med?.name || '未知药品'}</p>
                                  <p className="text-xs text-gray-500">{med?.dosage} · {med?.frequency}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleReminder(reminder.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  reminder.enabled ? 'bg-[#0A6EBD]' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Clock className="h-12 w-12 mb-3" />
                  <span className="text-sm">暂无用药提醒</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="mt-4">
              {prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((prescription, idx) => {
                    const doctor = doctors.find((d) => d.id === prescription.doctorId);
                    return (
                      <div key={prescription.id} className="relative pl-8">
                        {idx < prescriptions.length - 1 && (
                          <div className="absolute left-[11px] top-8 bottom-0 w-px bg-gray-200" />
                        )}
                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-[#0A6EBD]/10 flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-[#0A6EBD]" />
                        </div>
                        <Card>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {formatDate(prescription.createdAt)}
                              </span>
                              <Badge variant="primary">处方</Badge>
                            </div>
                            {doctor && (
                              <span className="text-sm text-gray-500">
                                {doctor.name} · {doctor.title}
                              </span>
                            )}
                          </div>
                          <table className="w-full text-sm mb-3">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="pb-2 text-left font-medium text-gray-500">药品</th>
                                <th className="pb-2 text-left font-medium text-gray-500">剂量</th>
                                <th className="pb-2 text-left font-medium text-gray-500">用法</th>
                                <th className="pb-2 text-left font-medium text-gray-500">疗程</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prescription.items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0">
                                  <td className="py-2 text-gray-900">{item.medicationName}</td>
                                  <td className="py-2 text-gray-700">{item.dosage}</td>
                                  <td className="py-2 text-gray-700">{item.usage}</td>
                                  <td className="py-2 text-gray-700">{item.duration}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {prescription.notes && (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                              {prescription.notes}
                            </p>
                          )}
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FileText className="h-12 w-12 mb-3" />
                  <span className="text-sm">暂无处方记录</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
