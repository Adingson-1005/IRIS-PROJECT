import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/StudentDrafts.css'

const STATUS_STEPS = ['Submitted', 'Under Review', 'Returned for Revision', 'Revised', 'Approved']

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
  const [uploadingComment, setUploadingComment] = useState(null)
  const [commentedFile, setCommentedFile] = useState(null)
  const [commentedFileError, setCommentedFileError] = useState('')
  const [commentedFileSuccess, setCommentedFileSuccess] = useState('')
  const [assignedClass, setAssignedClass] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [publishRequests, setPublishRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [activeTab, setActiveTab] = useState('drafts')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processingRequest, setProcessingRequest] = useState(null)
  const role = localStorage.getItem('role')

  useEffect(() => {
    fetchStudents()
    fetchPublishRequests()
    if (role === 'instructor') fetchMyClass()
  }, [])

  // Sync selectedDraft when studentDrafts updates
  useEffect(() => {
    if (selectedDraft && studentDrafts.length > 0) {
      const updated = studentDrafts.find(d => d.id === selectedDraft.id)
      if (updated) setSelectedDraft(updated)
    }
  }, [studentDrafts])

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

  const fetchPublishRequests = async () => {
    setLoadingRequests(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/drafts/publish-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPublishRequests(response.data.requests || [])
    } catch {
      console.error('Failed to fetch publish requests')
    }
    setLoadingRequests(false)
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

  const handleUpdateStatus = async (draftId, newStatus) => {
    setUpdatingStatus(draftId)
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `https://iris-backend-7717.onrender.com/drafts/status/${draftId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // Immediately update selectedDraft so UI reflects change
      setSelectedDraft(prev => ({ ...prev, status: newStatus }))
      // Also update in the list
      setStudentDrafts(prev =>
        prev.map(d => d.id === draftId ? { ...d, status: newStatus } : d)
      )
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status')
    }
    setUpdatingStatus(null)
  }

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

  const handleUploadCommented = async (draftId) => {
    if (!commentedFile) { setCommentedFileError('Please select a DOCX file'); return }
    const ext = commentedFile.name.split('.').pop().toLowerCase()
    if (!['docx', 'doc'].includes(ext)) {
      setCommentedFileError('Only DOCX files are allowed')
      return
    }
    setUploadingComment(draftId)
    setCommentedFileError('')
    setCommentedFileSuccess('')
    try {
      const data = new FormData()
      data.append('file', commentedFile)
      const token = localStorage.getItem('token')
      await axios.post(
        `https://iris-backend-7717.onrender.com/drafts/upload-commented/${draftId}`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      )
      setCommentedFileSuccess('Commented file uploaded successfully!')
      setCommentedFile(null)
      await fetchStudentDrafts(selectedStudent)
    } catch (err) {
      setCommentedFileError(err.response?.data?.detail || 'Upload failed')
    }
    setUploadingComment(null)
  }

  const handleApprove = async (requestId) => {
    setProcessingRequest(requestId)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `https://iris-backend-7717.onrender.com/drafts/publish-approve/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchPublishRequests()
      alert('Publication approved! Paper added to repository.')
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve')
    }
    setProcessingRequest(null)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return }
    setProcessingRequest(rejectTarget)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `https://iris-backend-7717.onrender.com/drafts/publish-reject/${rejectTarget}`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRejectTarget(null)
      setRejectReason('')
      fetchPublishRequests()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject')
    }
    setProcessingRequest(null)
  }

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

  const StatusTracker = ({ currentStatus }) => {
    const currentIndex = STATUS_STEPS.indexOf(currentStatus || 'Submitted')
    return (
      <div className="sd-status-track">
        {STATUS_STEPS.map((step, i) => {
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
              {i < STATUS_STEPS.length - 1 && (
                <div className={`sd-step-line ${isCompleted ? 'sd-line-done' : ''}`}></div>
              )}
            </div>
          )
        })}
      </div>
    )
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

      <div className="sd-tabs">
        <button
          className={`sd-tab ${activeTab === 'drafts' ? 'sd-tab-active' : ''}`}
          onClick={() => setActiveTab('drafts')}
        >
          Student Drafts
        </button>
        <button
          className={`sd-tab ${activeTab === 'publications' ? 'sd-tab-active' : ''}`}
          onClick={() => setActiveTab('publications')}
        >
          Publication Requests
          {publishRequests.filter(r => r.status === 'Pending').length > 0 && (
            <span className="sd-tab-badge">
              {publishRequests.filter(r => r.status === 'Pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'drafts' && (
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
                        {draft.file_type} · {new Date(draft.created_at).toLocaleDateString()}
                      </p>
                      <span className={`sd-status-badge sd-status-${(draft.status || 'Submitted').toLowerCase().replace(/ /g, '-')}`}>
                        {draft.status || 'Submitted'}
                      </span>
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

                {/* Status tracker */}
                <div className="sd-status-section">
                  <h4 className="sd-status-title">Draft Status</h4>
                  <StatusTracker currentStatus={selectedDraft.status} />

                  {canComment && (
                    <div className="sd-status-actions">
                      <label className="sd-status-label">Update Status:</label>
                      <select
                        className="sd-status-select"
                        value={selectedDraft.status || 'Submitted'}
                        onChange={(e) => handleUpdateStatus(selectedDraft.id, e.target.value)}
                        disabled={updatingStatus === selectedDraft.id}
                      >
                        {STATUS_STEPS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {updatingStatus === selectedDraft.id && (
                        <span className="sd-status-saving">Saving...</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
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

                  {canComment && (
                    <div className="sd-commented-section">
                      <h4 className="sd-add-comment-title">Upload Commented File</h4>
                      <p className="sd-commented-desc">
                        Download the student's draft, add your inline Word comments,
                        then re-upload the commented DOCX here.
                      </p>

                      {selectedDraft.commented_file_url && (
                        <div className="sd-commented-existing">
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span>Commented file already uploaded</span>
                          <a
                            href={selectedDraft.commented_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="sd-commented-view"
                          >
                            View
                          </a>
                        </div>
                      )}

                      {commentedFileError && (
                        <p className="sd-comment-error">{commentedFileError}</p>
                      )}
                      {commentedFileSuccess && (
                        <p className="sd-commented-success">{commentedFileSuccess}</p>
                      )}

                      <input
                        type="file"
                        accept=".docx,.doc"
                        className="sd-commented-input"
                        onChange={(e) => {
                          setCommentedFile(e.target.files[0])
                          setCommentedFileError('')
                          setCommentedFileSuccess('')
                        }}
                      />
                      {commentedFile && (
                        <p className="sd-commented-filename">{commentedFile.name}</p>
                      )}

                      <button
                        className="sd-commented-upload-btn"
                        onClick={() => handleUploadCommented(selectedDraft.id)}
                        disabled={uploadingComment === selectedDraft.id || !commentedFile}
                      >
                        {uploadingComment === selectedDraft.id ? 'Uploading...' : 'Upload Commented File'}
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
      )}

      {activeTab === 'publications' && (
        <div className="sd-pub-panel">
          {loadingRequests && <p className="sd-loading">Loading requests...</p>}

          {!loadingRequests && publishRequests.length === 0 && (
            <div className="sd-empty sd-empty-center">
              <svg viewBox="0 0 24 24" fill="none" className="sd-empty-svg">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No publication requests yet.</p>
            </div>
          )}

          {!loadingRequests && publishRequests.map((req) => (
            <div key={req.id} className="sd-pub-card">
              <div className="sd-pub-card-top">
                <div>
                  <p className="sd-pub-title">{req.title}</p>
                  <p className="sd-pub-meta">
                    {req.student_name} · {req.class_name || 'No class'} · {req.category} · {req.year}
                  </p>
                  <p className="sd-pub-authors">{req.authors}</p>
                </div>
                <span className={`sd-pub-status sd-pub-status-${req.status.toLowerCase()}`}>
                  {req.status}
                </span>
              </div>

              {req.abstract && (
                <p className="sd-pub-abstract">{req.abstract.substring(0, 200)}...</p>
              )}

              {req.rejection_reason && (
                <p className="sd-pub-rejection">
                  Rejection reason: {req.rejection_reason}
                </p>
              )}

              {req.status === 'Pending' && role !== 'admin' && (
                <div className="sd-pub-actions">
                  <button
                    className="sd-pub-approve"
                    onClick={() => handleApprove(req.id)}
                    disabled={processingRequest === req.id}
                  >
                    {processingRequest === req.id ? 'Processing...' : '✓ Approve'}
                  </button>
                  <button
                    className="sd-pub-reject"
                    onClick={() => setRejectTarget(req.id)}
                    disabled={processingRequest === req.id}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {rejectTarget && (
            <div className="sd-reject-overlay" onClick={() => setRejectTarget(null)}>
              <div className="sd-reject-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Reject Publication Request</h3>
                <p>Please provide a reason for rejecting this publication request.</p>
                <textarea
                  className="sd-comment-input"
                  rows={3}
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="sd-pub-actions">
                  <button className="sd-pub-reject" onClick={() => setRejectTarget(null)}>
                    Cancel
                  </button>
                  <button
                    className="sd-pub-approve"
                    onClick={handleReject}
                    disabled={!!processingRequest}
                  >
                    {processingRequest ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StudentDrafts