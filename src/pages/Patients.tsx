import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, AlertTriangle, Users } from 'lucide-react'
import { usePatientStore } from '@/stores/patientStore'
import { useFollowupStore } from '@/stores/followupStore'
import { PatientCard } from '@/components/shared/PatientCard'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/date'

export default function Patients() {
  const navigate = useNavigate()
  const {
    searchQuery,
    setSearchQuery,
    filterTags,
    setFilterTags,
    showAbnormalOnly,
    toggleAbnormalFilter,
    filteredPatients,
    getAbnormalCount,
    addPatient,
    tagPresets,
  } = usePatientStore()

  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formGender, setFormGender] = useState('male')
  const [formBirthDate, setFormBirthDate] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formIdCard, setFormIdCard] = useState('')
  const [formAllergy, setFormAllergy] = useState('')
  const [formPastHistory, setFormPastHistory] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])

  const patients = filteredPatients()

  const handleTagToggle = (tagName: string) => {
    if (filterTags.includes(tagName)) {
      setFilterTags(filterTags.filter((t) => t !== tagName))
    } else {
      setFilterTags([...filterTags, tagName])
    }
  }

  const handleFormTagToggle = (tagName: string) => {
    if (formTags.includes(tagName)) {
      setFormTags(formTags.filter((t) => t !== tagName))
    } else {
      setFormTags([...formTags, tagName])
    }
  }

  const handleSubmit = () => {
    const now = new Date().toISOString()
    addPatient({
      id: 'p-' + Date.now(),
      name: formName,
      gender: formGender as 'male' | 'female',
      birthDate: formBirthDate,
      phone: formPhone,
      idCard: formIdCard,
      allergy: formAllergy,
      pastHistory: formPastHistory,
      tags: formTags,
      avatar: '',
      createdAt: now,
      updatedAt: now,
    })
    setShowModal(false)
    setFormName('')
    setFormGender('male')
    setFormBirthDate('')
    setFormPhone('')
    setFormIdCard('')
    setFormAllergy('')
    setFormPastHistory('')
    setFormTags([])
  }

  const getNextFollowupDate = (patientId: string) => {
    const { plans } = useFollowupStore.getState()
    const patientPlans = plans.filter((p) => p.patientId === patientId && p.status === 'active')
    if (patientPlans.length > 0) {
      const nextDates = patientPlans
        .map((p) => new Date(p.nextDate).getTime())
        .sort((a, b) => a - b)
      return formatDate(new Date(nextDates[0]).toISOString())
    }
    return '暂无'
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索患者姓名或病种..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
            />
          </div>
          <button
            onClick={toggleAbnormalFilter}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
              showAbnormalOnly
                ? 'border-orange-300 bg-orange-50 text-orange-600'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <AlertTriangle className={cn('h-4 w-4', showAbnormalOnly && 'text-orange-500')} />
            异常预警
          </button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            新建患者
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tagPresets.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagToggle(tag.name)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                filterTags.includes(tag.name)
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              style={filterTags.includes(tag.name) ? { backgroundColor: tag.color } : undefined}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {patients.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                abnormalCount={getAbnormalCount(patient.id)}
                lastFollowupDate={getNextFollowupDate(patient.id)}
                onClick={() => navigate(`/consultation/${patient.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Users className="mb-3 h-12 w-12" />
            <span className="text-sm">暂无匹配患者</span>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="新建患者"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              确认添加
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="姓名" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="请输入患者姓名" />
          <Select
            label="性别"
            value={formGender}
            onChange={(e) => setFormGender(e.target.value)}
            options={[
              { value: 'male', label: '男' },
              { value: 'female', label: '女' },
            ]}
          />
          <Input label="出生日期" type="date" value={formBirthDate} onChange={(e) => setFormBirthDate(e.target.value)} />
          <Input label="联系电话" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="请输入联系电话" />
          <Input label="身份证号" value={formIdCard} onChange={(e) => setFormIdCard(e.target.value)} placeholder="请输入身份证号" />
          <Input label="过敏史" value={formAllergy} onChange={(e) => setFormAllergy(e.target.value)} placeholder="请输入过敏史" />
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">既往病史</label>
            <textarea
              value={formPastHistory}
              onChange={(e) => setFormPastHistory(e.target.value)}
              placeholder="请输入既往病史"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20"
              rows={3}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">标签</label>
            <div className="flex flex-wrap gap-2">
              {tagPresets.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleFormTagToggle(tag.name)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    formTags.includes(tag.name)
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  style={formTags.includes(tag.name) ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
