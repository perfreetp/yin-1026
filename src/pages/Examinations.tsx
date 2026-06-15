import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileImage,
  AlertTriangle,
  Star,
  Bookmark,
  MoreHorizontal,
  User,
  FileText,
  Activity,
  ClipboardList,
} from 'lucide-react';
import { usePatient } from '@/hooks/usePatient';
import { usePatientStore } from '@/stores/patientStore';
import { formatDate } from '@/utils/date';
import { formatGender } from '@/utils/format';
import { getAge } from '@/utils/date';
import { Tabs } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { ImageUploader } from '@/components/shared/ImageUploader';
import { AbnormalIndicator } from '@/components/shared/AbnormalIndicator';
import type { Examination } from '@/types';

const examTypeLabels: Record<Examination['type'], string> = {
  blood: '血液检查',
  imaging: '影像检查',
  ecg: '心电图',
  other: '其他',
};

const examTabs = [
  { key: 'all', label: '全部' },
  { key: 'blood', label: '血液检查' },
  { key: 'imaging', label: '影像检查' },
  { key: 'ecg', label: '心电图' },
  { key: 'other', label: '其他' },
];

const typeOptions = [
  { value: 'blood', label: '血液检查' },
  { value: 'imaging', label: '影像检查' },
  { value: 'ecg', label: '心电图' },
  { value: 'other', label: '其他' },
];

const quickLinks = [
  { label: '基本信息', icon: User, path: 'basic' },
  { label: '病历记录', icon: FileText, path: 'medical-records' },
  { label: '检查资料', icon: ClipboardList, path: 'examinations' },
  { label: '健康指标', icon: Activity, path: 'health-indicators' },
];

export default function Examinations() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { patient, examinations, indicators } = usePatient(patientId || '');
  const addExamination = usePatientStore((s) => s.addExamination);
  const updateExamination = usePatientStore((s) => s.updateExamination);

  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    type: 'blood' as Examination['type'],
    name: '',
    notes: '',
    imageUrls: [] as string[],
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <span className="text-gray-500">患者不存在</span>
      </div>
    );
  }

  const filteredExams =
    activeTab === 'all'
      ? examinations
      : examinations.filter((e) => e.type === activeTab);

  const selectedExam = examinations.find((e) => e.id === selectedExamId);
  const abnormalIndicators = indicators.filter((i) => i.isAbnormal);

  const handleUploadImages = (_files: FileList) => {
    const newUrls = Array.from(_files).map(
      (f) => URL.createObjectURL(f)
    );
    setUploadForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...newUrls],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setUploadForm((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleSaveExam = () => {
    if (!uploadForm.name.trim()) return;
    const newExam: Examination = {
      id: `exam-${Date.now()}`,
      patientId: patient.id,
      type: uploadForm.type,
      name: uploadForm.name,
      date: new Date().toISOString().split('T')[0],
      imageUrls: uploadForm.imageUrls,
      isAbnormal: false,
      notes: uploadForm.notes,
      isImportant: false,
      createdAt: new Date().toISOString(),
    };
    addExamination(newExam);
    setShowUploadModal(false);
    setUploadForm({
      type: 'blood',
      name: '',
      notes: '',
      imageUrls: [],
    });
  };

  const handleMenuAction = (examId: string, action: string) => {
    if (action === 'important') {
      const exam = examinations.find((e) => e.id === examId);
      if (exam) {
        updateExamination(examId, { isImportant: !exam.isImportant });
      }
    }
    setOpenMenuId(null);
  };

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
              <Badge key={tag} variant="primary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <nav className="flex-1 px-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.path === 'examinations';
            return (
              <button
                key={link.path}
                onClick={() => {
                  if (!isActive) navigate(`/patient/${patientId}/${link.path}`);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-[#0A6EBD]/10 text-[#0A6EBD] font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">检查资料</h1>
            <Button
              variant="primary"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4" />
              上传报告
            </Button>
          </div>

          <Tabs tabs={examTabs} activeKey={activeTab} onChange={setActiveTab} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                onClick={() => {
                  setSelectedExamId(exam.id);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                    {exam.imageUrls.length > 0 ? (
                      <img
                        src={exam.imageUrls[0]}
                        alt={exam.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 truncate">
                        {exam.name}
                      </p>
                      <div className="relative" ref={openMenuId === exam.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === exam.id ? null : exam.id
                            );
                          }}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === exam.id && (
                          <div
                            className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleMenuAction(exam.id, 'important')}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {exam.isImportant ? '取消重要' : '标记重要'}
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              添加备注
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              归档
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDate(exam.date)}
                      </span>
                      <Badge variant="primary">
                        {examTypeLabels[exam.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {exam.isAbnormal && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <Badge variant="danger">异常</Badge>
                        </div>
                      )}
                      {exam.isImportant && (
                        <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredExams.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
                <FileImage className="h-12 w-12 mb-3" />
                <span className="text-sm">暂无检查资料</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="上传检查报告"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveExam}
              disabled={!uploadForm.name.trim()}
            >
              保存
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ImageUploader
            images={uploadForm.imageUrls}
            onUpload={handleUploadImages}
            onRemove={handleRemoveImage}
          />
          <Select
            label="检查类型"
            value={uploadForm.type}
            onChange={(e) =>
              setUploadForm((prev) => ({
                ...prev,
                type: e.target.value as Examination['type'],
              }))
            }
            options={typeOptions}
          />
          <Input
            label="报告名称"
            value={uploadForm.name}
            onChange={(e) =>
              setUploadForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="请输入报告名称"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">备注</label>
            <textarea
              value={uploadForm.notes}
              onChange={(e) =>
                setUploadForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="请输入备注信息"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#0A6EBD] focus:outline-none focus:ring-2 focus:ring-[#0A6EBD]/20 resize-none"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExamId(null);
        }}
        title="报告详情"
        size="lg"
      >
        {selectedExam && (
          <div className="flex gap-6">
            <div className="flex-1 min-h-[240px] rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {selectedExam.imageUrls.length > 0 ? (
                <img
                  src={selectedExam.imageUrls[0]}
                  alt={selectedExam.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <FileImage className="h-16 w-16 text-gray-300" />
              )}
            </div>
            <div className="w-56 flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">报告名称</p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedExam.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">检查类型</p>
                <Badge variant="primary">
                  {examTypeLabels[selectedExam.type]}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">检查日期</p>
                <p className="text-sm text-gray-700">
                  {formatDate(selectedExam.date)}
                </p>
              </div>
              {selectedExam.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">备注</p>
                  <p className="text-sm text-gray-700">{selectedExam.notes}</p>
                </div>
              )}
              {selectedExam.isAbnormal && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">异常指标</p>
                  <AbnormalIndicator indicators={abnormalIndicators} />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
