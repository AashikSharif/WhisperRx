import React, { useEffect, useState } from 'react'
import client from '../api/client'
import Header from '../components/Header'

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await client.get('/doctors')
        setDoctors(res.data.doctors || [])
      } catch (err) {
        console.error('Failed to fetch doctors:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDoctors()
  }, [])

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
        <main className="w-full rounded-2xl bg-gray-100 dark:bg-gray-900 p-6 overflow-auto scroll">
          <h2 className="text-3xl font-light mb-8">Available Doctors</h2>

          {loading ? (
            <p>Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-lg">No doctors found.</p>
          ) : (
            <div className="flex flex-row justify-center gap-6">
              {doctors.map(doctor => (
                <div
                  key={doctor.id}
                  className="bg-white min-w-[300px] dark:bg-gray-800 p-4 rounded-xl overflow-hidden custom-shadow items-center justify-center flex flex-col"
                >
                  <img
                    src={doctor.profile_image}
                    alt={doctor.name}
                    className="h-32 w-32 object-cover rounded-full"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {doctor.specialty || 'Doctor'}
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
