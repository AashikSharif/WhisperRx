import React, { useEffect, useState } from 'react'
import client from '../api/client'
import Header from '../components/Header'

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await client.get('/patients')
        setPatients(res.data.patients || [])
      } catch (err) {
        console.error('Failed to fetch patients:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [])

  return (
    <div className="min-h-[93vh] text-gray-900 dark:text-gray-100">
      <Header
        links={[
          { to: '/doctor', label: 'Dashboard' },
          { to: '/patients', label: 'Patients' }
        ]}
        showLogout
      />

      <div className="relative flex-grow overflow-hidden rounded-2xl flex bg-gray-100 min-h-[86.5vh] max-h-[86.5vh] px-6 py-6 gap-x-4">
        <main className="w-full rounded-2xl bg-gray-100 dark:bg-gray-900 p-6 overflow-auto scroll">
          <h2 className="text-3xl font-light mb-8">Assigned Patients</h2>

          {loading ? (
            <p>Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-lg">No patients found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {patients.map(patient => (
                <div
                  key={patient.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl overflow-hidden custom-shadow items-center justify-center flex flex-col"
                >
                  <img
                    src={patient.profile_image}
                    alt={patient.name}
                    className="h-32 w-32 object-cover rounded-full"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                      {patient.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {patient.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
