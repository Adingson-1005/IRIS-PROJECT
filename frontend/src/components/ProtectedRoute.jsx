import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRole }) {
  const navigate = useNavigate()

  const token = sessionStorage.getItem('token')
  const role = sessionStorage.getItem('role')

  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      sessionStorage.clear()
      window.history.pushState(null, '', '/')
      navigate('/', { replace: true })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  if (!token) {
    sessionStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  if (allowedRole && role !== allowedRole) {
    sessionStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiry = payload.exp * 1000
    if (Date.now() > expiry) {
      sessionStorage.clear()
      navigate('/', { replace: true })
      return null
    }
  } catch {
    sessionStorage.clear()
    navigate('/', { replace: true })
    return null
  }

  return children
}

export default ProtectedRoute