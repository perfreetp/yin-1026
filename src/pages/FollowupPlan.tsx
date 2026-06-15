import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  TrendingUp,
  FileText,
  AlertTriangle,
  BookOpen,
  Stethoscope,
  Pill,
  Clock,
  Plus,
} from 'lucide-react'
import { usePatient } from '@/hooks/usePatient'
import { useFollowupStore } from '@/stores/followupStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatDate } from '@/utils/date'
import { formatGender, getTagColor } from '@/utils/format'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { HealthTrendChart } from '@/components/shared/HealthTrendChart'
import { AbnormalIndicator } from '@/components/shared/AbnormalIndicator'
import { cn } from '@/lib/utils'
import { getAge } from '@/utils/date'
import type { Answer } from '@/types'

type TabKey = 'plan' | 'trend' | 'questionnaire' | 'alert' | 'education'

const planStatusMap: Record<string, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  active: { label: '进行中', variant: 'success' },
  completed: { label: '已完成', variant: 'default' },
  paused: { label: '已暂停', variant: 'warning' },
}

const questionnaireStatusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
  pending: { label: '待填写', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  expired: { label: '已过期', variant: 'danger' },
}

const tabConfig = [
  { key: 'plan', label: '随访计划', icon: Calendar },
  { key: 'trend', label: '指标趋势', icon: TrendingUp },
  { key: 'questionnaire', label: '随访问卷', icon: ClipboardList },
  { key: 'alert', label: '异常预警', icon: AlertTriangle },
  { key: 'education', label: '健康教育', icon: BookOpen },
]

const navLinks = [
  { label: '时间线', path: '/timeline', icon: Clock },
  { label: '问诊室', path: '/consultation', icon: Stethoscope },
  { label: '病历', path: '/records', icon: FileText },
  { label: '检查资料', path: '/examinations', icon: ClipboardList },
  { label: '用药', path: '/medications', icon: Pill },
]

export default function FollowupPlan() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const { patient, followupPlans } = usePatient(patientId || '')
  const { questionnaires, educationArticles, submitQuestionnaire, getQuestionnairesByPatient, getAbnormalIndicators, getIndicatorsByPatient, updatePlan, addPlan } = useFollowupStore()
  const { addNotification } = useNotificationStore()

  const [activeTab, setActiveTab] = useState<TabKey>('plan')
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null)
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Answer[]>([])
  const [selectedIndicator, setSelectedIndicator] = useState<string>('')
  const [thresholds, setThresholds] = useState<Record<string, { upper: number; lower: number }>>({})
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editingNextDate, setEditingNextDate] = useState('')
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)
  const [newPlanForm, setNewPlanForm] = useState({
    nextDate: '',
    frequency: '每月一次',
    notes: '',
    reminderTime: '09:00',
  })

  const patientQuestionnaires = useMemo(
    () => getQuestionnairesByPatient(patientId || ''),
    [questionnaires, patientId]
  )

  const abnormalIndicators = useMemo(
    () => getAbnormalIndicators(patientId || ''),
    [getAbnormalIndicators, patientId]
  )

  const allIndicators = useMemo(
    () => getIndicatorsByPatient(patientId || ''),
    [getIndicatorsByPatient, patientId]
  )

  const indicatorNames = useMemo(() => {
    const names = [...new Set(allIndicators.map((i) => i.name))]
    if (names.length > 0 && !selectedIndicator) {
      setSelectedIndicator(names[0])
    }
    return names
  }, [allIndicators])

  const filteredChartData = useMemo(() => {
    if (!selectedIndicator) return []
    return allIndicators
      .filter((i) => i.name === selectedIndicator)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((i) => ({
        name: formatDate(i.recordedAt, 'MM/dd'),
        value: i.value,
        isAbnormal: i.isAbnormal,
      }))
  }, [allIndicators, selectedIndicator])

  const currentIndicatorUnit = useMemo(() => {
    const ind = allIndicators.find((i) => i.name === selectedIndicator)
    return ind?.unit || ''
  }, [allIndicators, selectedIndicator])

  const selectedQuestionnaire = useMemo(
    () => patientQuestionnaires.find((q) => q.id === selectedQuestionnaireId) || null,
    [patientQuestionnaires, selectedQuestionnaireId]
  )

  const selectedArticle = useMemo(
    () => educationArticles.find((a) => a.id === selectedArticleId) || null,
    [educationArticles, selectedArticleId]
  )

  const calendarDays = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return { days, year, month }
  }, [])

  const nextDates = useMemo(() => {
    return followupPlans
      .filter((p) => p.status === 'active')
      .map((p) => {
        const d = new Date(p.nextDate)
        return d.getFullYear() === calendarDays.year && d.getMonth() === calendarDays.month
          ? d.getDate()
          : null
      })
      .filter((d): d is number => d !== null)
  }, [followupPlans, calendarDays])

  if (!patient) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        患者信息不存在
      </div>
    )
  }

  const handleOpenQuestionnaire = (id: string) => {
    const q = patientQuestionnaires.find((q) => q.id === id)
    if (!q || q.status !== 'pending') return
    setSelectedQuestionnaireId(id)
    setQuestionnaireAnswers(q.questions.map((q) => ({ questionId: q.id, value: '' })))
  }

  const handleSubmitQuestionnaire = () => {
    if (!selectedQuestionnaireId) return
    submitQuestionnaire(
      selectedQuestionnaireId,
      questionnaireAnswers.map((a) => ({ questionId: a.questionId, value: a.value }))
    )
    setSelectedQuestionnaireId(null)
    setQuestionnaireAnswers([])
  }

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setQuestionnaireAnswers((prev) =>
      prev.map((a) => (a.questionId === questionId ? { ...a, value } : a))
    )
  }

  const handleThresholdChange = (indicatorName: string, field: 'upper' | 'lower', value: string) => {
    const numVal = parseFloat(value)
    if (isNaN(numVal)) return
    setThresholds((prev) => ({
      ...prev,
      [indicatorName]: { ...prev[indicatorName], [field]: numVal },
    }))
  }

  const handleOpenEditModal = (planId: string, currentDate: string) => {
    setEditingPlanId(planId)
    setEditingNextDate(currentDate.slice(0, 10))
    setShowEditModal(true)
  }

  const handleSaveNextDate = () => {
    if (!editingPlanId || !editingNextDate) return
    updatePlan(editingPlanId, { nextDate: editingNextDate })
    setShowEditModal(false)
    setEditingPlanId(null)
    setEditingNextDate('')
  }

  const handleCreatePlan = () => {
    if (!patientId || !newPlanForm.nextDate) return
    const newPlan = {
      id: `fp-${Date.now()}`,
      patientId,
      doctorId: 'doc-001',
      nextDate: newPlanForm.nextDate,
      frequency: newPlanForm.frequency,
      status: 'active' as const,
      notes: newPlanForm.notes,
      reminderTime: newPlanForm.reminderTime,
    }
    addPlan(newPlan)
    addNotification({
      id: `notif-${Date.now()}`,
      userId: patientId,
      type: 'consultation',
      title: '复诊提醒',
      content: `您已预约${formatDate(newPlanForm.nextDate)}复诊，频率：${newPlanForm.frequency}${newPlanForm.notes ? '，备注：' + newPlanForm.notes : ''}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    })
    setShowNewPlanModal(false)
    setNewPlanForm({ nextDate: '', frequency: '每月一次', notes: '', reminderTime: '09:00' })
  }

  const renderQuestionInput = (question: typeof selectedQuestionnaire extends null ? never : NonNullable<typeof selectedQuestionnaire>['questions'][number]) => {
    const answer = questionnaireAnswers.find((a) => a.questionId === question.id)
    const currentValue = answer?.value ?? ''

    switch (question.type) {
      case 'single':
        return (
          <div className="flex flex-col gap-2">
            {question.options?.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={currentValue === opt}
                  onChange={() => handleAnswerChange(question.id, opt)}
                  className="h-4 w-4 text-[#0A6EBD] border-gray-300 focus:ring-[#0A6EBD]"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        )
      case 'multiple':
        return (
          <div className="flex flex-col gap-2">
            {question.options?.map((opt) => {
              const selected = Array.isArray(currentValue) ? currentValue.includes(opt) : false
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    value={opt}
                    checked={selected}
                    onChange={() => {
                      const current = Array.isArray(currentValue) ? currentValue : []
                      const next = selected
                        ? current.filter((v) => v !== opt)
                        : [...current, opt]
                      handleAnswerChange(question.id, next)
                    }}
                    className="h-4 w-4 text-[#0A6EBD] border-gray-300 rounded focus:ring-[#0A6EBD]"
                  />
                  <span className="text-sm text-gray-700">{opt}</span>
                </label>
              )
            })}
          </div>
        )
      case 'scale':
        return (
          <div className="flex flex-col gap-2">
            <input
              type="range"
              min={1}
              max={10}
              value={typeof currentValue === 'number' ? currentValue : 5}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
              className="w-full accent-[#0A6EBD]"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1</span>
              <span className="text-sm font-medium text-gray-700">
                {typeof currentValue === 'number' ? currentValue : 5}
              </span>
              <span>10</span>
            </div>
          </div>
        )
      case 'text':
      default:
        return (
          <textarea
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={3}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
            placeholder="请输入..."
          />
        )
    }
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-0 rounded-xl overflow-hidden border border-gray-200 bg-white">
      <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 flex flex-col gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
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
              to={`${link.path}/${patientId}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="px-6 pt-4">
          <Tabs tabs={tabConfig} activeKey={activeTab} onChange={(k) => setActiveTab(k as TabKey)} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'plan' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">复诊安排</h3>
                <Button variant="primary" size="sm" onClick={() => setShowNewPlanModal(true)}>
                  <Plus className="h-4 w-4" />
                  新建复诊安排
                </Button>
              </div>
              <div className="flex flex-col gap-4">
                {followupPlans.map((plan) => (
                  <Card key={plan.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#0A6EBD]" />
                          <span className="text-sm font-semibold text-gray-900">
                            随访频率：{plan.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>下次随访：{formatDate(plan.nextDate)}</span>
                        </div>
                        {plan.notes && (
                          <div className="text-sm text-gray-500">
                            备注：{plan.notes}
                          </div>
                        )}
                        {plan.reminderTime && (
                          <div className="text-sm text-gray-500">
                            提醒时间：{plan.reminderTime}
                          </div>
                        )}
                        <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-medium text-blue-700">预约复诊</span>
                              <p className="text-sm text-blue-900 mt-1">
                                预约日期：{formatDate(plan.nextDate)}
                              </p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenEditModal(plan.id, plan.nextDate)}
                            >
                              调整预约
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Badge variant={planStatusMap[plan.status]?.variant || 'default'}>
                        {planStatusMap[plan.status]?.label || plan.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <Card>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  {calendarDays.year}年{calendarDays.month + 1}月
                </h3>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                    <div key={d} className="py-1 text-xs font-medium text-gray-400">{d}</div>
                  ))}
                  {calendarDays.days.map((day, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm mx-auto',
                        day === null && 'invisible',
                        day !== null && nextDates.includes(day)
                          ? 'bg-[#0A6EBD] text-white font-medium'
                          : 'text-gray-700'
                      )}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="flex flex-col gap-6">
              <Select
                label="选择指标"
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                options={indicatorNames.map((name) => ({ value: name, label: name }))}
                placeholder="请选择指标"
              />
              {selectedIndicator && (
                <HealthTrendChart
                  data={filteredChartData}
                  indicatorName={selectedIndicator}
                  unit={currentIndicatorUnit}
                />
              )}
            </div>
          )}

          {activeTab === 'questionnaire' && (
            <div className="flex flex-col gap-4">
              {patientQuestionnaires.map((q) => (
                <Card
                  key={q.id}
                  onClick={q.status === 'pending' ? () => handleOpenQuestionnaire(q.id) : undefined}
                  className={cn(q.status === 'pending' && 'cursor-pointer hover:border-[#0A6EBD]/30')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-gray-900">{q.title}</span>
                      <span className="text-xs text-gray-500">{formatDate(q.createdAt)}</span>
                    </div>
                    <Badge variant={questionnaireStatusMap[q.status]?.variant || 'default'}>
                      {questionnaireStatusMap[q.status]?.label || q.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'alert' && (
            <div className="flex flex-col gap-6">
              <AbnormalIndicator indicators={abnormalIndicators} />

              <Card>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">阈值设置</h3>
                <div className="flex flex-col gap-4">
                  {allIndicators.map((ind) => {
                    const key = `${ind.name}-${ind.unit}`
                    const current = thresholds[key] || { upper: ind.upperLimit, lower: ind.lowerLimit }
                    return (
                      <div key={ind.id} className="flex items-center gap-4">
                        <span className="w-28 text-sm font-medium text-gray-700 shrink-0">
                          {ind.name}（{ind.unit}）
                        </span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={current.lower}
                            onChange={(e) => handleThresholdChange(key, 'lower', e.target.value)}
                            className="w-24"
                          />
                          <span className="text-xs text-gray-400">~</span>
                          <Input
                            type="number"
                            value={current.upper}
                            onChange={(e) => handleThresholdChange(key, 'upper', e.target.value)}
                            className="w-24"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              {abnormalIndicators.filter((i) => {
                const ratio = Math.max(
                  Math.abs(i.value - i.upperLimit) / (i.upperLimit - i.lowerLimit),
                  Math.abs(i.lowerLimit - i.value) / (i.upperLimit - i.lowerLimit)
                )
                return ratio > 0.5
              }).length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-red-600">严重异常</h3>
                  {abnormalIndicators
                    .filter((i) => {
                      const ratio = Math.max(
                        Math.abs(i.value - i.upperLimit) / (i.upperLimit - i.lowerLimit || 1),
                        Math.abs(i.lowerLimit - i.value) / (i.upperLimit - i.lowerLimit || 1)
                      )
                      return ratio > 0.5
                    })
                    .map((ind) => (
                      <Card key={ind.id} className="border-red-300 bg-red-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-red-900">{ind.name}</span>
                              <span className="text-xs text-red-600">
                                正常范围：{ind.lowerLimit} - {ind.upperLimit} {ind.unit}
                              </span>
                            </div>
                          </div>
                          <Badge variant="danger">
                            {ind.value} {ind.unit}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'education' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {educationArticles.map((article) => (
                <Card
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className="cursor-pointer hover:border-[#0A6EBD]/30"
                >
                  <div className="flex gap-4">
                    <img
                      src={article.thumbnailUrl}
                      alt={article.title}
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                    <div className="flex flex-col gap-2 min-w-0">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {article.title}
                      </span>
                      <Badge variant="primary">{article.category}</Badge>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {article.content.slice(0, 100)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag) => (
                          <span key={tag} className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getTagColor(tag))}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedQuestionnaire}
        onClose={() => setSelectedQuestionnaireId(null)}
        title={selectedQuestionnaire?.title || ''}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedQuestionnaireId(null)}>取消</Button>
            <Button variant="primary" onClick={handleSubmitQuestionnaire}>提交</Button>
          </>
        }
      >
        {selectedQuestionnaire && (
          <div className="flex flex-col gap-6">
            {selectedQuestionnaire.questions.map((question, idx) => (
              <div key={question.id} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {idx + 1}. {question.text}
                </span>
                {renderQuestionInput(question)}
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticleId(null)}
        title={selectedArticle?.title || ''}
        size="lg"
      >
        {selectedArticle && (
          <div className="flex flex-col gap-4">
            {selectedArticle.thumbnailUrl && (
              <img
                src={selectedArticle.thumbnailUrl}
                alt={selectedArticle.title}
                className="w-full rounded-lg object-cover h-48"
              />
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">{selectedArticle.category}</Badge>
              {selectedArticle.tags.map((tag) => (
                <span key={tag} className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', getTagColor(tag))}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {selectedArticle.content}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="调整预约复诊时间"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleSaveNextDate}>保存</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">下次复诊日期</label>
            <input
              type="date"
              value={editingNextDate}
              onChange={(e) => setEditingNextDate(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        title="新建复诊安排"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewPlanModal(false)}>取消</Button>
            <Button variant="primary" onClick={handleCreatePlan} disabled={!newPlanForm.nextDate}>保存</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">下次复诊日期</label>
            <input
              type="date"
              value={newPlanForm.nextDate}
              onChange={(e) => setNewPlanForm((prev) => ({ ...prev, nextDate: e.target.value }))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
            />
          </div>
          <Select
            label="随访频率"
            value={newPlanForm.frequency}
            onChange={(e) => setNewPlanForm((prev) => ({ ...prev, frequency: e.target.value }))}
            options={[
              { value: '每周一次', label: '每周一次' },
              { value: '每两周一次', label: '每两周一次' },
              { value: '每月一次', label: '每月一次' },
              { value: '每季度一次', label: '每季度一次' },
              { value: '每半年一次', label: '每半年一次' },
              { value: '每年一次', label: '每年一次' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">提醒时间</label>
            <input
              type="time"
              value={newPlanForm.reminderTime}
              onChange={(e) => setNewPlanForm((prev) => ({ ...prev, reminderTime: e.target.value }))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">备注</label>
            <textarea
              value={newPlanForm.notes}
              onChange={(e) => setNewPlanForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="复诊注意事项..."
              rows={3}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
