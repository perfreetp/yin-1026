import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Medication, MedicationReminder } from '@/types'
import { medications as mockMedications, medicationReminders as mockReminders } from '@/data/mockData'

interface DrugInteraction {
  drug1: string
  drug2: string
  severity: 'high' | 'medium' | 'low'
  description: string
}

interface MedicationState {
  medications: Medication[]
  reminders: MedicationReminder[]
  drugInteractions: DrugInteraction[]
  addMedication: (med: Medication) => void
  updateMedication: (id: string, updates: Partial<Medication>) => void
  stopMedication: (id: string) => void
  toggleReminder: (id: string) => void
  getMedicationsByPatient: (patientId: string) => Medication[]
  getRemindersByPatient: (patientId: string) => MedicationReminder[]
  getInteractionsForPatient: (patientId: string) => DrugInteraction[]
}

export const useMedicationStore = create<MedicationState>()(
  persist(
    (set, get) => ({
      medications: mockMedications,
      reminders: mockReminders,
      drugInteractions: [
        { drug1: '缬沙坦', drug2: '二甲双胍', severity: 'low', description: '缬沙坦可能增强二甲双胍的降糖效果，需监测血糖' },
        { drug1: '阿司匹林', drug2: '氯吡格雷', severity: 'high', description: '联用增加出血风险，需密切监测凝血功能' },
        { drug1: '二甲双胍', drug2: '奥美拉唑', severity: 'low', description: '奥美拉唑可能影响二甲双胍吸收' },
        { drug1: '华法林', drug2: '阿司匹林', severity: 'high', description: '联用显著增加出血风险，应避免联用' },
      ],
      addMedication: (med) => set((s) => ({
        medications: [...s.medications, med],
      })),
      updateMedication: (id, updates) => set((s) => ({
        medications: s.medications.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      })),
      stopMedication: (id) => set((s) => ({
        medications: s.medications.map((m) => (m.id === id ? { ...m, status: 'stopped' as const, endDate: new Date().toISOString().slice(0, 10) } : m)),
      })),
      toggleReminder: (id) => set((s) => ({
        reminders: s.reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      })),
      getMedicationsByPatient: (patientId) => {
        return get().medications.filter((m) => m.patientId === patientId)
      },
      getRemindersByPatient: (patientId) => {
        return get().reminders.filter((r) => r.patientId === patientId)
      },
      getInteractionsForPatient: (patientId) => {
        const patientMeds = get().medications.filter((m) => m.patientId === patientId && m.status === 'active')
        const medNames = patientMeds.map((m) => m.name)
        return get().drugInteractions.filter(
          (i) => medNames.some((name) => name.includes(i.drug1)) && medNames.some((name) => name.includes(i.drug2))
        )
      },
    }),
    { name: 'telemedicine-medication' }
  )
)
