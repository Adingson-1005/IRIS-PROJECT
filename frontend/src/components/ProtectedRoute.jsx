import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const navigate = useNavigate()
  const location = useLocation()

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  useEffect(() => {
    // Push current path to history so back button works correctly
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // When back button is pressed, clear session and redirect to login
      localStorage.clear()
      navigate('/', { replace: true })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  // No token — redirect to login
  if (!token) {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  // Wrong role — redirect to login
  if (allowedRole && role !== allowedRole) {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  // Check token expiry
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000
    if (Date.now() > expiry) {
      localStorage.clear()
      navigate('/', { replace: true })
      return null
    }
  } catch {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  return children
}

export default ProtectedRoute