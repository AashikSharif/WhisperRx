import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import client from '../api/client'

export default function Header({ links = [], showLogout = false }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await client.post('/logout')
    navigate('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800">
      <Link to="/about" className="text-3xl font-light text-gray-900 dark:text-gray-100">
        WhisperRx
      </Link>
      <nav className="flex items-center space-x-4">
        {links.map(({ to, label }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 font-light rounded-2xl transition text-lg ${
                isActive
                  ? 'bg-black/5 text-black font-normal'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-black/5'
              }`}
            >
              {label}
            </Link>
          )
        })}
        {showLogout && (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-lg font-light rounded-2xl bg-amber-500 text-white hover:bg-amber-600/70 transition"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}
