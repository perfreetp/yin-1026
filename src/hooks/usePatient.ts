import { usePatientStore } from '@/stores/patientStore'
import { useConsultationStore } from '@/stores/consultationStore'
import { useMedicationStore } from '@/stores/medicationStore'
import { useFollowupStore } from '@/stores/followupStore'

export function usePatient(patientId: string) {
  const patients = usePatientStore((s) => s.patients)
  const medicalRecords = usePatientStore((s) => s.medicalRecords)
  const examinations = usePatientStore((s) => s.examinations)
  const healthIndicators = usePatientStore((s) => s.healthIndicators)
  const referrals = usePatientStore((s) => s.referrals)
  const consultations = useConsultationStore((s) => s.consultations)
  const medications = useMedicationStore((s) => s.medications)
  const plans = useFollowupStore((s) => s.plans)

  const patient = patients.find((p) => p.id === patientId)
  const records = medicalRecords.filter((r) => r.patientId === patientId)
  const patientExaminations = examinations.filter((e) => e.patientId === patientId)
  const patientMedications = medications.filter((m) => m.patientId === patientId)
  const patientConsultations = consultations.filter((c) => c.patientId === patientId)
  const indicators = healthIndicators.filter((i) => i.patientId === patientId)
  const patientFollowupPlans = plans.filter((f) => f.patientId === patientId)
  const patientReferrals = referrals.filter((r) => r.patientId === patientId)

  return {
    patient,
    records,
    examinations: patientExaminations,
    medications: patientMedications,
    consultations: patientConsultations,
    indicators,
    followupPlans: patientFollowupPlans,
    referrals: patientReferrals,
    isLoading: false,
  }
}
