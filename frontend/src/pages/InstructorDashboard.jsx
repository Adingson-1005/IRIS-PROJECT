import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MyUploads from './MyUploads'
import BrowseRepository from './BrowseRepository'
import UploadTemplate from './UploadTemplate'
import StudentDrafts from './StudentDrafts'
// Shares the top-bar layout styles with the admin dashboard so both look identical
import '../css/AdminDashboard.css'
import '../css/ConfirmModal.css'

function InstructorDashboard() {
  const navigate = useNavigate()
  const full_name = sessionStorage.getItem('full_name') || 'Instructor'
  const [activePage, setActivePage] = useState('uploads')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    sessionStorage.clear()
    navigate('/')
  }

  const navItems = [
    { key: 'uploads',  label: 'My Uploads' },
    { key: 'browse',   label: 'Main Repository' },
    { key: 'template', label: 'Research Template' },
    { key: 'drafts',   label: 'Student Drafts' },
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'uploads':  return <MyUploads />
      case 'browse':   return <BrowseRepository />
      case 'template': return <UploadTemplate />
      case 'drafts':   return <StudentDrafts />
      default:         return <MyUploads />
    }
  }

  const initials = full_name
    .trim()
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="ad-shell">

      <div className="ad-topbar-wrap">
        <header className="ad-topbar">

          <div className="ad-brand">
            <div className="ad-logo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="ad-brand-text">
              <h1>IRIS</h1>
              <p>Instructor Panel</p>
            </div>
          </div>

          <nav className="ad-nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`ad-nav-item ${activePage === item.key ? 'active' : ''}`}
                onClick={() => setActivePage(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ad-user">
            <span className="ad-user-name">{full_name}</span>
            <div className="ad-avatar">{initials}</div>
            <button
              className="ad-logout"
              onClick={() => setShowLogoutModal(true)}
              aria-label="Logout"
              title="Logout"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

        </header>
      </div>

      <main className="ad-main">
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