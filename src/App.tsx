import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import Patients from '@/pages/Patients'
import Consultation from '@/pages/Consultation'
import MedicalRecords from '@/pages/MedicalRecords'
import Examinations from '@/pages/Examinations'
import Medications from '@/pages/Medications'
import FollowupPlan from '@/pages/FollowupPlan'
import Messages from '@/pages/Messages'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/patients" replace />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/consultation/:patientId" element={<Consultation />} />
          <Route path="/records/:patientId" element={<MedicalRecords />} />
          <Route path="/examinations/:patientId" element={<Examinations />} />
          <Route path="/medications/:patientId" element={<Medications />} />
          <Route path="/followup/:patientId" element={<FollowupPlan />} />
          <Route path="/messages" element={<Messages />} />
        </Route>
      </Routes>
    </Router>
  )
}
