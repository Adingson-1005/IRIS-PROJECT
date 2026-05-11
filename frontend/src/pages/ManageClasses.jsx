import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/ManageClasses.css'

function ManageClasses() {
  const [classes, setClasses] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const [cls, users] = await Promise.all([
        axios.get('https://iris-backend-7717.onrender.com/classes/list', { headers }),
        axios.get('https://iris-backend-7717.onrender.com/users/list', { headers })
      ])
      setClasses(cls.data.classes || [])
      setInstructors((users.data.users || []).filter(u => u.role === 'instructor'))
    } catch {
      console.error('Failed to load classes')
    }
    setLoading(false)
  }

  const handleAssign = async (classId, instructorId) => {
    setSaving(classId)
    setMessage('')
    try {
      const token = localStorage.getItem('token')
      if (instructorId === '') {
        await axios.post(
          'https://iris-backend-7717.onrender.com/classes/unassign',
          { class_id: classId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.post(
          'https://iris-backend-7717.onrender.com/classes/assign',
          { class_id: classId, instructor_id: instructorId },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      setMessage('Saved successfully!')
      fetchAll()
      setTimeout(() => setMessage(''), 3000)
    } catch {
      setMessage('Failed to save. Please try again.')
    }
    setSaving(null)
  }

  if (loading) return <div className="mc-loading">Loading classes...</div>

  return (
    <div className="mc-container">

      <div className="mc-page-header">
        <h2 className="mc-page-title">Manage Classes</h2>
        <p className="mc-page-sub">
          Assign research instructors to each class. Only assigned instructors
          can comment on student drafts from their class.
        </p>
      </div>

      {message && (
        <div className={`mc-message ${message.includes('Failed') ? 'mc-error' : 'mc-success'}`}>
          {message}
        </div>
      )}

      <div className="mc-grid">
        {classes.map((cls) => (
          <div key={cls.id} className="mc-card">
            <div className="mc-card-top">
              <div className="mc-class-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="mc-class-name">{cls.name}</h3>
                <p className="mc-class-sub">Research Class</p>
              </div>
            </div>

            <div className="mc-instructor-row">
              <label className="mc-label">Assigned Research Instructor</label>
              <select
                className="mc-select"
                value={cls.instructor_id || ''}
                onChange={(e) => handleAssign(cls.id, e.target.value)}
                disabled={saving === cls.id}
              >
                <option value="">— No instructor assigned —</option>
                {instructors.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mc-status">
              {cls.instructor_name ? (
                <div className="mc-assigned">
                  <svg viewBox="0 0 24 24" fill="none" className="mc-status-icon mc-icon-green">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{cls.instructor_name} can view and comment</span>
                </div>
              ) : (
                <div className="mc-unassigned">
                  <svg viewBox="0 0 24 24" fill="none" className="mc-status-icon mc-icon-orange">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>No instructor assigned — all can view, none can comment</span>
                </div>
              )}
            </div>

            {saving === cls.id && (
              <p className="mc-saving">Saving...</p>
            )}
          </div>
        ))}
      </div>

      <div className="mc-info-card">
        <h4 className="mc-info-title">How class assignment works</h4>
        <ul className="mc-info-list">
          <li>Students select their class when they first open My Drafts</li>
          <li>Only the assigned instructor can comment on drafts from their class</li>
          <li>Unassigned instructors can view all drafts but cannot comment</li>
          <li>Admins can always view all drafts but cannot comment</li>
          <li>Students can change their class from My Drafts settings</li>
        </ul>
      </div>
    </div>
  )
}

export default ManageClasses