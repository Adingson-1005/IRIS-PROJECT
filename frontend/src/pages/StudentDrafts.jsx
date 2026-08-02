import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/StudentDrafts.css'

function StudentDrafts() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDrafts, setStudentDrafts] = useState([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [assignedClass, setAssignedClass] = useState(null)
  const role = localStorage.getItem('role')

  useEffect(() => {
    fetchStudents()
    if (role === 'instructor') fetchMyClass()
  }, [])

  const fetchMyClass = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/classes/list',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const userId = JSON.parse(atob(token.split('.')[1])).sub
      const myClass = response.data.classes.find(c => c.instructor_id === userId)
      setAssignedClass(myClass || null)
    } catch {
      console.error('Failed to fetch class')
    }
  }

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/drafts/all-students',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStudents(response.data.students || [])
    } catch {
      console.error('Failed to fetch students')
    }
    setLoading(false)
  }

  const fetchStudentDrafts = async (student) => {
    setSelectedStudent(student)
    setSelectedDraft(null)
    setLoadingDrafts(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `https://iris-backend-7717.onrender.com/drafts/student/${student.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setStudentDrafts(response.data.drafts || [])
    } catch {
      console.error('Failed to fetch drafts')
    }
    setLoadingDrafts(false)
  }

  const canComment = role === 'instructor' && assignedClass !== null

  const handleAddComment = async () => {
    if (!comment.trim()) { setCommentError('Please enter a comment'); return }
    setSubmitting(true)
    setCommentError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `https://iris-backend-7717.onrender.com/drafts/comment/${selectedDraft.id}`,
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setComment('')
      await fetchStudentDrafts(selectedStudent)
    } catch (err) {
      setCommentError(err.response?.data?.detail || 'Failed to add comment')
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `https://iris-backend-7717.onrender.com/drafts/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await fetchStudentDrafts(selectedStudent)
    } catch {
      alert('Failed to delete comment')
    }
  }

  useEffect(() => {
    if (selectedDraft && studentDrafts.length > 0) {
      const updated = studentDrafts.find(d => d.id === selectedDraft.id)
      if (updated) setSelectedDraft(updated)
    }
  }, [studentDrafts])

  const initials = (name) => {
    if (!name) return '?'
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const groupedStudents = students.reduce((acc, student) => {
    const key = student.class_name || 'No Class'
    if (!acc[key]) acc[key] = []
    acc[key].push(student)
    return acc
  }, {})

  const [updatingStatus, setUpdatingStatus] = useState(null)

  const handleUpdateStatus = async (draftId, newStatus) => {
  setUpdatingStatus(draftId)
  try {
    const token = localStorage.getItem('token')
    await axios.put(
      `https://iris-backend-7717.onrender.com/drafts/status/${draftId}`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    await fetchStudentDrafts(selectedStudent)
  } catch (err) {
    alert(err.response?.data?.detail || 'Failed to update status')
  }
  setUpdatingStatus(null)
}

  return (
    <div className="sd-container">

      <div className="sd-page-header">
        <div>
          <h2 className="sd-page-title">Student Drafts</h2>
          <p className="sd-page-sub">
            {role === 'instructor' && assignedClass
              ? `Viewing drafts from ${assignedClass.name} — you can comment on these`
              : role === 'instructor'
              ? 'You are not assigned to a class — viewing all drafts (read-only)'
              : 'Viewing all student drafts (read-only)'}
          </p>
        </div>
        {role === 'instructor' && assignedClass && (
          <div className="sd-class-badge">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {assignedClass.name}
          </div>
        )}
      </div>

      <div className="sd-layout">

        {/* Left — student list */}
        <div className="sd-student-panel">
          <div className="sd-panel-header">
            <h3 className="sd-panel-title">Students</h3>
            <span className="sd-panel-count">{students.length}</span>
          </div>

          {loading && <p className="sd-loading">Loading...</p>}

          {!loading && students.length === 0 && (
            <div className="sd-empty">
              <svg viewBox="0 0 24 24" fill="none" className="sd-empty-svg">
                <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>No drafts submitted yet.</p>
            </div>
          )}

          {!loading && Object.entries(groupedStudents).map(([className, classStudents]) => (
            <div key={className}>
              <div className="sd-class-group-label">{className}</div>
              {classStudents.map((student) => (
                <div
                  key={student.id}
                  className={`sd-student-item ${selectedStudent?.id === student.id ? 'sd-student-active' : ''}`}
                  onClick={() => fetchStudentDrafts(student)}
                >
                  <div className="sd-student-avatar">{initials(student.full_name)}</div>
                  <div className="sd-student-info">
                    <p className="sd-student-name">{student.full_name}</p>
                    <p className="sd-student-meta">
                      {student.draft_count} draft{student.draft_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="sd-student-badge">{student.draft_count}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Middle — draft list */}
        <div className="sd-drafts-panel">
          {!selectedStudent ? (
            <div className="sd-empty sd-empty-center">
              <svg viewBox="0 0 24 24" fill="none" className="sd-empty-svg">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>Select a student to view their drafts</p>
            </div>
          ) : (
            <>
              <div className="sd-panel-header">
                <div>
                  <h3 className="sd-panel-title">{selectedStudent.full_name}</h3>
                  <p className="sd-panel-sub">{selectedStudent.class_name || 'No class'} · {selectedStudent.email}</p>
                </div>
              </div>

              {loadingDrafts && <p className="sd-loading">Loading drafts...</p>}

              {!loadingDrafts && studentDrafts.length === 0 && (
                <div className="sd-empty">
                  <svg viewBox="0 0 24 24" fill="none" className="sd-empty-svg">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <p>No drafts submitted yet.</p>
                </div>
              )}

              {!loadingDrafts && studentDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className={`sd-draft-item ${selectedDraft?.id === draft.id ? 'sd-draft-active' : ''}`}
                  onClick={() => setSelectedDraft(draft)}
                >
                  <div className="sd-draft-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="sd-draft-info">
                    <p className="sd-draft-title">{draft.title}</p>
                    <p className="sd-draft-meta">
                      {draft.file_type} · {new Date(draft.created_at).toLocaleDateString()} · {draft.comments?.length || 0} comment{draft.comments?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  {draft.comments?.length > 0 && (
                    <div className="sd-comment-dot"></div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right — detail + comments */}
        <div className="sd-detail-panel">
          {!selectedDraft ? (
            <div className="sd-empty sd-empty-center">
              <svg viewBox="0 0 24 24" fill="none" className="sd-empty-svg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>Select a draft to view and comment</p>
            </div>
          ) : (
            <>
              <div className="sd-detail-header">
                <h3 className="sd-detail-title">{selectedDraft.title}</h3>
                <p className="sd-detail-meta">
                  Submitted {new Date(selectedDraft.created_at).toLocaleDateString()}
                  {' · '}{selectedDraft.file_type}
                </p>
                <a
                  href={selectedDraft.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="sd-view-btn"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  View File
                </a>
              </div>

              <div className="sd-status-section">
                <h4 className="sd-status-title">Draft Status</h4>
                <div className="sd-status-track">
                  {['Submitted', 'Under Review', 'Returned for Revision', 'Revised', 'Approved'].map((step, i) => {
                    const steps = ['Submitted', 'Under Review', 'Returned for Revision', 'Revised', 'Approved']
                    const currentIndex = steps.indexOf(selectedDraft.status || 'Submitted')
                    const isCompleted = i < currentIndex
                    const isActive = i === currentIndex
                    return (
                      <div key={step} className="sd-status-step-wrapper">
                        <div className={`sd-status-step ${isActive ? 'sd-step-active' : ''} ${isCompleted ? 'sd-step-done' : ''}`}>
                          <div className="sd-step-circle">
                            {isCompleted ? (
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <span>{i + 1}</span>
                            )}
                          </div>
                          <span className="sd-step-label">{step}</span>
                        </div>
                        {i < 4 && <div className={`sd-step-line ${isCompleted ? 'sd-line-done' : ''}`}></div>}
                      </div>
                    )
                  })}
                </div>

                {canComment && (
                  <div className="sd-status-actions">
                    <label className="sd-status-label">Update Status:</label>
                    <select
                      className="sd-status-select"
                      value={selectedDraft.status || 'Submitted'}
                      onChange={(e) => handleUpdateStatus(selectedDraft.id, e.target.value)}
                      disabled={updatingStatus === selectedDraft.id}
                    >
                      <option value="Submitted">Submitted</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Returned for Revision">Returned for Revision</option>
                      <option value="Revised">Revised</option>
                      <option value="Approved">Approved</option>
                    </select>
                    {updatingStatus === selectedDraft.id && (
                      <span className="sd-status-saving">Saving...</span>
                    )}
                  </div>
                )}
              </div>

              <div className="sd-comments-section">
                <h4 className="sd-comments-title">
                  Comments ({selectedDraft.comments?.length || 0})
                </h4>

                {selectedDraft.comments?.length === 0 && (
                  <p className="sd-no-comments">No comments yet.</p>
                )}

                <div className="sd-comments-list">
                  {selectedDraft.comments?.map((c) => (
                    <div key={c.id} className="sd-comment-item">
                      <div className="sd-comment-header">
                        <div className="sd-comment-avatar">{initials(c.instructor_name)}</div>
                        <div className="sd-comment-meta">
                          <span className="sd-comment-author">{c.instructor_name}</span>
                          <span className="sd-comment-date">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {role === 'instructor' && canComment && (
                          <button
                            className="sd-comment-delete"
                            onClick={() => handleDeleteComment(c.id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                      <p className="sd-comment-text">{c.comment}</p>
                    </div>
                  ))}
                </div>

                {canComment && (
                  <div className="sd-add-comment">
                    <h4 className="sd-add-comment-title">Add Comment</h4>
                    {commentError && <p className="sd-comment-error">{commentError}</p>}
                    <textarea
                      className="sd-comment-input"
                      placeholder="Write your feedback here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <button
                      className="sd-comment-submit"
                      onClick={handleAddComment}
                      disabled={submitting}
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                )}

                {role === 'instructor' && !canComment && (
                  <div className="sd-readonly-note">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    You are not assigned to a class so you cannot comment on drafts.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDrafts