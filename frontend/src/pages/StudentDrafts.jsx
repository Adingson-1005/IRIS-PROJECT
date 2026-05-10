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

  const role = localStorage.getItem('role')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/drafts/all-students',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setStudents(response.data.students || [])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentDrafts = async (student) => {
    setSelectedStudent(student)
    setSelectedDraft(null)
    setLoadingDrafts(true)

    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        `https://iris-backend-7717.onrender.com/drafts/student/${student.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setStudentDrafts(response.data.drafts || [])
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoadingDrafts(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment.trim()) {
      setCommentError('Please enter a comment')
      return
    }

    setSubmitting(true)
    setCommentError('')

    try {
      const token = localStorage.getItem('token')

      await axios.post(
        `https://iris-backend-7717.onrender.com/drafts/comment/${selectedDraft.id}`,
        { comment },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setComment('')

      await fetchStudentDrafts(selectedStudent)
    } catch (err) {
      setCommentError(
        err.response?.data?.detail || 'Failed to add comment'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token')

      await axios.delete(
        `https://iris-backend-7717.onrender.com/drafts/comment/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      await fetchStudentDrafts(selectedStudent)
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    }
  }

  useEffect(() => {
    if (selectedDraft && studentDrafts.length > 0) {
      const updated = studentDrafts.find(
        (d) => d.id === selectedDraft.id
      )

      if (updated) {
        setSelectedDraft(updated)
      }
    }
  }, [studentDrafts])

  const initials = (name) => {
    if (!name) return '?'

    return name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className="sd-container">

      <div className="sd-page-header">
        <h2 className="sd-page-title">Student Drafts</h2>

        <p className="sd-page-sub">
          View and comment on research drafts submitted by students
        </p>
      </div>

      <div className="sd-layout">

        {/* LEFT PANEL — STUDENTS */}
        <div className="sd-student-panel">

          <div className="sd-panel-header">
            <h3 className="sd-panel-title">Students</h3>

            <span className="sd-panel-count">
              {students.length}
            </span>
          </div>

          {loading && (
            <p className="sd-loading">
              Loading students...
            </p>
          )}

          {!loading && students.length === 0 && (
            <div className="sd-empty">
              <p className="sd-empty-icon">📭</p>
              <p>No students have submitted drafts yet.</p>
            </div>
          )}

          {!loading &&
            students.map((student) => (
              <div
                key={student.id}
                className={`sd-student-item ${
                  selectedStudent?.id === student.id
                    ? 'sd-student-active'
                    : ''
                }`}
                onClick={() => fetchStudentDrafts(student)}
              >

                <div className="sd-student-avatar">
                  {initials(student.full_name)}
                </div>

                <div className="sd-student-info">
                  <p className="sd-student-name">
                    {student.full_name}
                  </p>

                  <p className="sd-student-meta">
                    {student.draft_count} draft
                    {student.draft_count !== 1 ? 's' : ''} ·{' '}
                    {student.last_submitted
                      ? new Date(
                          student.last_submitted
                        ).toLocaleDateString()
                      : 'No submissions'}
                  </p>
                </div>

                <span className="sd-student-badge">
                  {student.draft_count}
                </span>
              </div>
            ))}
        </div>

        {/* MIDDLE PANEL — DRAFTS */}
        <div className="sd-drafts-panel">

          {!selectedStudent ? (
            <div className="sd-empty sd-empty-center">
              <p className="sd-empty-icon">👈</p>
              <p>Select a student to view their drafts</p>
            </div>
          ) : (
            <>
              <div className="sd-panel-header">
                <div>
                  <h3 className="sd-panel-title">
                    {selectedStudent.full_name}
                  </h3>

                  <p className="sd-panel-sub">
                    {selectedStudent.email}
                  </p>
                </div>
              </div>

              {loadingDrafts && (
                <p className="sd-loading">
                  Loading drafts...
                </p>
              )}

              {!loadingDrafts &&
                studentDrafts.length === 0 && (
                  <div className="sd-empty">
                    <p className="sd-empty-icon">📄</p>
                    <p>No drafts submitted yet.</p>
                  </div>
                )}

              {!loadingDrafts &&
                studentDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`sd-draft-item ${
                      selectedDraft?.id === draft.id
                        ? 'sd-draft-active'
                        : ''
                    }`}
                    onClick={() => setSelectedDraft(draft)}
                  >

                    <div className="sd-draft-icon">
                      {draft.file_type === 'PDF'
                        ? '📄'
                        : '📝'}
                    </div>

                    <div className="sd-draft-info">
                      <p className="sd-draft-title">
                        {draft.title}
                      </p>

                      <p className="sd-draft-meta">
                        {draft.file_type} ·{' '}
                        {new Date(
                          draft.created_at
                        ).toLocaleDateString()}{' '}
                        · {draft.comments?.length || 0}{' '}
                        comment
                        {draft.comments?.length !== 1
                          ? 's'
                          : ''}
                      </p>
                    </div>

                    {draft.comments?.length > 0 && (
                      <span className="sd-comment-dot"></span>
                    )}
                  </div>
                ))}
            </>
          )}
        </div>

        {/* RIGHT PANEL — DETAILS */}
        <div className="sd-detail-panel">

          {!selectedDraft ? (
            <div className="sd-empty sd-empty-center">
              <p className="sd-empty-icon">📋</p>
              <p>
                Select a draft to view details and comments
              </p>
            </div>
          ) : (
            <>
              <div className="sd-detail-header">

                <h3 className="sd-detail-title">
                  {selectedDraft.title}
                </h3>

                <p className="sd-detail-meta">
                  Submitted{' '}
                  {new Date(
                    selectedDraft.created_at
                  ).toLocaleDateString()}
                </p>

                <a
                  href={selectedDraft.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="sd-view-btn"
                >
                  View File ↗
                </a>
              </div>

              <div className="sd-comments-section">

                <h4 className="sd-comments-title">
                  Comments (
                  {selectedDraft.comments?.length || 0})
                </h4>

                {selectedDraft.comments?.length === 0 && (
                  <p className="sd-no-comments">
                    No comments yet.
                  </p>
                )}

                <div className="sd-comments-list">

                  {selectedDraft.comments?.map((c) => (
                    <div
                      key={c.id}
                      className="sd-comment-item"
                    >

                      <div className="sd-comment-header">

                        <div className="sd-comment-avatar">
                          {initials(c.instructor_name)}
                        </div>

                        <div className="sd-comment-meta">
                          <span className="sd-comment-author">
                            {c.instructor_name}
                          </span>

                          <span className="sd-comment-date">
                            {new Date(
                              c.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {role === 'instructor' && (
                          <button
                            className="sd-comment-delete"
                            onClick={() =>
                              handleDeleteComment(c.id)
                            }
                            title="Delete comment"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <p className="sd-comment-text">
                        {c.comment}
                      </p>
                    </div>
                  ))}
                </div>

                {role !== 'admin' && (
                  <div className="sd-add-comment">

                    <h4 className="sd-add-comment-title">
                      Add Comment
                    </h4>

                    {commentError && (
                      <p className="sd-comment-error">
                        {commentError}
                      </p>
                    )}

                    <textarea
                      className="sd-comment-input"
                      placeholder="Write your feedback or comment here..."
                      value={comment}
                      onChange={(e) =>
                        setComment(e.target.value)
                      }
                      rows={3}
                    />

                    <button
                      className="sd-comment-submit"
                      onClick={handleAddComment}
                      disabled={submitting}
                    >
                      {submitting
                        ? 'Posting...'
                        : 'Post Comment'}
                    </button>
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