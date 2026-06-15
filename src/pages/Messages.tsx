import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Video,
  ArrowRightLeft,
  Receipt,
  Star,
  AlertTriangle,
  CheckCheck,
  Mail,
} from 'lucide-react'
import { useNotificationStore } from '@/stores/notificationStore'
import { formatRelativeTime, formatDateTime } from '@/utils/date'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types'

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

export default function Messages() {
  const { notifications, feeRecords, markAsRead, markAllAsRead, confirmFee, addRating } = useNotificationStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [ratingForm, setRatingForm] = useState({ rating: 0, tags: [] as string[], comment: '' })

  const filteredNotifications = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeTab)

  const selectedMessage = notifications.find((n) => n.id === selectedMessageId) || null

  const relatedFeeRecord = selectedMessage?.type === 'fee' && selectedMessage.relatedId
    ? feeRecords.find((f) => f.id === selectedMessage.relatedId)
    : null

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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <h1 className="text-lg font-semibold text-gray-900">消息中心</h1>
        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
          <CheckCheck className="h-4 w-4" />
          全部已读
        </Button>
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
              </div>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const Icon = typeIconMap[notif.type]
              const iconColor = typeIconColorMap[notif.type]
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
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex-1 bg-white overflow-y-auto p-6">
          {!selectedMessage ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="flex flex-col items-center gap-3">
                <Mail className="h-12 w-12" />
                <span className="text-sm">选择一条消息查看详情</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-gray-900">{selectedMessage.title}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{formatDateTime(selectedMessage.createdAt)}</span>
                <Badge variant={typeBadgeVariantMap[selectedMessage.type]}>
                  {typeLabelMap[selectedMessage.type]}
                </Badge>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedMessage.content}</p>

              {selectedMessage.type === 'fee' && relatedFeeRecord && (
                <div className="mt-4 rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">费用明细</h3>
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
                    <div className="mt-4 flex gap-3">
                      <Button size="sm" onClick={() => confirmFee(relatedFeeRecord.id)}>确认费用</Button>
                      <Button variant="danger" size="sm">异议申诉</Button>
                    </div>
                  )}
                  {relatedFeeRecord.status === 'confirmed' && (
                    <p className="mt-3 text-sm text-green-600">费用已确认</p>
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

              {selectedMessage.type === 'referral' && selectedMessage.relatedId && (
                <div className="mt-4 rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">转诊状态</h3>
                  <div className="flex flex-col gap-0">
                    {[
                      { label: '提交转诊', done: true },
                      { label: '专科接收', done: ['accepted', 'completed'].includes(selectedMessage.content.includes('接受') ? 'accepted' : selectedMessage.content.includes('完成') ? 'completed' : '') },
                      { label: '诊疗完成', done: selectedMessage.content.includes('完成') },
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
                </div>
              )}

              {selectedMessage.type === 'consultation' && selectedMessage.relatedId && (
                <div className="mt-4">
                  <Link to={`/consultation/${selectedMessage.relatedId}`}>
                    <Button size="sm">进入问诊室</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
