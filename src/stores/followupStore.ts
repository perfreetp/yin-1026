import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FollowupPlan, FollowupQuestionnaire, HealthIndicator, Referral, PatientEducation } from '@/types'
import { followupPlans as mockPlans, followupQuestionnaires as mockQuestionnaires, healthIndicators as mockIndicators, referrals as mockReferrals, patientEducations as mockEducations } from '@/data/mockData'

interface FollowupState {
  plans: FollowupPlan[]
  questionnaires: FollowupQuestionnaire[]
  healthIndicators: HealthIndicator[]
  referrals: Referral[]
  educationArticles: PatientEducation[]
  addPlan: (plan: FollowupPlan) => void
  updatePlan: (id: string, updates: Partial<FollowupPlan>) => void
  submitQuestionnaire: (id: string, answers: { questionId: string; value: string | string[] | number }[]) => void
  addHealthIndicator: (indicator: HealthIndicator) => void
  addReferral: (referral: Referral) => void
  updateReferral: (id: string, updates: Partial<Referral>) => void
  getPlansByPatient: (patientId: string) => FollowupPlan[]
  getQuestionnairesByPatient: (patientId: string) => FollowupQuestionnaire[]
  getIndicatorsByPatient: (patientId: string) => HealthIndicator[]
  getReferralsByPatient: (patientId: string) => Referral[]
  getAbnormalIndicators: (patientId: string) => HealthIndicator[]
}

export const useFollowupStore = create<FollowupState>()(
  persist(
    (set, get) => ({
      plans: mockPlans,
      questionnaires: mockQuestionnaires,
      healthIndicators: mockIndicators,
      referrals: mockReferrals,
      educationArticles: mockEducations,
      addPlan: (plan) => set((s) => ({
        plans: [...s.plans, plan],
      })),
      updatePlan: (id, updates) => set((s) => ({
        plans: s.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
      submitQuestionnaire: (id, answers) => set((s) => ({
        questionnaires: s.questionnaires.map((q) =>
          q.id === id ? { ...q, answers, status: 'completed' as const } : q
        ),
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
      getPlansByPatient: (patientId) => {
        return get().plans.filter((p) => p.patientId === patientId)
      },
      getQuestionnairesByPatient: (patientId) => {
        return get().questionnaires.filter((q) => q.patientId === patientId)
      },
      getIndicatorsByPatient: (patientId) => {
        return get().healthIndicators.filter((i) => i.patientId === patientId)
      },
      getReferralsByPatient: (patientId) => {
        return get().referrals.filter((r) => r.patientId === patientId)
      },
      getAbnormalIndicators: (patientId) => {
        return get().healthIndicators.filter((i) => i.patientId === patientId && i.isAbnormal)
      },
    }),
    { name: 'telemedicine-followup' }
  )
)
