import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyDrafts.css'

function MyDrafts({ onClose }) {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)

  const [showUpload, setShowUpload] = useState(false)

  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [selectedDraft, setSelectedDraft] = useState(null)

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/drafts/my-drafts',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setDrafts(response.data.drafts || [])
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file')
      return
    }

    if (!title.trim()) {
      setUploadError('Please enter a title')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const data = new FormData()

      data.append('title', title)
      data.append('file', file)

      const token = localStorage.getItem('token')

      await axios.post(
        'https://iris-backend-7717.onrender.com/drafts/upload',
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      )

      setTitle('')
      setFile(null)
      setShowUpload(false)

      await fetchDrafts()
    } catch (err) {
      setUploadError(
        err.response?.data?.detail ||
          'Upload failed. Please try again.'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(deleteTarget.id)

    try {
      const token = localStorage.getItem('token')

      await axios.delete(
        `https://iris-backend-7717.onrender.com/drafts/delete/${deleteTarget.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setDrafts((prev) =>
        prev.filter((d) => d.id !== deleteTarget.id)
      )

      if (selectedDraft?.id === deleteTarget.id) {
        setSelectedDraft(null)
      }

      setDeleteTarget(null)
    } catch (error) {
      console.error('Failed to delete draft:', error)
      alert('Failed to delete draft')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="md-overlay" onClick={onClose}>
      <div
        className="md-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="md-header">
          <div>
            <h2 className="md-title">My Drafts</h2>

            <p className="md-subtitle">
              Upload and track your research drafts
            </p>
          </div>

          <button
            className="md-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="md-body">

          {/* LEFT PANEL — DRAFT LIST */}
          <div className="md-list-panel">

            <div className="md-list-top">
              <span className="md-list-count">
                {drafts.length} draft
                {drafts.length !== 1 ? 's' : ''}
              </span>

              <button
                className="md-upload-btn"
                onClick={() => setShowUpload(true)}
              >
                + Upload Draft
              </button>
            </div>

            {loading && (
              <p className="md-loading">
                Loading drafts...
              </p>
            )}

            {!loading && drafts.length === 0 && (
              <div className="md-empty">
                <p className="md-empty-icon">📂</p>

                <p>
                  No drafts yet. Upload your first draft!
                </p>
              </div>
            )}

            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`md-draft-item ${
                  selectedDraft?.id === draft.id
                    ? 'md-draft-active'
                    : ''
                }`}
                onClick={() => setSelectedDraft(draft)}
              >

                <div className="md-draft-icon">
                  {draft.file_type === 'PDF'
                    ? '📄'
                    : '📝'}
                </div>

                <div className="md-draft-info">

                  <p className="md-draft-title">
                    {draft.title}
                  </p>

                  <p className="md-draft-meta">
                    {draft.file_type} ·{' '}
                    {new Date(
                      draft.created_at
                    ).toLocaleDateString()}
                  </p>

                  {draft.comments?.length > 0 && (
                    <p className="md-draft-comments">
                      💬 {draft.comments.length}{' '}
                      comment
                      {draft.comments.length !== 1
                        ? 's'
                        : ''}
                    </p>
                  )}
                </div>

                <button
                  className="md-draft-delete"
                  onClick={(e) => {
                    e.stopPropagation()

                    setDeleteTarget({
                      id: draft.id,
                      title: draft.title
                    })
                  }}
                  disabled={deleting === draft.id}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT PANEL — DRAFT DETAILS */}
          <div className="md-detail-panel">

            {!selectedDraft ? (
              <div className="md-detail-empty">
                <p className="md-empty-icon">📋</p>

                <p>
                  Select a draft to view comments
                </p>
              </div>
            ) : (
              <>
                <div className="md-detail-header">

                  <h3 className="md-detail-title">
                    {selectedDraft.title}
                  </h3>

                  <p className="md-detail-meta">
                    Submitted{' '}
                    {new Date(
                      selectedDraft.created_at
                    ).toLocaleDateString()}
                  </p>

                  <a
                    href={selectedDraft.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="md-view-btn"
                  >
                    View File ↗
                  </a>
                </div>

                <div className="md-comments">

                  <h4 className="md-comments-title">
                    Instructor Comments (
                    {selectedDraft.comments?.length || 0}
                    )
                  </h4>

                  {selectedDraft.comments?.length ===
                    0 && (
                    <p className="md-no-comments">
                      No comments yet. Your instructor
                      will leave feedback here.
                    </p>
                  )}

                  {selectedDraft.comments?.map((c) => (
                    <div
                      key={c.id}
                      className="md-comment-item"
                    >

                      <div className="md-comment-header">

                        <div className="md-comment-avatar">
                          {c.instructor_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="md-comment-author">
                            {c.instructor_name}
                          </p>

                          <p className="md-comment-date">
                            {new Date(
                              c.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <p className="md-comment-text">
                        {c.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* UPLOAD MODAL */}
        {showUpload && (
          <div
            className="md-upload-overlay"
            onClick={() => setShowUpload(false)}
          >

            <div
              className="md-upload-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="md-upload-header">
                <h3>Upload Draft</h3>

                <button
                  className="md-close"
                  onClick={() => setShowUpload(false)}
                >
                  ✕
                </button>
              </div>

              {uploadError && (
                <p className="md-upload-error">
                  {uploadError}
                </p>
              )}

              <div className="md-upload-field">
                <label>Title</label>

                <input
                  type="text"
                  placeholder="Enter the title of your draft"
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                />
              </div>

              <div className="md-upload-field">
                <label>File (PDF or DOCX)</label>

                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) =>
                    setFile(e.target.files[0])
                  }
                />

                {file && (
                  <p className="md-upload-filename">
                    📄 {file.name}
                  </p>
                )}
              </div>

              <div className="md-upload-actions">

                <button
                  className="md-upload-cancel"
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>

                <button
                  className="md-upload-submit"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading
                    ? 'Uploading...'
                    : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM MODAL */}
        {deleteTarget && (
          <div
            className="md-upload-overlay"
            onClick={() => setDeleteTarget(null)}
          >

            <div
              className="md-upload-modal md-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="md-confirm-icon">
                🗑️
              </div>

              <h3 className="md-confirm-title">
                Delete Draft?
              </h3>

              <p className="md-confirm-desc">
                Are you sure you want to delete{' '}
                <strong>
                  "{deleteTarget.title}"
                </strong>
                ? This cannot be undone.
              </p>

              <div className="md-upload-actions">

                <button
                  className="md-upload-cancel"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                >
                  Cancel
                </button>

                <button
                  className="md-upload-submit md-delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? 'Deleting...'
                    : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyDrafts