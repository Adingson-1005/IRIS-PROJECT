import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MyUploads from './MyUploads'
import BrowseRepository from './BrowseRepository'
import UploadTemplate from './UploadTemplate'
import '../css/InstructorDashboard.css'

function InstructorDashboard() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name')
  const [activePage, setActivePage] = useState('uploads')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  const navItems = [
    { key: 'uploads',  label: 'My Uploads' },
    { key: 'browse',   label: 'Main Repository' },
    { key: 'template', label: 'Research Template' },
  ]

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
      <aside className="instructor-sidebar">
        <div className="sidebar-brand">
          <h1>IRIS</h1>
          <p>Instructor Panel</p>
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
          <span className="instructor-name">Welcome, {full_name}</span>
          <button className="instructor-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="instructor-main">
        {renderContent()}
      </main>
    </div>
  )
}

export default InstructorDashboard