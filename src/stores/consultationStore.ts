import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Consultation, ChatMessage, Prescription } from '@/types'
import { consultations as mockConsultations, chatMessages as mockMessages, prescriptions as mockPrescriptions } from '@/data/mockData'

interface ConsultationState {
  consultations: Consultation[]
  messages: ChatMessage[]
  prescriptions: Prescription[]
  activeConsultationId: string | null
  startConsultation: (patientId: string, doctorId: string, type: 'video' | 'text') => void
  endConsultation: (id: string) => void
  sendMessage: (message: ChatMessage) => void
  addPrescription: (prescription: Prescription) => void
  setActiveConsultation: (id: string | null) => void
  getMessagesByConsultation: (consultationId: string) => ChatMessage[]
  getPrescriptionsByPatient: (patientId: string) => Prescription[]
}

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set, get) => ({
      consultations: mockConsultations,
      messages: mockMessages,
      prescriptions: mockPrescriptions,
      activeConsultationId: null,
      startConsultation: (patientId, doctorId, type) => {
        const newConsultation: Consultation = {
          id: `cons-${Date.now()}`,
          patientId,
          doctorId,
          type,
          status: 'active',
          startedAt: new Date().toISOString(),
          endedAt: '',
        }
        set((s) => ({
          consultations: [...s.consultations, newConsultation],
          activeConsultationId: newConsultation.id,
        }))
      },
      endConsultation: (id) => set((s) => ({
        consultations: s.consultations.map((c) =>
          c.id === id ? { ...c, status: 'completed' as const, endedAt: new Date().toISOString() } : c
        ),
        activeConsultationId: s.activeConsultationId === id ? null : s.activeConsultationId,
      })),
      sendMessage: (message) => set((s) => ({
        messages: [...s.messages, message],
      })),
      addPrescription: (prescription) => set((s) => ({
        prescriptions: [...s.prescriptions, prescription],
      })),
      setActiveConsultation: (id) => set({ activeConsultationId: id }),
      getMessagesByConsultation: (consultationId) => {
        return get().messages.filter((m) => m.consultationId === consultationId)
      },
      getPrescriptionsByPatient: (patientId) => {
        return get().prescriptions.filter((p) => p.patientId === patientId)
      },
    }),
    { name: 'telemedicine-consultation' }
  )
)
