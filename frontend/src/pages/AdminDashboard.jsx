import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ManagePapers from './ManagePapers'
import Analytics from './Analytics'
import ManageUsers from './ManageUsers'
import '../css/AdminDashboard.css'
import '../css/ConfirmModal.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')
  const [activePage, setActivePage] = useState('papers')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const navItems = [
    { key: 'papers',    label: 'Manage Papers' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'users',     label: 'Manage Users' },
  ]

  const handleNavClick = (key) => {
    setActivePage(key)
    setSidebarOpen(false)
  }

  const renderContent = () => {
    switch (activePage) {
      case 'papers':    return <ManagePapers />
      case 'analytics': return <Analytics />
      case 'users':     return <ManageUsers />
      default:          return <ManageUsers />
    }
  }

  return (
    <div className="admin-shell">

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-title">IRIS — Admin</span>
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div>
            <h1>IRIS</h1>
            <p>Admin Panel</p>
          </div>
          <button
            className="sidebar-hamburger"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activePage === item.key ? 'active' : ''}`}
              onClick={() => handleNavClick(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="admin-name">Welcome, {full_name}</span>
          <button
            className="admin-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {renderContent()}
      </main>

      {showLogoutModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">👋</div>
            <h3 className="confirm-title">Logging out?</h3>
            <p className="confirm-desc">
              Are you sure you want to logout of your admin account?
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Stay
              </button>
              <button
                className="confirm-proceed"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard