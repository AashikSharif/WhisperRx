import React, { useState } from 'react'
import client from '../api/client'
import { useNavigate, Link } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      // Send JSON body
      const res = await client.post('/login', { email, password })
      // On success, res.data contains { user_type, user_name }
      const { user_type } = res.data
      navigate(user_type === 'doctor' ? '/doctor' : '/patient')
    } catch (err) {
      // If your endpoint returns a JSON error, you could show that:
      const msg = err.response?.data?.error || 'Invalid credentials. Please try again.'
      alert(msg)
    }
  }

  return (
    <div className="flex items-center justify-center h-[90vh] bg-white">
      <div
        className="relative h-[55vh] w-full max-w-xl p-8 bg-gradient-to-tr from-amber-600 via-amber-400 to-white rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Curved SVG Overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 600 800"
          preserveAspectRatio="none"
        >
          <path
            d="M0,800 C400,800 400,0 600,0 L600,800 Z"
            fill="rgba(255,255,255,0.3)"
          />
        </svg>

        {/* Centered form content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Welcome Back
          </h2>
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <input
              type="email"
              required
              value={email}
              placeholder="Email"
              onChange={e => setEmail(e.target.value)}
              className="w-3/4 mx-auto p-3 bg-amber-50/30 backdrop-blur-2xl rounded-lg placeholder-gray-50 text-black focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-3/4 mx-auto p-3 bg-amber-50/30 backdrop-blur-2xl rounded-lg placeholder-gray-50 text-black focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="w-3/4 mx-auto py-3 bg-white text-black font-semibold rounded-lg hover:bg-black hover:text-white transition"
            >
              Login
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-black/60">
            Don't have an account?{' '}
            <Link to="/signup" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
