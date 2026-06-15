import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Video,
  Calendar,
  Bell,
  ClipboardList,
  FileText,
  ArrowRight,
  Pill,
  ArrowRightLeft,
  CheckCircle2,
  Clock as ClockIcon,
  XCircle,
  Stethoscope,
} from 'lucide-react'
import { usePatient } from '@/hooks/usePatient'
import { useNotificationStore } from '@/stores/notificationStore'
import { useConsultationStore } from '@/stores/consultationStore'
import { useFollowupStore } from '@/stores/followupStore'
import { usePatientStore } from '@/stores/patientStore'
import { formatDate, formatDateTime } from '@/utils/date'
import { formatGender, getTagColor } from '@/utils/format'
import { getAge } from '@/utils/date'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

const navLinks = [
  { label: '时间线', path: '/timeline', icon: ClockIcon },
  { label: '问诊室', path: '/consultation', icon: Stethoscope },
  { label: '病历', path: '/records', icon: FileText },
  { label: '检查资料', path: '/examinations', icon: ClipboardList },
  { label: '用药', path: '/medications', icon: Pill },
  { label: '随访计划', path: '/followup', icon: Calendar },
  { label: '消息', path: '/messages', icon: Bell, withPatientParam: true },
]

interface TodoItem {
  id: string
  type: 'consultation' | 'followup' | 'referral' | 'fee' | 'questionnaire'
  title: string
  description: string
  deadline?: string
  priority: 'high' | 'medium' | 'low'
  link: string
  done: boolean
}

const riskLevelMap = {
  high: { label: '高风险', variant: 'danger' as const, color: 'bg-red-50 border-red-200 text-red-700' },
  medium: { label: '中风险', variant: 'warning' as const, color: 'bg-amber-50 border-amber-200 text-amber-700' },
  low: { label: '低风险', variant: 'success' as const, color: 'bg-green-50 border-green-200 text-green-700' },
}

export default function PatientOverview() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const { patient, records, examinations, consultations, followupPlans, referrals, medications } = usePatient(patientId || '')
  const { notifications, feeRecords } = useNotificationStore()
  const { getQuestionnairesByPatient } = useFollowupStore()
  const { getAbnormalCount } = usePatientStore()

  const patientNotifications = useMemo(
    () => notifications.filter((n) => {
      if (n.userId === patientId) return true
      return false
    }),
    [notifications, patientId]
  )

  const unreadNotifications = useMemo(
    () => patientNotifications.filter((n) => !n.isRead).slice(0, 5),
    [patientNotifications]
  )

  const abnormalIndicators = useMemo(
    () => getAbnormalCount(patientId || ''),
    [getAbnormalCount, patientId]
  )

  const patientQuestionnaires = useMemo(
    () => getQuestionnairesByPatient(patientId || ''),
    [getQuestionnairesByPatient, patientId]
  )

  const patientFees = useMemo(
    () => feeRecords.filter((f) => f.patientId === patientId),
    [feeRecords, patientId]
  )

  const riskLevel = useMemo(() => {
    if (abnormalIndicators >= 3) return 'high'
    if (abnormalIndicators >= 1) return 'medium'
    const waitingReferral = referrals.find((r) => r.status === 'pending')
    const pendingFee = patientFees.find((f) => f.status === 'pending')
    if (waitingReferral || pendingFee) return 'medium'
    return 'low'
  }, [abnormalIndicators, referrals, patientFees])

  const recentConsultation = useMemo(
    () => [...consultations].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null,
    [consultations]
  )

  const waitingConsultations = useMemo(
    () => consultations.filter((c) => c.status === 'waiting'),
    [consultations]
  )

  const nextFollowup = useMemo(() => {
    const active = followupPlans.filter((p) => p.status === 'active')
    if (active.length === 0) return null
    return active.sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())[0]
  }, [followupPlans])

  const pendingQuestionnaires = useMemo(
    () => patientQuestionnaires.filter((q) => q.status === 'pending'),
    [patientQuestionnaires]
  )

  const pendingReferrals = useMemo(
    () => referrals.filter((r) => r.status === 'pending'),
    [referrals]
  )

  const pendingFees = useMemo(
    () => patientFees.filter((f) => f.status === 'pending'),
    [patientFees]
  )

  const todos: TodoItem[] = useMemo(() => {
    const items: TodoItem[] = []
    waitingConsultations.forEach((c) => {
      items.push({
        id: `todo-cons-${c.id}`,
        type: 'consultation',
        title: '待处理问诊',
        description: `${c.type === 'video' ? '视频' : '文字'}问诊等待开始`,
        deadline: c.startedAt,
        priority: 'high',
        link: `/consultation/${patientId}`,
        done: false,
      })
    })
    pendingReferrals.forEach((r) => {
      items.push({
        id: `todo-ref-${r.id}`,
        type: 'referral',
        title: '待跟进转诊',
        description: r.reason.slice(0, 30),
        deadline: r.createdAt,
        priority: 'high',
        link: `/consultation/${patientId}`,
        done: false,
      })
    })
    pendingFees.forEach((f) => {
      items.push({
        id: `todo-fee-${f.id}`,
        type: 'fee',
        title: '待确认费用',
        description: `金额 ¥${f.amount}，共 ${f.items.length} 项`,
        deadline: f.createdAt,
        priority: 'medium',
        link: `/messages?patientId=${patientId}`,
        done: false,
      })
    })
    pendingQuestionnaires.forEach((q) => {
      items.push({
        id: `todo-q-${q.id}`,
        type: 'questionnaire',
        title: '待审阅随访问卷',
        description: q.title,
        deadline: q.createdAt,
        priority: 'medium',
        link: `/followup/${patientId}`,
        done: false,
      })
    })
    if (nextFollowup) {
      const daysToFollowup = Math.ceil((new Date(nextFollowup.nextDate).getTime() - Date.now()) / 86400000)
      if (daysToFollowup <= 7 && daysToFollowup >= 0) {
        items.push({
          id: `todo-fu-${nextFollowup.id}`,
          type: 'followup',
          title: daysToFollowup === 0 ? '今日复诊' : `${daysToFollowup}天后复诊`,
          description: `${nextFollowup.frequency}${nextFollowup.notes ? ' · ' + nextFollowup.notes : ''}`,
          deadline: nextFollowup.nextDate,
          priority: daysToFollowup <= 2 ? 'high' : 'medium',
          link: `/followup/${patientId}`,
          done: false,
        })
      }
    }
    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [waitingConsultations, pendingReferrals, pendingFees, pendingQuestionnaires, nextFollowup, patientId])

  const [localTodos, setLocalTodos] = useState<TodoItem[]>(todos)

  const toggleTodo = (id: string) => {
    setLocalTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
  }

  const risk = riskLevelMap[riskLevel]
  const riskDetails: string[] = []
  if (abnormalIndicators > 0) riskDetails.push(`${abnormalIndicators} 项指标异常`)
  if (pendingReferrals.length > 0) riskDetails.push(`${pendingReferrals.length} 个待跟进转诊`)
  if (pendingFees.length > 0) riskDetails.push(`${pendingFees.length} 笔待确认费用`)
  if (riskDetails.length === 0) riskDetails.push('病情平稳，定期随访')

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        患者信息不存在
      </div>
    )
  }

  const priorityMap: Record<TodoItem['priority'], { color: string; dot: string }> = {
    high: { color: 'text-red-600', dot: 'bg-red-500' },
    medium: { color: 'text-amber-600', dot: 'bg-amber-500' },
    low: { color: 'text-gray-500', dot: 'bg-gray-400' },
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
        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">患者概览</h2>
              <p className="mt-1 text-sm text-gray-500">
                {patient.name} · 最近更新 {formatDateTime(patient.updatedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/timeline/${patientId}`)}>
                <ClockIcon className="h-4 w-4 mr-1" />
                时间线
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate(`/consultation/${patientId}`)}>
                <Video className="h-4 w-4 mr-1" />
                发起问诊
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          <Card
            className={cn('border cursor-pointer hover:shadow-md transition-shadow', risk.color)}
            onClick={() => navigate(`/followup/${patientId}?tab=alert`)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-semibold">当前风险：{risk.label}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {riskDetails.map((d) => (
                    <span key={d} className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-white/60 border border-white/70">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium shrink-0">
                查看预警
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Link to={`/consultation/${patientId}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                      <Video className="h-3.5 w-3.5" />
                      最近问诊
                    </div>
                    {recentConsultation ? (
                      <>
                        <div className="text-sm font-semibold text-gray-900">
                          {recentConsultation.type === 'video' ? '视频问诊' : '文字问诊'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDateTime(recentConsultation.startedAt)}
                        </div>
                        <div className="mt-2">
                          <Badge variant={
                            recentConsultation.status === 'completed' ? 'success'
                              : recentConsultation.status === 'active' ? 'primary'
                                : 'warning'
                          }>
                            {recentConsultation.status === 'completed' ? '已完成'
                              : recentConsultation.status === 'active' ? '进行中'
                                : '等待中'}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">暂无问诊记录</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                </div>
              </Link>
            </Card>

            <Card>
              <Link to={`/followup/${patientId}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                      <Calendar className="h-3.5 w-3.5" />
                      下次随访
                    </div>
                    {nextFollowup ? (
                      <>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatDate(nextFollowup.nextDate)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{nextFollowup.frequency}</div>
                        {nextFollowup.reminderTime && (
                          <div className="text-xs text-[#0A6EBD] mt-1">
                            提醒：{nextFollowup.reminderTime}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">暂未安排随访</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                </div>
              </Link>
            </Card>

            <Card>
              <Link to={`/messages?patientId=${patientId}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                      <Bell className="h-3.5 w-3.5" />
                      未读消息
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {unreadNotifications.length} 条
                    </div>
                    {unreadNotifications.length > 0 ? (
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {unreadNotifications[0].title}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1">暂无未读</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                </div>
              </Link>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#0A6EBD]" />
                <h3 className="text-sm font-semibold text-gray-900">待处理事项</h3>
                <Badge variant="primary">
                  {localTodos.filter((t) => !t.done).length}
                </Badge>
              </div>
              <span className="text-xs text-gray-400">
                {localTodos.filter((t) => t.done).length} / {localTodos.length} 已完成
              </span>
            </div>

            {localTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-400" />
                <span className="text-sm">全部事项已处理完成 🎉</span>
              </div>
            ) : (
              <div className="space-y-2">
                {localTodos.map((todo) => {
                  const p = priorityMap[todo.priority]
                  return (
                    <Link
                      key={todo.id}
                      to={todo.link}
                      onClick={(e) => {
                        e.preventDefault()
                        toggleTodo(todo.id)
                        setTimeout(() => navigate(todo.link), 150)
                      }}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-all group',
                        todo.done
                          ? 'border-gray-100 bg-gray-50 opacity-60'
                          : 'border-gray-200 bg-white hover:border-[#0A6EBD]/30 hover:shadow-sm cursor-pointer'
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          toggleTodo(todo.id)
                        }}
                        className={cn(
                          'h-5 w-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-colors',
                          todo.done
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 group-hover:border-[#0A6EBD]'
                        )}
                      >
                        {todo.done && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <div className={`w-1.5 h-1.5 rounded-full ${p.dot} mt-2 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', todo.done ? 'text-gray-400 line-through' : 'text-gray-900')}>
                          {todo.title}
                        </div>
                        <div className={cn('text-xs mt-0.5 truncate', todo.done ? 'text-gray-400' : 'text-gray-500')}>
                          {todo.description}
                        </div>
                        {todo.deadline && !todo.done && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3" />
                            {formatDateTime(todo.deadline)}
                          </div>
                        )}
                      </div>
                      <ArrowRight className={cn('h-4 w-4 shrink-0 mt-0.5', todo.done ? 'text-gray-300' : 'text-gray-400 group-hover:text-[#0A6EBD]')} />
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-900">最近病历</h3>
                </div>
                <Link to={`/records/${patientId}`} className="text-xs text-[#0A6EBD] hover:underline">
                  全部
                </Link>
              </div>
              {records.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">暂无病历</div>
              ) : (
                <div className="space-y-2">
                  {records.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => navigate(`/records/${patientId}?recordId=${r.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">{r.diagnosis}</span>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.chiefComplaint}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-semibold text-gray-900">最近检查</h3>
                </div>
                <Link to={`/examinations/${patientId}`} className="text-xs text-[#0A6EBD] hover:underline">
                  全部
                </Link>
              </div>
              {examinations.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">暂无检查</div>
              ) : (
                <div className="space-y-2">
                  {examinations.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className={cn(
                        'p-3 rounded-lg border bg-gray-50 hover:bg-white transition-colors cursor-pointer',
                        e.isAbnormal ? 'border-red-200 bg-red-50/50 hover:bg-red-50' : 'border-gray-100 hover:border-gray-200'
                      )}
                      onClick={() => navigate(`/examinations/${patientId}?examId=${e.id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{e.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {e.isAbnormal && (
                            <Badge variant="danger">异常</Badge>
                          )}
                          <span className="text-xs text-gray-400">{formatDate(e.createdAt)}</span>
                        </div>
                      </div>
                      {e.notes && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{e.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-gray-900">当前用药</h3>
                </div>
                <Link to={`/medications/${patientId}`} className="text-xs text-[#0A6EBD] hover:underline">
                  全部
                </Link>
              </div>
              {medications.filter((m) => m.status === 'active').length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">暂无在服药物</div>
              ) : (
                <div className="space-y-2">
                  {medications.filter((m) => m.status === 'active').slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => navigate(`/medications/${patientId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">{m.frequency}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{m.dosage}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-pink-500" />
                  <h3 className="text-sm font-semibold text-gray-900">转诊记录</h3>
                </div>
                <Link to={`/consultation/${patientId}`} className="text-xs text-[#0A6EBD] hover:underline">
                  详情
                </Link>
              </div>
              {referrals.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">暂无转诊</div>
              ) : (
                <div className="space-y-2">
                  {referrals.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors cursor-pointer"
                      onClick={() => navigate(`/consultation/${patientId}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">{r.reason.slice(0, 20)}</span>
                        <Badge variant={
                          r.status === 'pending' ? 'warning'
                            : r.status === 'accepted' ? 'primary'
                              : r.status === 'completed' ? 'success'
                                : 'danger'
                        }>
                          {r.status === 'pending' ? '待接受'
                            : r.status === 'accepted' ? '已接受'
                              : r.status === 'completed' ? '已完成'
                                : '已拒绝'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
