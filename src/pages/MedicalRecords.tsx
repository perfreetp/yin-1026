import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Stethoscope, ClipboardList, Pill, CalendarCheck } from 'lucide-react'
import { usePatient } from '@/hooks/usePatient'
import { formatDate } from '@/utils/date'
import { formatGender, getTagColor } from '@/utils/format'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'

const quickLinks = [
  { label: '问诊室', icon: Stethoscope, path: '/consultations' },
  { label: '检查资料', icon: ClipboardList, path: '/examinations' },
  { label: '用药', icon: Pill, path: '/medications' },
  { label: '随访计划', icon: CalendarCheck, path: '/followup' },
]

export default function MedicalRecords() {
  const { patientId } = useParams<{ patientId: string }>()
  const navigate = useNavigate()
  const { patient, records } = usePatient(patientId || '')

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const filteredRecords = useMemo(() => {
    let result = [...records]
    if (dateRange.start) {
      result = result.filter((r) => new Date(r.createdAt) >= new Date(dateRange.start))
    }
    if (dateRange.end) {
      result = result.filter((r) => new Date(r.createdAt) <= new Date(dateRange.end + 'T23:59:59'))
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [records, dateRange])

  const selectedRecord = records.find((r) => r.id === selectedRecordId)

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">患者信息不存在</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0A6EBD] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回患者列表
          </button>
        </div>

        <div className="flex-1 px-4 pb-4">
          <div className="flex flex-col items-center gap-3 py-4 border-b border-gray-100">
            <Avatar src={patient.avatar} name={patient.name} size="lg" />
            <div className="text-center">
              <p className="font-semibold text-gray-900">{patient.name}</p>
              <p className="text-sm text-gray-500">
                {formatGender(patient.gender)} · {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()}岁
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {patient.tags.map((tag) => (
                <Badge key={tag} className={getTagColor(tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(`${link.path}/${patientId}`)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#0A6EBD] transition-colors"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">病历记录</h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-1 focus:ring-[#0A6EBD]/40"
            />
            <span className="text-sm text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-[#0A6EBD] focus:outline-none focus:ring-1 focus:ring-[#0A6EBD]/40"
            />
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <FileText className="h-12 w-12 mb-3" />
            <p className="text-sm">暂无病历记录</p>
          </div>
        ) : (
          <div className="relative ml-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />

            <div className="space-y-6">
              {filteredRecords.map((record) => (
                <div key={record.id} className="relative flex gap-6 pl-8">
                  <div className="absolute left-0 top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0A6EBD] ring-4 ring-[#0A6EBD]/10" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-400 mb-1.5">{formatDate(record.createdAt)}</p>
                    <Card
                      className="hover:shadow-md transition-shadow"
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{record.diagnosis}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{record.chiefComplaint}</p>
                      <p className="text-sm text-gray-400 line-clamp-2 mt-1">{record.treatmentPlan}</p>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecordId(null)}
        title={selectedRecord?.diagnosis || ''}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <DetailSection label="主诉">{selectedRecord.chiefComplaint}</DetailSection>
            <DetailSection label="现病史">{selectedRecord.presentIllness}</DetailSection>
            <DetailSection label="既往史">{selectedRecord.pastIllness}</DetailSection>
            <DetailSection label="诊断">{selectedRecord.diagnosis}</DetailSection>
            <DetailSection label="治疗方案">{selectedRecord.treatmentPlan}</DetailSection>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg border-l-4 border-[#0A6EBD] p-4">
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-line">{children}</p>
    </div>
  )
}
