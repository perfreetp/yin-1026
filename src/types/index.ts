export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  phone: string;
  idCard: string;
  tags: string[];
  allergy: string;
  pastHistory: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'video' | 'text';
  status: 'waiting' | 'active' | 'completed';
  startedAt: string;
  endedAt: string;
}

export interface ChatMessage {
  id: string;
  consultationId: string;
  senderId: string;
  senderRole: 'doctor' | 'patient';
  content: string;
  type: 'text' | 'image';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  presentIllness: string;
  pastIllness: string;
  diagnosis: string;
  treatmentPlan: string;
  createdAt: string;
}

export interface Examination {
  id: string;
  patientId: string;
  type: 'blood' | 'imaging' | 'ecg' | 'other';
  name: string;
  date: string;
  imageUrls: string[];
  isAbnormal: boolean;
  notes: string;
  isImportant: boolean;
  createdAt: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'stopped' | 'completed';
  prescribedBy: string;
}

export interface MedicationReminder {
  id: string;
  medicationId: string;
  patientId: string;
  time: string;
  enabled: boolean;
}

export interface PrescriptionItem {
  medicationName: string;
  dosage: string;
  usage: string;
  duration: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  consultationId: string;
  items: PrescriptionItem[];
  notes: string;
  createdAt: string;
}

export interface FollowupPlan {
  id: string;
  patientId: string;
  doctorId: string;
  nextDate: string;
  frequency: string;
  status: 'active' | 'completed' | 'paused';
  notes?: string;
  reminderTime?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'text' | 'scale';
  options?: string[];
}

export interface Answer {
  questionId: string;
  value: string | string[] | number;
}

export interface FollowupQuestionnaire {
  id: string;
  planId: string;
  patientId: string;
  title: string;
  questions: Question[];
  answers: Answer[];
  status: 'pending' | 'completed' | 'expired';
  createdAt: string;
}

export interface HealthIndicator {
  id: string;
  patientId: string;
  name: string;
  value: number;
  unit: string;
  recordedAt: string;
  isAbnormal: boolean;
  upperLimit: number;
  lowerLimit: number;
}

export interface Referral {
  id: string;
  patientId: string;
  fromDoctorId: string;
  toDoctorId: string;
  reason: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  specialistOpinion: string;
  createdAt: string;
}

export interface PatientEducation {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  createdAt: string;
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface FeeRecord {
  id: string;
  patientId: string;
  consultationId: string;
  amount: number;
  items: FeeItem[];
  status: 'pending' | 'confirmed' | 'disputed';
  createdAt: string;
}

export interface ServiceRating {
  id: string;
  patientId: string;
  consultationId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  tags: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'system' | 'consultation' | 'referral' | 'fee' | 'rating' | 'alert';
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  hospital: string;
  avatar: string;
}

export interface TagPreset {
  id: string;
  name: string;
  color: string;
}
