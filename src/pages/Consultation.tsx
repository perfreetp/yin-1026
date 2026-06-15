import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Video,
  MessageSquare,
  Camera,
  Mic,
  PhoneOff,
  Send,
  ImagePlus,
  Plus,
  FileText,
  ClipboardList,
  Pill,
  Calendar,
  ArrowRightLeft,
} from 'lucide-react'
import { usePatient } from '@/hooks/usePatient'
import { useConsultationStore } from '@/stores/consultationStore'
import { usePatientStore } from '@/stores/patientStore'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { AbnormalIndicator } from '@/components/shared/AbnormalIndicator'
import { cn } from '@/lib/utils'
import type { PrescriptionItem } from '@/types'

function getAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const referralStatusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'primary' }> = {
  pending: { label: '待处理', variant: 'warning' },
  accepted: { label: '已接受', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
}

export default function Consultation() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const { patient, indicators, referrals } = usePatient(patientId || '')
  const { messages, consultations, addPrescription, sendMessage } = useConsultationStore()
  const doctors = usePatientStore((s) => s.doctors)

  const [activeTab, setActiveTab] = useState<'video' | 'text'>('video')
  const [showPrescription, setShowPrescription] = useState(true)
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([
    { medicationName: '', dosage: '', usage: '', duration: '' },
  ])
  const [prescriptionNotes, setPrescriptionNotes] = useState('')
  const [referralDoctorId, setReferralDoctorId] = useState('')
  const [referralReason, setReferralReason] = useState('')
  const [newMessage, setNewMessage] = useState('')

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        患者信息不存在
      </div>
    )
  }

  const activeConsultation = consultations.find(
    (c) => c.patientId === patientId && c.status === 'active'
  )
  const consultationMessages = activeConsultation
    ? messages.filter((m) => m.consultationId === activeConsultation.id)
    : []
  const abnormalIndicators = indicators.filter((i) => i.isAbnormal)
  const latestReferral = referrals.length > 0 ? referrals[referrals.length - 1] : null
  const age = getAge(patient.birthDate)
  const genderLabel = patient.gender === 'male' ? '男' : '女'

  const specialistDoctors = doctors.filter((d) =>
    d.department.includes('内科') || d.department.includes('外科') || d.department.includes('科')
  )

  const handleAddPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medicationName: '', dosage: '', usage: '', duration: '' }])
  }

  const handlePrescriptionItemChange = (
    index: number,
    field: keyof PrescriptionItem,
    value: string
  ) => {
    const updated = [...prescriptionItems]
    updated[index] = { ...updated[index], [field]: value }
    setPrescriptionItems(updated)
  }

  const handleSavePrescription = () => {
    if (!activeConsultation || !patientId) return
    const validItems = prescriptionItems.filter((item) => item.medicationName)
    if (validItems.length === 0) return
    addPrescription({
      id: `presc-${Date.now()}`,
      patientId,
      doctorId: activeConsultation.doctorId,
      consultationId: activeConsultation.id,
      items: validItems,
      notes: prescriptionNotes,
      createdAt: new Date().toISOString(),
    })
    setPrescriptionItems([{ medicationName: '', dosage: '', usage: '', duration: '' }])
    setPrescriptionNotes('')
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConsultation) return
    sendMessage({
      id: `msg-${Date.now()}`,
      consultationId: activeConsultation.id,
      senderId: activeConsultation.doctorId,
      senderRole: 'doctor',
      content: newMessage.trim(),
      type: 'text',
      createdAt: new Date().toISOString(),
    })
    setNewMessage('')
  }

  const navLinks = [
    { label: '病历', path: `/records/${patientId}`, icon: FileText },
    { label: '检查资料', path: `/examinations/${patientId}`, icon: ClipboardList },
    { label: '用药', path: `/medications/${patientId}`, icon: Pill },
    { label: '随访计划', path: `/followup/${patientId}`, icon: Calendar },
  ]

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
      <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar src={patient.avatar} name={patient.name} size="lg" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-900">{patient.name}</span>
            <span className="text-xs text-gray-500">{genderLabel} · {age}岁</span>
            <div className="flex flex-wrap gap-1">
              {patient.tags.map((tag) => (
                <Badge key={tag} variant="primary">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">异常指标</span>
          <AbnormalIndicator indicators={abnormalIndicators} />
        </div>

        {latestReferral && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">转诊状态</span>
            <div className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{latestReferral.reason.slice(0, 20)}...</span>
                <Badge variant={referralStatusMap[latestReferral.status]?.variant || 'default'}>
                  {referralStatusMap[latestReferral.status]?.label || latestReferral.status}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('video')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === 'video'
                ? "text-[#0A6EBD] border-[#0A6EBD]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            )}
          >
            <Video className="h-4 w-4" />
            视频问诊
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2",
              activeTab === 'text'
                ? "text-[#0A6EBD] border-[#0A6EBD]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            文字咨询
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'video' ? (
            <div className="flex flex-col gap-4 h-full">
              <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <Camera className="h-12 w-12" />
                  <span className="text-sm">视频问诊区域</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <Mic className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <Camera className="h-5 w-5" />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FA5252] text-white hover:bg-[#e04444] transition-colors">
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto flex flex-col gap-3 mb-4">
                {consultationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.senderRole === 'doctor' ? "items-end" : "items-start"
                    )}
                  >
                    <span className="text-xs text-gray-400">
                      {msg.senderRole === 'doctor' ? '医生' : patient.name}
                    </span>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-xl px-4 py-2 text-sm",
                        msg.senderRole === 'doctor'
                          ? "bg-[#0A6EBD] text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-300">
                      {new Date(msg.createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
                <button className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-gray-200 px-4 py-3">
          <Button variant="danger" size="sm">结束问诊</Button>
          <Button variant="primary" size="sm" onClick={() => setShowPrescription(true)}>填写处方</Button>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setShowPrescription(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
              showPrescription
                ? "text-[#0A6EBD] border-[#0A6EBD]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            )}
          >
            <FileText className="h-4 w-4" />
            处方
          </button>
          <button
            onClick={() => setShowPrescription(false)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
              !showPrescription
                ? "text-[#0A6EBD] border-[#0A6EBD]"
                : "text-gray-500 border-transparent hover:text-gray-700"
            )}
          >
            <ArrowRightLeft className="h-4 w-4" />
            转诊
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {showPrescription ? (
            <div className="flex flex-col gap-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="py-2 text-left font-medium">药品</th>
                    <th className="py-2 text-left font-medium">剂量</th>
                    <th className="py-2 text-left font-medium">用法</th>
                    <th className="py-2 text-left font-medium">疗程</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="py-2 pr-1">
                        <input
                          value={item.medicationName}
                          onChange={(e) => handlePrescriptionItemChange(index, 'medicationName', e.target.value)}
                          placeholder="药品名称"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#0A6EBD] focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          value={item.dosage}
                          onChange={(e) => handlePrescriptionItemChange(index, 'dosage', e.target.value)}
                          placeholder="剂量"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#0A6EBD] focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-1">
                        <input
                          value={item.usage}
                          onChange={(e) => handlePrescriptionItemChange(index, 'usage', e.target.value)}
                          placeholder="用法"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#0A6EBD] focus:outline-none"
                        />
                      </td>
                      <td className="py-2">
                        <input
                          value={item.duration}
                          onChange={(e) => handlePrescriptionItemChange(index, 'duration', e.target.value)}
                          placeholder="疗程"
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-[#0A6EBD] focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button variant="ghost" size="sm" onClick={handleAddPrescriptionItem} className="self-start">
                <Plus className="h-4 w-4" />
                添加药品
              </Button>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">备注</label>
                <textarea
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  placeholder="处方备注..."
                  rows={3}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
                />
              </div>
              <Button variant="primary" size="md" className="w-full" onClick={handleSavePrescription}>
                保存处方
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Select
                label="转诊专科医生"
                value={referralDoctorId}
                onChange={(e) => setReferralDoctorId(e.target.value)}
                options={specialistDoctors.map((d) => ({
                  value: d.id,
                  label: `${d.name} - ${d.department}（${d.title}）`,
                }))}
                placeholder="请选择专科医生"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">转诊原因</label>
                <textarea
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  placeholder="请输入转诊原因..."
                  rows={4}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
                />
              </div>
              <Button variant="primary" size="md" className="w-full">
                提交转诊
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
