import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Bell,
  Video,
  ArrowRightLeft,
  Receipt,
  Star,
  AlertTriangle,
  CheckCheck,
  Mail,
  User,
  FileText,
  ClipboardList,
  Pill,
  Calendar,
  XCircle,
  CheckCircle2,
  CalendarClock,
  Filter,
  X,
} from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { useConsultationStore } from '@/stores/consultationStore'
import { usePatientStore } from '@/stores/patientStore'
import { useFollowupStore } from '@/stores/followupStore'
import { useMedicationStore } from '@/stores/medicationStore'
import { formatRelativeTime, formatDateTime, formatDate } from '@/utils/date'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import type { Notification, Referral, FollowupPlan } from '@/types'

type TabKey = 'all' | 'system' | 'consultation' | 'referral' | 'fee' | 'rating'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'system', label: '系统通知' },
  { key: 'consultation', label: '问诊消息' },
  { key: 'referral', label: '转诊通知' },
  { key: 'fee', label: '费用确认' },
  { key: 'rating', label: '服务评价' },
]

const typeIconMap: Record<Notification['type'], React.ElementType> = {
  system: Bell,
  consultation: Video,
  referral: ArrowRightLeft,
  fee: Receipt,
  rating: Star,
  alert: AlertTriangle,
}

const typeIconColorMap: Record<Notification['type'], string> = {
  system: 'text-blue-500 bg-blue-50',
  consultation: 'text-green-500 bg-green-50',
  referral: 'text-purple-500 bg-purple-50',
  fee: 'text-orange-500 bg-orange-50',
  rating: 'text-yellow-500 bg-yellow-50',
  alert: 'text-red-500 bg-red-50',
}

const typeLabelMap: Record<Notification['type'], string> = {
  system: '系统通知',
  consultation: '问诊消息',
  referral: '转诊通知',
  fee: '费用确认',
  rating: '服务评价',
  alert: '异常提醒',
}

const typeBadgeVariantMap: Record<Notification['type'], 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
  system: 'default',
  consultation: 'success',
  referral: 'primary',
  fee: 'warning',
  rating: 'primary',
  alert: 'danger',
}

const ratingTags = ['态度好', '专业', '耐心', '响应及时', '建议有用']

const referralStatusMap: Record<Referral['status'], { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  pending: { label: '待处理', variant: 'warning' },
  accepted: { label: '已接受', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
}

const planStatusMap: Record<FollowupPlan['status'], { label: string; variant: 'primary' | 'success' | 'warning' | 'danger' | 'default' }> = {
  active: { label: '待复诊', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  paused: { label: '已暂停', variant: 'default' },
  cancelled: { label: '已取消', variant: 'danger' },
  delayed: { label: '已延期', variant: 'warning' },
}

export default function Messages() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const urlPatientId = searchParams.get('patientId')

  const { notifications, feeRecords, markAsRead, markAllAsRead, confirmFee, addRating, addNotification } = useNotificationStore()
  const consultations = useConsultationStore((s) => s.consultations)
  const prescriptions = useConsultationStore((s) => s.prescriptions)
  const patients = usePatientStore((s) => s.patients)
  const medicalRecords = usePatientStore((s) => s.medicalRecords)
  const examinations = usePatientStore((s) => s.examinations)
  const medications = useMedicationStore((s) => s.medications)
  const followupPlans = useFollowupStore((s) => s.plans)
  const referrals = usePatientStore((s) => s.referrals)
  const updateReferral = usePatientStore((s) => s.updateReferral)
  const updatePlan = useFollowupStore((s) => s.updatePlan)

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [ratingForm, setRatingForm] = useState({ rating: 0, tags: [] as string[], comment: '' })
  const [filterPatientId, setFilterPatientId] = useState<string>('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [targetReferralId, setTargetReferralId] = useState<string | null>(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [planAction, setPlanAction] = useState<'complete' | 'delay' | 'cancel' | null>(null)
  const [targetPlanId, setTargetPlanId] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState({ actualDate: '', nextDate: '', note: '' })

  useEffect(() => {
    if (urlPatientId) {
      setFilterPatientId(urlPatientId)
    }
  }, [urlPatientId])

  const patientOptions = useMemo(() => {
    return patients.map((p) => ({ value: p.id, label: p.name }))
  }, [patients])

  const resolvePatientId = (notif: Notification): string | null => {
    if (notif.userId.startsWith('pat-')) return notif.userId
    if (notif.type === 'consultation' && notif.relatedId) {
      const consultation = consultations.find((c) => c.id === notif.relatedId)
      if (consultation) return consultation.patientId
    }
    if (notif.type === 'referral' && notif.relatedId) {
      const referral = referrals.find((r) => r.id === notif.relatedId)
      if (referral) return referral.patientId
    }
    if (notif.type === 'fee' && notif.relatedId) {
      const fee = feeRecords.find((f) => f.id === notif.relatedId)
      if (fee) return fee.patientId
    }
    return null
  }

  const resolveReferralId = (notif: Notification): string | null => {
    if (notif.type === 'referral' && notif.relatedId) {
      return notif.relatedId
    }
    return null
  }

  const resolvePlanId = (notif: Notification): string | null => {
    if (notif.type === 'consultation' && notif.relatedId?.startsWith('fp-')) {
      return notif.relatedId
    }
    const pId = resolvePatientId(notif)
    if (pId && (notif.title.includes('复诊') || notif.title.includes('随访'))) {
      const patientPlans = followupPlans.filter((p) => p.patientId === pId).sort((a, b) =>
        new Date(b.nextDate).getTime() - new Date(a.nextDate).getTime()
      )
      if (patientPlans.length > 0) return patientPlans[0].id
    }
    return null
  }

  const filteredNotifications = useMemo(() => {
    let result = notifications
    if (activeTab !== 'all') {
      result = result.filter((n) => n.type === activeTab)
    }
    if (filterPatientId) {
      result = result.filter((n) => resolvePatientId(n) === filterPatientId)
    }
    return result
  }, [notifications, activeTab, filterPatientId])

  const selectedMessage = notifications.find((n) => n.id === selectedMessageId) || null

  const selectedPatientId = selectedMessage ? resolvePatientId(selectedMessage) : null
  const selectedPatient = selectedPatientId ? patients.find((p) => p.id === selectedPatientId) : null

  const relatedRecords = useMemo(() => {
    if (!selectedPatientId) return null
    return {
      consultations: consultations.filter((c) => c.patientId === selectedPatientId).slice(0, 3),
      records: medicalRecords.filter((r) => r.patientId === selectedPatientId).slice(0, 3),
      examinations: examinations.filter((e) => e.patientId === selectedPatientId).slice(0, 3),
      medications: medications.filter((m) => m.patientId === selectedPatientId && m.status === 'active').slice(0, 3),
      plans: followupPlans.filter((p) => p.patientId === selectedPatientId).slice(0, 3),
    }
  }, [selectedPatientId, consultations, medicalRecords, examinations, medications, followupPlans])

  const relatedFeeRecord = selectedMessage?.type === 'fee' && selectedMessage.relatedId
    ? feeRecords.find((f) => f.id === selectedMessage.relatedId)
    : null

  const relatedReferralId = selectedMessage ? resolveReferralId(selectedMessage) : null
  const relatedReferral = relatedReferralId ? referrals.find((r) => r.id === relatedReferralId) : null

  const relatedPlanId = selectedMessage ? resolvePlanId(selectedMessage) : null
  const relatedPlan = relatedPlanId ? followupPlans.find((p) => p.id === relatedPlanId) : null

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id)
    markAsRead(id)
  }

  const handleSubmitRating = () => {
    if (!selectedMessage?.relatedId || ratingForm.rating === 0) return
    addRating({
      id: `rating-${Date.now()}`,
      patientId: selectedMessage.userId,
      consultationId: selectedMessage.relatedId,
      rating: ratingForm.rating as 1 | 2 | 3 | 4 | 5,
      comment: ratingForm.comment,
      tags: ratingForm.tags,
      createdAt: new Date().toISOString(),
    })
    setRatingForm({ rating: 0, tags: [], comment: '' })
  }

  const handleToggleTag = (tag: string) => {
    setRatingForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleAcceptReferral = () => {
    if (!relatedReferralId) return
    updateReferral(relatedReferralId, { status: 'accepted' })
    addNotification({
      id: `notif-${Date.now()}`,
      userId: selectedPatientId || '',
      type: 'referral',
      title: '转诊已接受',
      content: `您的转诊申请已被专科医生接受${relatedReferral?.reason ? '：' + relatedReferral.reason.slice(0, 30) : ''}`,
      isRead: false,
      relatedId: relatedReferralId,
      createdAt: new Date().toISOString(),
    })
  }

  const handleOpenRejectReferral = () => {
    if (!relatedReferralId) return
    setTargetReferralId(relatedReferralId)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleConfirmReject = () => {
    if (!targetReferralId) return
    updateReferral(targetReferralId, { status: 'rejected' })
    addNotification({
      id: `notif-${Date.now()}`,
      userId: selectedPatientId || '',
      type: 'referral',
      title: '转诊已拒绝',
      content: `您的转诊申请未被接受${rejectReason ? '，原因：' + rejectReason : ''}`,
      isRead: false,
      relatedId: targetReferralId,
      createdAt: new Date().toISOString(),
    })
    setShowRejectModal(false)
    setTargetReferralId(null)
    setRejectReason('')
  }

  const handleOpenPlanAction = (action: 'complete' | 'delay' | 'cancel') => {
    if (!relatedPlanId) return
    setTargetPlanId(relatedPlanId)
    setPlanAction(action)
    const today = new Date().toISOString().slice(0, 10)
    setPlanForm({
      actualDate: today,
      nextDate: relatedPlan?.nextDate?.slice(0, 10) || '',
      note: '',
    })
    setShowPlanModal(true)
  }

  const handleConfirmPlanAction = () => {
    if (!targetPlanId || !planAction) return
    const pId = selectedPatientId || ''
    if (planAction === 'complete') {
      updatePlan(targetPlanId, { status: 'completed', actualDate: planForm.actualDate })
      addNotification({
        id: `notif-${Date.now()}`,
        userId: pId,
        type: 'consultation',
        title: '复诊完成',
        content: `您${formatDate(planForm.actualDate)}的复诊已完成，后续请关注健康状态。`,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    } else if (planAction === 'delay') {
      if (!planForm.nextDate) return
      const cur = followupPlans.find((p) => p.id === targetPlanId)
      const notes = [cur?.notes, planForm.note ? `延期原因：${planForm.note}` : ''].filter(Boolean).join('；')
      updatePlan(targetPlanId, { status: 'delayed', nextDate: planForm.nextDate, notes: notes || undefined })
      addNotification({
        id: `notif-${Date.now()}`,
        userId: pId,
        type: 'consultation',
        title: '复诊时间调整',
        content: `您的复诊时间已调整为${formatDate(planForm.nextDate)}${planForm.note ? '，原因：' + planForm.note : ''}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    } else if (planAction === 'cancel') {
      const cur = followupPlans.find((p) => p.id === targetPlanId)
      const notes = [cur?.notes, planForm.note ? `取消原因：${planForm.note}` : ''].filter(Boolean).join('；')
      updatePlan(targetPlanId, { status: 'cancelled', notes: notes || undefined })
      addNotification({
        id: `notif-${Date.now()}`,
        userId: pId,
        type: 'system',
        title: '复诊取消',
        content: `您原定于${formatDate(cur?.nextDate || '')}的复诊已取消${planForm.note ? '，原因：' + planForm.note : ''}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      })
    }
    setShowPlanModal(false)
    setTargetPlanId(null)
    setPlanAction(null)
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900">消息中心</h1>
          {filterPatientId && (
            <div className="flex items-center gap-1 rounded-full bg-[#0A6EBD]/10 text-[#0A6EBD] px-2.5 py-1 text-xs font-medium">
              <Filter className="h-3 w-3" />
              仅看 {patients.find((p) => p.id === filterPatientId)?.name || '该患者'}
              <button
                onClick={() => setFilterPatientId('')}
                className="hover:bg-[#0A6EBD]/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterPatientId}
            onChange={(e) => setFilterPatientId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
          >
            <option value="">全部患者</option>
            {patientOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4" />
            全部已读
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedMessageId(null) }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
              activeTab === tab.key
                ? 'text-[#0A6EBD] border-[#0A6EBD]'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="flex flex-col items-center gap-2">
                <Mail className="h-10 w-10" />
                <span className="text-sm">暂无消息</span>
                {filterPatientId && (
                  <span className="text-xs text-gray-300">尝试清除患者筛选</span>
                )}
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const Icon = typeIconMap[notif.type]
              const iconColor = typeIconColorMap[notif.type]
              const notifPatientId = resolvePatientId(notif)
              const notifPatient = notifPatientId ? patients.find((p) => p.id === notifPatientId) : null
              return (
                <div
                  key={notif.id}
                  onClick={() => handleSelectMessage(notif.id)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors',
                    selectedMessageId === notif.id ? 'bg-[#0A6EBD]/5' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconColor)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    {!notif.isRead && (
                      <span className="absolute -top-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', notif.isRead ? 'font-medium' : 'font-semibold text-gray-900')}>
                        {notif.title}
                      </span>
                      <span className="flex-shrink-0 text-xs text-gray-400">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-500">{notif.content}</p>
                    {notifPatient && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{notifPatient.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex-1 bg-white overflow-y-auto">
          {!selectedMessage ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <Mail className="h-12 w-12" />
                <span className="text-sm">选择一条消息查看详情</span>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.title}</h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-400">{formatDateTime(selectedMessage.createdAt)}</span>
                  <Badge variant={typeBadgeVariantMap[selectedMessage.type]}>
                    {typeLabelMap[selectedMessage.type]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedMessage.content}</p>

                {selectedPatient && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Link
                      to={`/overview/${selectedPatient.id}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <Avatar src={selectedPatient.avatar} name={selectedPatient.name} size="sm" />
                      <span className="text-sm font-medium text-gray-900">{selectedPatient.name}</span>
                      <span className="text-xs text-gray-500">查看概览 →</span>
                    </Link>
                    <Link
                      to={`/timeline/${selectedPatient.id}`}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[#0A6EBD] border border-[#0A6EBD]/20 bg-[#0A6EBD]/5 hover:bg-[#0A6EBD]/10 transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      时间线
                    </Link>
                  </div>
                )}

                {selectedMessage.type === 'fee' && relatedFeeRecord && (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">费用明细</h3>
                      <Badge variant={
                        relatedFeeRecord.status === 'confirmed' ? 'success'
                          : relatedFeeRecord.status === 'disputed' ? 'warning'
                            : 'primary'
                      }>
                        {relatedFeeRecord.status === 'confirmed' ? '已确认'
                          : relatedFeeRecord.status === 'disputed' ? '异议处理中'
                            : '待确认'}
                      </Badge>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-500">
                          <th className="py-2 text-left font-medium">项目</th>
                          <th className="py-2 text-right font-medium">金额</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relatedFeeRecord.items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 text-gray-700">{item.name}</td>
                            <td className="py-2 text-right text-gray-700">¥{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200">
                          <td className="py-2 font-semibold text-gray-900">合计</td>
                          <td className="py-2 text-right font-semibold text-gray-900">¥{relatedFeeRecord.amount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                    {relatedFeeRecord.status === 'pending' && (
                      <div className="mt-4 flex gap-3 flex-wrap">
                        <Button size="sm" onClick={() => {
                          confirmFee(relatedFeeRecord.id)
                          addNotification({
                            id: `notif-${Date.now()}`,
                            userId: selectedPatientId || '',
                            type: 'fee',
                            title: '费用已确认',
                            content: `您的服务费用¥${relatedFeeRecord.amount.toFixed(2)}已确认。`,
                            isRead: false,
                            relatedId: relatedFeeRecord.id,
                            createdAt: new Date().toISOString(),
                          })
                        }}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          确认费用
                        </Button>
                        <Button variant="danger" size="sm">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          异议申诉
                        </Button>
                      </div>
                    )}
                    {relatedFeeRecord.status === 'confirmed' && (
                      <p className="mt-3 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        费用已确认
                      </p>
                    )}
                    {relatedFeeRecord.status === 'disputed' && (
                      <p className="mt-3 text-sm text-orange-600">异议处理中</p>
                    )}
                  </div>
                )}

                {selectedMessage.type === 'rating' && (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">服务评价</h3>
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingForm((prev) => ({ ...prev, rating: star }))}
                          className="p-0.5 transition-colors"
                        >
                          <Star
                            className={cn(
                              'h-7 w-7',
                              star <= ratingForm.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {ratingTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleToggleTag(tag)}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                            ratingForm.tags.includes(tag)
                              ? 'bg-[#0A6EBD] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={ratingForm.comment}
                      onChange={(e) => setRatingForm((prev) => ({ ...prev, comment: e.target.value }))}
                      placeholder="请输入您的评价..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
                    />
                    <div className="mt-3">
                      <Button size="sm" onClick={handleSubmitRating} disabled={ratingForm.rating === 0}>
                        提交评价
                      </Button>
                    </div>
                  </div>
                )}

                {selectedMessage.type === 'referral' && relatedReferral && (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">转诊状态</h3>
                      <Badge variant={referralStatusMap[relatedReferral.status].variant}>
                        {referralStatusMap[relatedReferral.status].label}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0 mb-4">
                      {[
                        { label: '提交转诊', done: true },
                        { label: '专科接收', done: ['accepted', 'completed'].includes(relatedReferral.status) },
                        { label: '诊疗完成', done: relatedReferral.status === 'completed' },
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'h-3 w-3 rounded-full border-2',
                              step.done ? 'bg-[#0A6EBD] border-[#0A6EBD]' : 'bg-white border-gray-300'
                            )} />
                            {i < 2 && <div className={cn('w-0.5 h-6', step.done ? 'bg-[#0A6EBD]' : 'bg-gray-200')} />}
                          </div>
                          <span className={cn('text-sm', step.done ? 'text-gray-900' : 'text-gray-400')}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {relatedReferral.reason && (
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-600 mb-3">
                        <span className="font-medium text-gray-700">转诊原因：</span>
                        {relatedReferral.reason}
                      </div>
                    )}
                    {relatedReferral.specialistOpinion && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-700">
                        <span className="font-medium">专科意见：</span>
                        {relatedReferral.specialistOpinion}
                      </div>
                    )}
                    {relatedReferral.status === 'pending' && (
                      <div className="mt-4 flex gap-3 flex-wrap">
                        <Button size="sm" variant="success" onClick={handleAcceptReferral}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          接受转诊
                        </Button>
                        <Button size="sm" variant="danger" onClick={handleOpenRejectReferral}>
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          拒绝
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {selectedMessage.type === 'alert' && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-semibold text-red-700">异常指标提醒</h3>
                        <p className="mt-1 text-sm text-red-600">{selectedMessage.content}</p>
                        <p className="mt-2 text-xs text-red-400">请及时关注并安排就诊</p>
                      </div>
                    </div>
                    {selectedPatientId && (
                      <div className="mt-4">
                        <Link to={`/followup/${selectedPatientId}`}>
                          <Button size="sm" variant="danger">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            查看异常预警
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {(selectedMessage.type === 'consultation') && (
                  <div className="mt-4 flex flex-col gap-4">
                    {relatedPlan && (
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">关联随访计划</h3>
                          <Badge variant={planStatusMap[relatedPlan.status].variant}>
                            {planStatusMap[relatedPlan.status].label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <span className="text-xs text-gray-500">下次复诊</span>
                            <p className="text-gray-900 font-medium">{formatDate(relatedPlan.nextDate)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">随访频率</span>
                            <p className="text-gray-900 font-medium">{relatedPlan.frequency}</p>
                          </div>
                          {relatedPlan.reminderTime && (
                            <div>
                              <span className="text-xs text-gray-500">提醒时间</span>
                              <p className="text-gray-900 font-medium">{relatedPlan.reminderTime}</p>
                            </div>
                          )}
                          {relatedPlan.actualDate && (
                            <div>
                              <span className="text-xs text-gray-500">实际完成</span>
                              <p className="text-gray-900 font-medium">{formatDate(relatedPlan.actualDate)}</p>
                            </div>
                          )}
                        </div>
                        {relatedPlan.notes && (
                          <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                            备注：{relatedPlan.notes}
                          </p>
                        )}
                        {['active', 'delayed'].includes(relatedPlan.status) && (
                          <div className="mt-4 flex gap-2 flex-wrap">
                            <Button size="sm" variant="success" onClick={() => handleOpenPlanAction('complete')}>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              标记完成
                            </Button>
                            <Button size="sm" variant="warning" onClick={() => handleOpenPlanAction('delay')}>
                              <CalendarClock className="h-3.5 w-3.5 mr-1" />
                              延期
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleOpenPlanAction('cancel')}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              取消
                            </Button>
                            {selectedPatientId && (
                              <Link to={`/followup/${selectedPatientId}?planId=${relatedPlan.id}`}>
                                <Button size="sm" variant="ghost">
                                  详情
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedMessage.relatedId && (
                        (() => {
                          const consultation = consultations.find((c) => c.id === selectedMessage.relatedId)
                          const targetPatientId = consultation?.patientId || selectedPatientId
                          if (!targetPatientId) return null
                          return (
                            <Link to={`/consultation/${targetPatientId}`}>
                              <Button size="sm">
                                <Video className="h-3.5 w-3.5 mr-1" />
                                进入问诊室
                              </Button>
                            </Link>
                          )
                        })()
                      )}
                      {!selectedMessage.relatedId && selectedPatientId && (
                        <Link to={`/consultation/${selectedPatientId}`}>
                          <Button size="sm">
                            <Video className="h-3.5 w-3.5 mr-1" />
                            发起问诊
                          </Button>
                        </Link>
                      )}
                      {selectedPatientId && (
                        <Link to={`/overview/${selectedPatientId}`}>
                          <Button variant="ghost" size="sm">
                            返回概览
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedPatientId && relatedRecords && (
                <div className="w-72 border-l border-gray-100 bg-gray-50/50 overflow-y-auto p-4 shrink-0">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">关联记录</span>
                  </div>

                  {relatedRecords.consultations.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-400">问诊记录</span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {relatedRecords.consultations.map((c) => (
                          <Link
                            key={c.id}
                            to={`/consultation/${selectedPatientId}?consultationId=${c.id}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:border-[#0A6EBD]/30 transition-colors"
                          >
                            <Video className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            <span className="truncate text-gray-700">{c.type === 'video' ? '视频' : '文字'}问诊</span>
                            <span className="ml-auto text-xs text-gray-400 shrink-0">{formatDate(c.startedAt)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedRecords.records.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-400">病历记录</span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {relatedRecords.records.map((r) => (
                          <Link
                            key={r.id}
                            to={`/records/${selectedPatientId}?recordId=${r.id}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:border-[#0A6EBD]/30 transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="truncate text-gray-700">{r.diagnosis}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedRecords.examinations.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-400">检查资料</span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {relatedRecords.examinations.map((e) => (
                          <Link
                            key={e.id}
                            to={`/examinations/${selectedPatientId}?examId=${e.id}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:border-[#0A6EBD]/30 transition-colors"
                          >
                            <ClipboardList className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                            <span className="truncate text-gray-700">{e.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedRecords.medications.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-400">当前用药</span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {relatedRecords.medications.map((m) => (
                          <Link
                            key={m.id}
                            to={`/medications/${selectedPatientId}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:border-[#0A6EBD]/30 transition-colors"
                          >
                            <Pill className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                            <span className="truncate text-gray-700">{m.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedRecords.plans.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-gray-400">随访计划</span>
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        {relatedRecords.plans.map((p) => (
                          <Link
                            key={p.id}
                            to={`/followup/${selectedPatientId}?planId=${p.id}`}
                            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm hover:border-[#0A6EBD]/30 transition-colors"
                          >
                            <Calendar className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-gray-700 text-xs">{formatDate(p.nextDate)}</span>
                              <Badge variant={planStatusMap[p.status].variant} className="w-fit">
                                {planStatusMap[p.status].label}
                              </Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {relatedRecords.consultations.length === 0 &&
                   relatedRecords.records.length === 0 &&
                   relatedRecords.examinations.length === 0 &&
                   relatedRecords.medications.length === 0 &&
                   relatedRecords.plans.length === 0 && (
                    <p className="text-xs text-gray-400">暂无关联记录</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="拒绝转诊"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>取消</Button>
            <Button variant="danger" onClick={handleConfirmReject}>确认拒绝</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            拒绝转诊将通知患者和基层医生，请填写原因。
          </div>
          <Input
            label="拒绝原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="如：该患者情况无需专科..."
          />
        </div>
      </Modal>

      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={
          planAction === 'complete' ? '标记复诊完成'
            : planAction === 'delay' ? '延期复诊'
              : '取消复诊'
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowPlanModal(false)}>返回</Button>
            <Button
              variant={planAction === 'complete' ? 'success' : planAction === 'delay' ? 'warning' : 'danger'}
              onClick={handleConfirmPlanAction}
              disabled={planAction === 'delay' && !planForm.nextDate}
            >
              {planAction === 'complete' ? '确认完成' : planAction === 'delay' ? '确认延期' : '确认取消'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {planAction === 'complete' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">实际复诊日期</label>
              <input
                type="date"
                value={planForm.actualDate}
                onChange={(e) => setPlanForm((p) => ({ ...p, actualDate: e.target.value }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
              />
            </div>
          )}
          {planAction === 'delay' && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">新的复诊日期</label>
              <input
                type="date"
                value={planForm.nextDate}
                onChange={(e) => setPlanForm((p) => ({ ...p, nextDate: e.target.value }))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
              />
            </div>
          )}
          {planAction === 'complete' && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              完成后患者会收到通知。
            </div>
          )}
          {planAction === 'cancel' && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              取消后后续如需复诊需重新安排。
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">备注{planAction !== 'complete' ? '（选填）' : '（选填）'}</label>
            <textarea
              value={planForm.note}
              onChange={(e) => setPlanForm((p) => ({ ...p, note: e.target.value }))}
              placeholder={
                planAction === 'complete' ? '本次复诊小结...'
                  : planAction === 'delay' ? '延期原因...'
                    : '取消原因...'
              }
              rows={3}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
