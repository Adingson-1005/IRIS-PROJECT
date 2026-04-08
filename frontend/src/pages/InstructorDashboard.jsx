import { useNavigate } from 'react-router-dom'
import '../css/InstructorDashboard.css'

function InstructorDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="instructor-container">

      <div className="instructor-header">
        <h1 className="instructor-title">IRIS — Instructor Panel</h1>
        <div className="instructor-header-right">
          <span className="instructor-name">Welcome, {full_name}</span>
          <button className="instructor-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="instructor-content">

        <div
          className="instructor-card"
          onClick={() => navigate('/upload')}
          style={{ cursor: 'pointer' }}
        >
          <h2>Upload Research Paper</h2>
          <p>Submit approved research papers to the repository</p>
        </div>

        <div className="instructor-card"
            onClick={() => navigate('/my-uploads')}
            style={{ cursor: 'pointer' }}
          >
            <h2>My Uploads</h2>
            <p>View and manage papers you have uploaded</p>
        </div>

        <div
  className="instructor-card"
  onClick={() => navigate('/browse')}
  style={{ cursor: 'pointer' }}
>
  <h2>Main Repository</h2>
  <p>Search and view all available research papers</p>
</div>

      </div>
    </div>
  )
}

export default InstructorDashboard