import { useNavigate } from 'react-router-dom'
import '../css/StudentDashboard.css'

function StudentDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="student-container">

      <div className="student-header">
        <h1 className="student-title">IRIS — Student Portal</h1>
        <div className="student-header-right">
          <span className="student-name">Welcome, {full_name}</span>
          <button className="student-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="student-content">
        <div
          className="student-card"
          onClick={() => navigate('/search-papers')}
          style={{ cursor: 'pointer' }}
        >
          <h2>Search Papers</h2>
          <p>Find research papers using keyword search</p>
        </div>

        <div
          className="student-card"
          style={{ cursor: 'not-allowed', opacity: 0.5 }}
        >
          <h2>AI Guidance</h2>
          <p>Get AI-assisted help with your research writing</p>
        </div>

      </div>
    </div>
  )
}

export default StudentDashboard