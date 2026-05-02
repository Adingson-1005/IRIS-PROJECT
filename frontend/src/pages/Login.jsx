import { useState } from 'react'
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

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">IRIS</h1>
        <p className="subtitle">Institutional Research Repository</p>

        <div className="inputGroup">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="inputGroup">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button
          className="button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  )
}

export default Login