import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/ManageUsers.css'
import '../css/ConfirmModal.css'

function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '', email: '', password: '', role: 'student'
  })
  const [adding, setAdding] = useState(false)
  const [addMessage, setAddMessage] = useState('')
  const [addError, setAddError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('https://iris-backend-7717.onrender.com/users/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data.users)
    } catch {
      console.error('Failed to fetch users')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
  if (!deleteTarget) return
  if (deleteTarget.role === 'admin') {
    alert('Admin accounts cannot be deleted.')
    setDeleteTarget(null)
    return
  }
  setDeleting(deleteTarget.id)
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`https://iris-backend-7717.onrender.com/users/delete/${deleteTarget.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    setUsers(users.filter(u => u.id !== deleteTarget.id))
    setDeleteTarget(null)
  } catch (err) {
    alert(err.response?.data?.detail || 'Failed to delete user')
  }
  setDeleting(null)
}

  const handleAddUser = async () => {
    if (!formData.full_name.trim()) { setAddError('Full name is required'); return }
    if (!formData.email.trim()) { setAddError('Email is required'); return }
    if (!formData.password.trim()) { setAddError('Password is required'); return }
    if (formData.password.length < 6) { setAddError('Password must be at least 6 characters'); return }

    setAdding(true)
    setAddError('')
    setAddMessage('')
    try {
      await axios.post('https://iris-backend-7717.onrender.com/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      })
      setAddMessage(`Account for ${formData.full_name} created successfully!`)
      setFormData({ full_name: '', email: '', password: '', role: 'student' })
      fetchUsers()
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Failed to create account')
    }
    setAdding(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setAddMessage('')
    setAddError('')
    setFormData({ full_name: '', email: '', password: '', role: 'student' })
  }

  const roleBadgeClass = (role) => {
    if (role === 'admin') return 'mu-badge mu-badge-admin'
    if (role === 'instructor') return 'mu-badge mu-badge-instructor'
    return 'mu-badge mu-badge-student'
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter ? u.role === roleFilter : true
    return matchSearch && matchRole
  })

  const totalStudents = users.filter(u => u.role === 'student').length
  const totalInstructors = users.filter(u => u.role === 'instructor').length
  const totalAdmins = users.filter(u => u.role === 'admin').length

  return (
    <div className="mu-container">
      <h2 className="mu-heading">Manage Users</h2>

      <div className="mu-summary">
        <div className="mu-summary-card mu-total">
          <span className="mu-summary-num">{users.length}</span>
          <span className="mu-summary-label">Total Users</span>
        </div>
        <div className="mu-summary-card mu-students">
          <span className="mu-summary-num">{totalStudents}</span>
          <span className="mu-summary-label">Students</span>
        </div>
        <div className="mu-summary-card mu-instructors">
          <span className="mu-summary-num">{totalInstructors}</span>
          <span className="mu-summary-label">Instructors</span>
        </div>
        <div className="mu-summary-card mu-admins">
          <span className="mu-summary-num">{totalAdmins}</span>
          <span className="mu-summary-label">Admins</span>
        </div>
      </div>

      <div className="mu-card">
        <div className="mu-top">
          <h3 className="mu-card-title">All Accounts ({filtered.length})</h3>
          <div className="mu-filters">
            <button
              className="mu-add-btn"
              onClick={() => setShowModal(true)}
            >
              + Add User
            </button>
            <select
              className="mu-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
            <input
              className="mu-search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <p className="mu-loading">Loading users...</p>}
        {!loading && filtered.length === 0 && (
          <p className="mu-empty">No users found.</p>
        )}
        {!loading && filtered.length > 0 && (
          <div className="mu-table-wrapper">
            <table className="mu-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="mu-name">{user.full_name}</td>
                    <td className="mu-email">{user.email}</td>
                    <td>
                      <span className={roleBadgeClass(user.role)}>
                        {user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      {user.role === 'admin' ? (
                        <span className="mu-protected">Protected</span>
                      ) : (
                        <button
                        className="mu-delete"
                        onClick={() => setDeleteTarget({ id: user.id, name: user.full_name, role: user.role })}
                        disabled={deleting === user.id}
                      >
                        {deleting === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="mu-modal-overlay" onClick={handleCloseModal}>
          <div className="mu-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mu-modal-header">
              <h2 className="mu-modal-title">Add New User</h2>
              <button className="mu-modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            {addMessage && <p className="mu-modal-success">{addMessage}</p>}
            {addError && <p className="mu-modal-error">{addError}</p>}

            <div className="mu-modal-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Juan Dela Cruz"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="mu-modal-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="e.g. juan@sjc.edu.ph"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="mu-modal-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="mu-modal-field">
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            <div className="mu-modal-actions">
              <button className="mu-modal-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button
                className="mu-modal-submit"
                onClick={handleAddUser}
                disabled={adding}
              >
                {adding ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
  <div className="confirm-overlay">
    <div className="confirm-modal">
      <div className="confirm-icon">🗑️</div>
      <h3 className="confirm-title">Delete User?</h3>
      <p className="confirm-desc">
        Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
        This cannot be undone.
      </p>
      <div className="confirm-actions">
        <button
          className="confirm-cancel"
          onClick={() => setDeleteTarget(null)}
        >
          Cancel
        </button>
        <button
          className="confirm-delete"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default ManageUsers