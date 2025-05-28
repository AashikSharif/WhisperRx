import React, { useState, useEffect } from 'react'
import client from '../api/client'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import { marked } from 'marked'
import Header from '../components/Header.jsx'
import Timeline from '../components/Timeline.jsx'
import { Stethoscope, Syringe } from 'lucide-react';

const VIEW_MODES = {
  APPOINTMENTS: 'appointments',
  BOOKING: 'booking',
  MEDICAL_RECORD: 'medical_record'
}

export default function PatientDashboard() {
  const [patient, setPatient] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [upcomingAppts, setUpcomingAppts] = useState([])
  const [pastVisits, setPastVisits] = useState([])
  const [currentView, setCurrentView] = useState(VIEW_MODES.APPOINTMENTS)
  const [selectedVisit, setSelectedVisit] = useState(null)

  const [bookingData, setBookingData] = useState({
    doctor_id: '',
    reason: '',
    timestamp: new Date()
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await client.get('/patient')
        const { patient, doctors, upcoming_appointments, past_visits } = res.data
        setPatient(patient)
        setDoctors(doctors)
        setUpcomingAppts(upcoming_appointments)
        setPastVisits(past_visits)
        setBookingData(data => ({
          ...data,
          doctor_id: doctors[0]?.id || ''
        }))
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [])

  const handleBookingSubmit = async e => {
    e.preventDefault()
    try {
      await client.post('/patient', {
        doctor_id: bookingData.doctor_id,
        reason: bookingData.reason,
        timestamp: bookingData.timestamp.toISOString()
      })
      // Refresh data
      const res = await client.get('/patient')
      setUpcomingAppts(res.data.upcoming_appointments)
      setPastVisits(res.data.past_visits)

      // Reset form and return to appointments view
      setBookingData({
        doctor_id: doctors[0]?.id || '',
        reason: '',
        timestamp: new Date()
      })
      setCurrentView(VIEW_MODES.APPOINTMENTS)
    } catch {
      alert('Failed to book appointment.')
    }
  }

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit)
    setCurrentView(VIEW_MODES.MEDICAL_RECORD)
  }

  const handleNewBooking = () => {
    setCurrentView(VIEW_MODES.BOOKING)
  }

  const handleBackToAppointments = () => {
    setCurrentView(VIEW_MODES.APPOINTMENTS)
    setSelectedVisit(null)
  }

  if (!patient) return <div className="p-8">Loading...</div>

  const renderMainContent = () => {
    switch (currentView) {
      case VIEW_MODES.BOOKING:
        return (
          <div className="max-w-lg mx-auto p-8 custom-shadow mt-24 rounded-xl">
            <div className="mb-8">
              <button
                onClick={handleBackToAppointments}
                className="text-gray-500 hover:text-gray-700 text-sm mb-4 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>
              <h3 className="text-2xl font-light text-gray-900 dark:text-white">
                Book a New Appointment
              </h3>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-8 text-left">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Doctor
                </label>
                <select
                  value={bookingData.doctor_id}
                  onChange={e =>
                    setBookingData({ ...bookingData, doctor_id: e.target.value })
                  }
                  className="w-full p-4 bg-transparent border-0 border-b border-gray-200 dark:border-gray-700
                     focus:border-amber-500 focus:outline-none transition-colors text-gray-900 dark:text-white
                     appearance-none dark:bg-gray-800"
                  required
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Reason for visit
                </label>
                <input
                  type="text"
                  value={bookingData.reason}
                  onChange={e =>
                    setBookingData({ ...bookingData, reason: e.target.value })
                  }
                  className="w-full p-4 bg-transparent border-0 border-b border-gray-200 dark:border-gray-700
                     focus:border-amber-500 focus:outline-none transition-colors placeholder-gray-400
                     text-gray-900 dark:text-white"
                  placeholder="Consultation, check-up, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Date & time
                </label>
                <Flatpickr
                  value={bookingData.timestamp}
                  onChange={([date]) =>
                    setBookingData({ ...bookingData, timestamp: date })
                  }
                  options={{
                    enableTime: true,
                    dateFormat: 'Y-m-d h:i K',
                    altInput: true,
                    altFormat: 'F j, Y - h:i K'
                  }}
                  className="w-full p-4 bg-transparent border-0 border-b border-gray-200 dark:border-gray-700
                     focus:border-amber-500 focus:outline-none transition-colors text-gray-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-12 bg-amber-500 dark:bg-white text-white dark:text-amber-900
                   hover:bg-amber-600 dark:hover:bg-gray-100 transition-colors font-medium tracking-wide rounded-2xl"
              >
                Book Appointment
              </button>
            </form>
          </div>
        )

      case VIEW_MODES.MEDICAL_RECORD:
        return (
          <div className="p-6 bg-gray-50 border border-gray-200 dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Medical Record</h3>
              <button
                onClick={handleBackToAppointments}
                className="text-sm text-amber-600 hover:text-amber-700 underline transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            </div>
            <div
              className="prose dark:prose-invert max-w-none markdown-box"
              dangerouslySetInnerHTML={{ __html: marked.parse(selectedVisit?.transcript || '') }}
            />
          </div>
        )

      case VIEW_MODES.APPOINTMENTS:
      default:
        return (
          <div className="space-y-0">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-light mb-1">Upcoming Appointments</h3>
              <button
                onClick={handleNewBooking}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-light"
              >
                + New Appointment
              </button>
            </div>

            {upcomingAppts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {upcomingAppts.map(a => (
                  <div key={a.id} className="p-6 border-l-4 rounded-lg border-amber-400 bg-white shadow-md dark:bg-gray-800/50 backdrop-blur-sm hover:bg-amber-400 dark:hover:bg-gray-800/70 transition-all duration-700 group">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-2xl font-light text-gray-900 dark:text-white">
                        {new Date(a.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono tracking-wide">
                        {new Date(a.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {/*<div className="w-2 h-2 bg-black rounded-full"></div>*/}
                        <Stethoscope className="text-gray-900" />
                        <span className="text-gray-900 dark:text-white font-medium">{a.doctor_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {/*<div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>*/}
                        <Syringe className="text-gray-600" />
                        <span className="text-gray-600 dark:text-gray-400">{a.reason}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center flex justify-center items-center h-96 py-12">
                <p className="text-gray-500 text-2xl dark:text-gray-400 mb-4">No upcoming appointments.</p>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <div className="min-h-[93vh] text-gray-900 dark:text-gray-100">
      <Header
        links={[
          { to: '/patient', label: 'Dashboard' },
          { to: '/doctors', label: 'Doctors' }
        ]}
        showLogout
      />

      <div className="relative flex-grow overflow-hidden rounded-2xl flex bg-gray-100 min-h-[86.5vh] max-h-[86.5vh] px-6 py-6 gap-x-4">
        {/* Sidebar */}
        <aside className="w-1/5 flex flex-col bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 custom-shadow scroll">
          {/* Welcome Section */}
          <div className="mb-6">
            <h3 className="text-2xl font-light text-gray-900 dark:text-gray-100">
              Welcome, {patient.name.split(' ')[0]}
            </h3>
          </div>

          {/* Past Visits */}
          <div className="flex-1 overflow-auto">
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              Past Visits
            </h4>
            <div className="w-full border-t border-gray-300 dark:border-gray-600 mb-4" />
            <Timeline
              items={pastVisits}
              onSelect={handleVisitSelect}
            />
          </div>

          {/* New Booking Button */}
          <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-700">
            <button
              onClick={handleNewBooking}
              className="w-full py-3 bg-white border font-light text-gray-500 hover:text-white rounded-lg hover:bg-amber-500 border-gray-500 hover:border-amber-500 transition-colors"
            >
              + New Appointment
            </button>
          </div>

          {/* Profile Section */}
          {/*<div className="flex items-center space-x-3">*/}
          {/*  {!patient.profile_image ? (*/}
          {/*    <img*/}
          {/*      src={patient.profile_image}*/}
          {/*      alt="Profile"*/}
          {/*      className="w-10 h-10 rounded-full object-cover"*/}
          {/*    />*/}
          {/*  ) : (*/}
          {/*    <div className="w-10 h-10 flex rounded-full bg-gray-200 dark:bg-gray-600 items-center justify-center">*/}
          {/*      <span className="text-gray-700 dark:text-gray-300 font-medium">*/}
          {/*        {patient.name.charAt(0).toUpperCase()}*/}
          {/*      </span>*/}
          {/*    </div>*/}
          {/*  )}*/}
          {/*  <span className="text-sm text-gray-700 dark:text-gray-300">*/}
          {/*    {patient.email}*/}
          {/*  </span>*/}
          {/*</div>*/}
        </aside>

        {/* Main Content */}
        <main className="flex-1 rounded-2xl bg-gray-50 dark:bg-gray-900 p-6 overflow-auto custom-shadow scroll">
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}
