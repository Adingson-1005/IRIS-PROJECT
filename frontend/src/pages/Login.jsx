import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('https://iris-backend-7717.onrender.com/auth/login', {
        email,
        password
      })
      const { token, role, full_name } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      localStorage.setItem('full_name', full_name)

      if (role === 'admin') navigate('/admin')
      else if (role === 'instructor') navigate('/instructor')
      else navigate('/search-papers')

    } catch {
      setError('Invalid email or password')
    }
    setLoading(false)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (token && role) {
      if (role === 'admin') navigate('/admin', { replace: true })
      else if (role === 'instructor') navigate('/instructor', { replace: true })
      else navigate('/search-papers', { replace: true })
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="login-container">

      {/* Left side */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <span className="login-logo-text">IRIS</span>
          </div>
          <h1 className="login-headline">
            A Smarter Way to Search and Manage Research
          </h1>
          <p className="login-subtext">
            A powerful institutional research system designed to help students
            and researchers quickly find, analyze, and access academic papers
            with AI-assisted guidance.
          </p>
          <div className="login-features">
            <div className="login-feature-item">
              <span className="login-feature-icon">🔍</span>
              <span>Inverted Index Search Algorithm</span>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon">🤖</span>
              <span>AI Research Checker</span>
            </div>
            <div className="login-feature-item">
              <span className="login-feature-icon">💬</span>
              <span>RAG-Based AI Guidance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="login-right">
        <div className="login-form-card">
          <div className="login-form-header">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to your IRIS account</p>
          </div>

          <div className="login-field">
            <label className="login-label">Email address</label>
            <input
              className="login-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              className="login-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="login-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="login-btn-loading">
                <span className="login-btn-spinner"></span>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>

          <p className="login-footer-text">
            St. Joseph College Olongapo
          </p>
        </div>
      </div>

    </div>
  )
}

export default Login