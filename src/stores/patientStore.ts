import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Patient, MedicalRecord, Examination, HealthIndicator, Referral, TagPreset, Doctor } from '@/types'
import { patients as mockPatients, medicalRecords as mockRecords, examinations as mockExams, healthIndicators as mockIndicators, referrals as mockReferrals, tagPresets, doctors } from '@/data/mockData'

interface PatientState {
  patients: Patient[]
  medicalRecords: MedicalRecord[]
  examinations: Examination[]
  healthIndicators: HealthIndicator[]
  referrals: Referral[]
  selectedPatientId: string | null
  searchQuery: string
  filterTags: string[]
  showAbnormalOnly: boolean
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, updates: Partial<Patient>) => void
  deletePatient: (id: string) => void
  selectPatient: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilterTags: (tags: string[]) => void
  toggleAbnormalFilter: () => void
  addMedicalRecord: (record: MedicalRecord) => void
  addExamination: (exam: Examination) => void
  updateExamination: (id: string, updates: Partial<Examination>) => void
  addHealthIndicator: (indicator: HealthIndicator) => void
  addReferral: (referral: Referral) => void
  updateReferral: (id: string, updates: Partial<Referral>) => void
  filteredPatients: () => Patient[]
  getAbnormalCount: (patientId: string) => number
  tagPresets: TagPreset[]
  doctors: Doctor[]
}

export const usePatientStore = create<PatientState>()(
  persist(
    (set, get) => ({
      patients: mockPatients,
      medicalRecords: mockRecords,
      examinations: mockExams,
      healthIndicators: mockIndicators,
      referrals: mockReferrals,
      selectedPatientId: null,
      searchQuery: '',
      filterTags: [],
      showAbnormalOnly: false,
      tagPresets,
      doctors,
      addPatient: (patient) => set((s) => ({ patients: [...s.patients, patient] })),
      updatePatient: (id, updates) => set((s) => ({
        patients: s.patients.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      deletePatient: (id) => set((s) => ({
        patients: s.patients.filter((p) => p.id !== id),
      })),
      selectPatient: (id) => set({ selectedPatientId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterTags: (tags) => set({ filterTags: tags }),
      toggleAbnormalFilter: () => set((s) => ({ showAbnormalOnly: !s.showAbnormalOnly })),
      addMedicalRecord: (record) => set((s) => ({
        medicalRecords: [...s.medicalRecords, record],
      })),
      addExamination: (exam) => set((s) => ({
        examinations: [...s.examinations, exam],
      })),
      updateExamination: (id, updates) => set((s) => ({
        examinations: s.examinations.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),
      addHealthIndicator: (indicator) => set((s) => ({
        healthIndicators: [...s.healthIndicators, indicator],
      })),
      addReferral: (referral) => set((s) => ({
        referrals: [...s.referrals, referral],
      })),
      updateReferral: (id, updates) => set((s) => ({
        referrals: s.referrals.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      })),
      filteredPatients: () => {
        const { patients, searchQuery, filterTags, showAbnormalOnly, healthIndicators } = get()
        return patients.filter((p) => {
          const matchSearch = !searchQuery || p.name.includes(searchQuery) || p.tags.some((t) => t.includes(searchQuery))
          const matchTags = filterTags.length === 0 || p.tags.some((t) => filterTags.includes(t))
          const matchAbnormal = !showAbnormalOnly || healthIndicators.some((i) => i.patientId === p.id && i.isAbnormal)
          return matchSearch && matchTags && matchAbnormal
        })
      },
      getAbnormalCount: (patientId) => {
        return get().healthIndicators.filter((i) => i.patientId === patientId && i.isAbnormal).length
      },
    }),
    { name: 'telemedicine-patient' }
  )
)
