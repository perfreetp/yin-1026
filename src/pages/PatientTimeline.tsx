import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Video,
  FileText,
  ClipboardList,
  Pill,
  ArrowRightLeft,
  Calendar,
  Stethoscope,
  Clock,
  LayoutDashboard,
  Bell,
} from 'lucide-react'
import { usePatient } from '@/hooks/usePatient'
import { useConsultationStore } from '@/stores/consultationStore'
import { usePatientStore } from '@/stores/patientStore'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatGender, getTagColor } from '@/utils/format'
import { getAge } from '@/utils/date'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type TimelineEventType = 'consultation' | 'record' | 'examination' | 'prescription' | 'referral' | 'followup'

interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  description: string
  date: string
  displayDate?: string
  link: string
  status?: string
  statusVariant?: 'success' | 'warning' | 'primary' | 'danger' | 'default'
  isFuture?: boolean
  hasDate?: boolean
}

const eventConfig: Record<TimelineEventType, { icon: React.ElementType; color: string; label: string }> = {
  consultation: { icon: Video, color: 'bg-green-500', label: '问诊' },
  record: { icon: FileText, color: 'bg-blue-500', label: '病历' },
  examination: { icon: ClipboardList, color: 'bg-purple-500', label: '检查' },
  prescription: { icon: Pill, color: 'bg-orange-500', label: '处方' },
  referral: { icon: ArrowRightLeft, color: 'bg-pink-500', label: '转诊' },
  followup: { icon: Calendar, color: 'bg-teal-500', label: '随访' },
}

const navLinks = [
  { label: '概览', path: '/overview', icon: LayoutDashboard },
  { label: '问诊室', path: '/consultation', icon: Stethoscope },
  { label: '病历', path: '/records', icon: FileText },
  { label: '检查资料', path: '/examinations', icon: ClipboardList },
  { label: '用药', path: '/medications', icon: Pill },
  { label: '随访计划', path: '/followup', icon: Calendar },
  { label: '消息', path: '/messages', icon: Bell, withPatientParam: true },
]

const consultationStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' | 'default' }> = {
  waiting: { label: '等待中', variant: 'warning' },
  active: { label: '进行中', variant: 'primary' },
  completed: { label: '已结束', variant: 'success' },
}

const followupStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' | 'danger' | 'default' }> = {
  active: { label: '待复诊', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  paused: { label: '已暂停', variant: 'default' },
  cancelled: { label: '已取消', variant: 'danger' },
  delayed: { label: '已延期', variant: 'warning' },
}

const referralStatusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'primary' | 'danger' | 'default' }> = {
  pending: { label: '待处理', variant: 'warning' },
  accepted: { label: '已接受', variant: 'primary' },
  completed: { label: '已完成', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'danger' },
}

export default function PatientTimeline() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const { patient, records, examinations, consultations, followupPlans, referrals } = usePatient(patientId || '')
  const prescriptions = useConsultationStore((s) => s.prescriptions)
  const doctors = usePatientStore((s) => s.doctors)

  const patientPrescriptions = useMemo(
    () => prescriptions.filter((p) => p.patientId === patientId),
    [prescriptions, patientId]
  )

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = []

    consultations.forEach((c) => {
      const doctor = doctors.find((d) => d.id === c.doctorId)
      const statusInfo = consultationStatusMap[c.status]
      const hasValidDate = c.startedAt && !isNaN(new Date(c.startedAt).getTime())
      const displayDate = hasValidDate ? c.startedAt : ''
      const sortDate = hasValidDate
        ? c.startedAt
        : new Date(Date.now() + 86400000 * 365).toISOString()
      events.push({
        id: c.id,
        type: 'consultation',
        title: `${c.type === 'video' ? '视频' : '文字'}问诊`,
        description: `${doctor?.name || '医生'} · ${statusInfo?.label || c.status}`,
        date: sortDate,
        displayDate,
        hasDate: hasValidDate,
        link: `/consultation/${patientId}?consultationId=${c.id}`,
        status: statusInfo?.label,
        statusVariant: statusInfo?.variant,
        isFuture: c.status === 'waiting',
      })
    })

    records.forEach((r) => {
      events.push({
        id: r.id,
        type: 'record',
        title: r.diagnosis,
        description: r.chiefComplaint || '创建病历记录',
        date: r.createdAt,
        link: `/records/${patientId}?recordId=${r.id}`,
        status: '已归档',
        statusVariant: 'success',
      })
    })

    examinations.forEach((e) => {
      events.push({
        id: e.id,
        type: 'examination',
        title: e.name,
        description: e.isAbnormal ? '⚠ 结果异常' : e.notes || '检查完成',
        date: e.date,
        link: `/examinations/${patientId}?examId=${e.id}`,
        status: e.isAbnormal ? '异常' : '正常',
        statusVariant: e.isAbnormal ? 'danger' : 'success',
      })
    })

    patientPrescriptions.forEach((p) => {
      const doctor = doctors.find((d) => d.id === p.doctorId)
      const medNames = p.items.map((i) => i.medicationName).join('、')
      events.push({
        id: p.id,
        type: 'prescription',
        title: '开具处方',
        description: `${doctor?.name || '医生'}：${medNames}`,
        date: p.createdAt,
        link: `/medications/${patientId}?prescriptionId=${p.id}`,
        status: '已开具',
        statusVariant: 'success',
      })
    })

    referrals.forEach((r) => {
      const toDoctor = doctors.find((d) => d.id === r.toDoctorId)
      const statusInfo = referralStatusMap[r.status]
      events.push({
        id: r.id,
        type: 'referral',
        title: '转诊至 ' + (toDoctor?.name || '专科医生'),
        description: r.reason.slice(0, 30),
        date: r.createdAt,
        link: `/consultation/${patientId}?referralId=${r.id}`,
        status: statusInfo?.label,
        statusVariant: statusInfo?.variant,
        isFuture: r.status === 'pending' || r.status === 'accepted',
      })
    })

    followupPlans.forEach((p) => {
      const statusInfo = followupStatusMap[p.status]
      const isFuture = p.status === 'active' || p.status === 'delayed'
      events.push({
        id: p.id,
        type: 'followup',
        title: `${p.frequency} 随访`,
        description: `${p.notes || '预约复诊'}${p.reminderTime ? ' · 提醒 ' + p.reminderTime : ''}`,
        date: isFuture ? p.nextDate : (p.actualDate || p.nextDate),
        link: `/followup/${patientId}?planId=${p.id}`,
        status: statusInfo?.label,
        statusVariant: statusInfo?.variant,
        isFuture,
      })
    })

    return events.sort((a, b) => {
      if (a.isFuture && !b.isFuture) return -1
      if (!a.isFuture && b.isFuture) return 1
      if (a.isFuture && b.isFuture) {
        if (!a.hasDate && b.hasDate) return -1
        if (a.hasDate && !b.hasDate) return 1
        if (!a.hasDate && !b.hasDate) return 0
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [consultations, records, examinations, patientPrescriptions, referrals, followupPlans, doctors, patientId])

  const futureEvents = useMemo(() => timelineEvents.filter((e) => e.isFuture), [timelineEvents])
  const pastEvents = useMemo(() => timelineEvents.filter((e) => !e.isFuture), [timelineEvents])

  const groupedPastEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {}
    pastEvents.forEach((event) => {
      const dateKey = formatDate(event.date)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(event)
    })
    return groups
  }, [pastEvents])

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        患者信息不存在
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4 shrink-0">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回患者列表
        </button>

        <div className="flex items-center gap-3">
          <Avatar src={patient.avatar} name={patient.name} size="lg" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-900">{patient.name}</span>
            <span className="text-xs text-gray-500">
              {formatGender(patient.gender)} · {getAge(patient.birthDate)}岁
            </span>
            <div className="flex flex-wrap gap-1">
              {patient.tags.map((tag) => (
                <span key={tag} className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getTagColor(tag))}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.withPatientParam ? `${link.path}?patientId=${patientId}` : `${link.path}/${patientId}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#0A6EBD]" />
            <h2 className="text-lg font-semibold text-gray-900">全程时间线</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            汇总 {patient.name} 的问诊、病历、检查、处方、转诊、随访记录
          </p>
        </div>

        <div className="flex-1 px-6 pb-6">
          {timelineEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Clock className="h-12 w-12 mb-3" />
              <span className="text-sm">暂无记录</span>
            </div>
          ) : (
            <div className="space-y-6">
              {futureEvents.length > 0 && (
                <div>
                  <div className="sticky top-0 z-10 bg-gray-50 py-2 flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#0A6EBD]" />
                    <span className="text-xs font-semibold text-[#0A6EBD] uppercase tracking-wider">
                      待办 / 未来事件（{futureEvents.length}）
                    </span>
                  </div>
                  <div className="relative ml-4 mt-2">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-blue-200" />
                    <div className="space-y-4">
                      {futureEvents.map((event) => {
                        const config = eventConfig[event.type]
                        const Icon = config.icon
                        return (
                          <Link
                            key={event.id}
                            to={event.link}
                            className="relative flex gap-4 pl-8 group"
                          >
                            <div className={cn(
                              'absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center ring-4 ring-blue-100',
                              config.color
                            )}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0 rounded-xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm group-hover:shadow-md group-hover:border-blue-200 group-hover:bg-blue-50 transition-all">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Badge variant="primary" className="shrink-0">
                                    {config.label}
                                  </Badge>
                                  <span className="text-sm font-medium text-gray-900 truncate">
                                    {event.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {event.status && (
                                    <Badge variant={event.statusVariant || 'default'}>
                                      {event.status}
                                    </Badge>
                                  )}
                                  <span className="text-xs font-medium text-[#0A6EBD]">
                                    {event.hasDate !== false ? formatDate(event.date) : '待安排时间'}
                                  </span>
                                </div>
                              </div>
                              <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                                {event.description}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="sticky top-0 z-10 bg-gray-50 py-2 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    历史记录（{pastEvents.length}）
                  </span>
                </div>
                <div className="relative ml-4 mt-2">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />
                  {Object.entries(groupedPastEvents).map(([dateKey, events]) => (
                    <div key={dateKey} className="mb-6">
                      <div className="sticky top-6 z-10 bg-gray-50 py-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {dateKey}
                        </span>
                      </div>
                      <div className="space-y-4 mt-2">
                        {events.map((event) => {
                          const config = eventConfig[event.type]
                          const Icon = config.icon
                          return (
                            <Link
                              key={event.id}
                              to={event.link}
                              className="relative flex gap-4 pl-8 group"
                            >
                              <div className={cn(
                                'absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center',
                                config.color
                              )}>
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm group-hover:shadow-md group-hover:border-gray-200 transition-all">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Badge variant="primary" className="shrink-0">
                                      {config.label}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                      {event.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {event.status && (
                                      <Badge variant={event.statusVariant || 'default'}>
                                        {event.status}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-gray-400">
                                      {event.hasDate !== false ? formatDateTime(event.date) : '—'}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
                                  {event.description}
                                </p>
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
