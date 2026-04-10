import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ManagePapers from './ManagePapers'
import BrowseRepository from './BrowseRepository'
import '../css/AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')
  const [activePage, setActivePage] = useState('users')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const navItems = [
    { key: 'users',   label: 'Manage Users' },
    { key: 'papers',  label: 'Manage Papers' },
    { key: 'analytics', label: 'Analytics' },
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'papers':    return <ManagePapers />
      case 'analytics': return <div className="admin-placeholder">Analytics coming soon.</div>
      default:          return <div className="admin-placeholder">User management coming soon.</div>
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h1>IRIS</h1>
          <p>Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => setActivePage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="admin-name">Welcome, {full_name}</span>
          <button className="admin-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="admin-main">
        {renderContent()}
      </main>
    </div>
  )
}

export default AdminDashboard