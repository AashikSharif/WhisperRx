// src/App.jsx
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import IndexPage          from './pages/Index'
import LoginPage          from './pages/Login'
import SignupPage         from './pages/Signup'
import DoctorView         from './pages/DoctorView'
import PatientDashboard   from './pages/PatientDashboard'
import PatientsPage       from './pages/Patients'
import DoctorsPage        from './pages/Doctors'
import AboutPage          from './pages/About'

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        {/* landing */}
        <Route path="/" element={<IndexPage />} />

        {/* public */}
        <Route path="/login"  element={<LoginPage/>} />
        <Route path="/signup" element={<SignupPage/>} />
        <Route path="/about"  element={<AboutPage/>} />

        {/* doctor-only */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorView/>
            </ProtectedRoute>
          }
        />

        {/* patient-only */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard/>
            </ProtectedRoute>
          }
        />

        {/* lists */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientsPage/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <DoctorsPage/>
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
