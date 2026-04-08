import { useNavigate } from 'react-router-dom'
import '../css/AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="admin-container">

      <div className="admin-header">
        <h1 className="admin-title">IRIS — Admin Panel</h1>
          <div className="admin-header-right">
            <span className="admin-name">Welcome, {full_name}</span>
            <button className="admin-logout" onClick={handleLogout}>Logout</button>
          </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-card">
          <h2>Manage Users</h2>
          <p>View and manage student and instructor accounts</p>
        </div>

      <div className="admin-card"
      onClick={() => navigate('/manage-papers')}
      style={{ cursor: 'pointer' }}
      >
      <h2>Manage Papers</h2>
      <p>Approve, reject, and categorize research papers</p>
      </div>

        <div className="admin-card">
          <h2>Analytics</h2>
          <p>View search trends and repository statistics</p>
        </div>
      </div>
      
    </div>
  )
}

export default AdminDashboard