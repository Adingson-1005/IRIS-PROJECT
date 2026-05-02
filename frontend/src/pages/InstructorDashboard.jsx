import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MyUploads from './MyUploads'
import BrowseRepository from './BrowseRepository'
import UploadTemplate from './UploadTemplate'
import '../css/InstructorDashboard.css'
import '../css/ConfirmModal.css'

function InstructorDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')
  const [activePage, setActivePage] = useState('uploads')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const navItems = [
    { key: 'uploads',  label: 'My Uploads' },
    { key: 'browse',   label: 'Main Repository' },
    { key: 'template', label: 'Research Template' },
  ]

  const handleNavClick = (key) => {
    setActivePage(key)
    setSidebarOpen(false)
  }

  const renderContent = () => {
    switch (activePage) {
      case 'uploads':  return <MyUploads />
      case 'browse':   return <BrowseRepository />
      case 'template': return <UploadTemplate />
      default:         return <MyUploads />
    }
  }

  return (
    <div className="instructor-shell">

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <span className="mobile-topbar-title">IRIS — Instructor</span>
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

      <aside className={`instructor-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div>
            <h1>IRIS</h1>
            <p>Instructor Panel</p>
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
          <span className="instructor-name">Welcome, {full_name}</span>
          <button
            className="instructor-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="instructor-main">
        {renderContent()}
      </main>

      {showLogoutModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">👋</div>
            <h3 className="confirm-title">Logging out?</h3>
            <p className="confirm-desc">
              Are you sure you want to logout of your instructor account?
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

export default InstructorDashboard