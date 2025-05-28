import { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import client from '../api/client'

export default function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    client
      .get('/login-status')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading…</div>

  // not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // role-based guard
  if (allowedRoles && !allowedRoles.includes(user.user_type)) {
    return <Navigate to="/" replace />
  }

  return children
}
