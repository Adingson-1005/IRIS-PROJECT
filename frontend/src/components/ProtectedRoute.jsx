import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      localStorage.clear()
      window.history.pushState(null, '', '/')
      navigate('/', { replace: true })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  if (!token) {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  if (allowedRole && role !== allowedRole) {
    localStorage.clear()
    navigate('/', { replace: true })
    return null
  }

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