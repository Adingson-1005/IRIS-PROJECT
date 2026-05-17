import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyDrafts.css'
import PrivacyPolicy from './PrivacyPolicy'

function MyDrafts({ onClose }) {
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [myClass, setMyClass] = useState(null)
  const [classes, setClasses] = useState([])
  const [showClassSelect, setShowClassSelect] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [savingClass, setSavingClass] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [selectedDraft, setSelectedDraft] = useState(null)
  const [showPrivacyNote, setShowPrivacyNote] = useState(false)

  useEffect(() => {
    fetchMyClass()
    fetchClasses()
    fetchDrafts()
  }, [])

  const fetchMyClass = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/classes/my-class',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMyClass(response.data)
      if (!response.data.class_name) setShowClassSelect(true)
    } catch {
      console.error('Failed to fetch class')
    }
  }

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/classes/list',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setClasses(response.data.classes || [])
    } catch {
      console.error('Failed to fetch classes')
    }
  }

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        'https://iris-backend-7717.onrender.com/drafts/my-drafts',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setDrafts(response.data.drafts || [])
    } catch {
      console.error('Failed to fetch drafts')
    }
    setLoading(false)
  }

  const handleSaveClass = async () => {
    if (!selectedClass) return
    setSavingClass(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        'https://iris-backend-7717.onrender.com/classes/select',
        { class_name: selectedClass },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setShowClassSelect(false)
      fetchMyClass()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save class')
    }
    setSavingClass(false)
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
      fetchDrafts()
    } catch (err) {
      setUploadError(
        err.response?.data?.detail || 'Upload failed. Please try again.'
      )
    }

    setUploading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setDeleting(deleteTarget.id)

    try {
      const token = localStorage.getItem('token')

      await axios.delete(
        `https://iris-backend-7717.onrender.com/drafts/delete/${deleteTarget.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setDrafts(drafts.filter((d) => d.id !== deleteTarget.id))
      setDeleteTarget(null)

      if (selectedDraft?.id === deleteTarget.id) {
        setSelectedDraft(null)
      }
    } catch {
      alert('Failed to delete draft')
    }

    setDeleting(null)
  }

  return (
    <div className="md-overlay" onClick={onClose}>
      <div className="md-modal" onClick={(e) => e.stopPropagation()}>

        <div className="md-header">
          <div>
            <h2 className="md-title">My Drafts</h2>

            <p className="md-subtitle">
              {myClass?.class_name
                ? `${myClass.class_name} · Instructor: ${myClass.instructor_name || 'Not yet assigned'}`
                : 'Select your class to get started'}
            </p>
          </div>

          <div className="md-header-actions">
            {myClass?.class_name && (
              <button
                className="md-change-class-btn"
                onClick={() => {
                  setSelectedClass(myClass.class_name)
                  setShowClassSelect(true)
                }}
                title="Change class"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

                Change Class
              </button>
            )}

            <button className="md-close" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {showClassSelect && (
          <div className="md-class-prompt">
            <div className="md-class-prompt-inner">

              <div className="md-class-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="md-class-prompt-title">
                {myClass?.class_name
                  ? 'Change Your Class'
                  : 'Select Your Class'}
              </h3>

              <p className="md-class-prompt-sub">
                {myClass?.class_name
                  ? 'Changing your class will move your drafts to the new class instructor.'
                  : 'Select the class you are enrolled in. Your research instructor will be able to view and comment on your drafts.'}
              </p>

              <select
                className="md-class-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">— Choose your class —</option>

                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name}
                    {cls.instructor_name
                      ? ` — ${cls.instructor_name}`
                      : ' — No instructor yet'}
                  </option>
                ))}
              </select>

              <div className="md-class-actions">
                {myClass?.class_name && (
                  <button
                    className="md-class-cancel"
                    onClick={() => setShowClassSelect(false)}
                  >
                    Cancel
                  </button>
                )}

                <button
                  className="md-class-confirm"
                  onClick={handleSaveClass}
                  disabled={!selectedClass || savingClass}
                >
                  {savingClass ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!showClassSelect && (
          <div className="md-body">

            <div className="md-list-panel">
              <div className="md-list-top">
                <span className="md-list-count">
                  {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
                </span>

                <button
                  className="md-upload-btn"
                  onClick={() => setShowUpload(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  Upload Draft
                </button>
              </div>

              {loading && (
                <p className="md-loading">Loading drafts...</p>
              )}

              {!loading && drafts.length === 0 && (
                <div className="md-empty">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="md-empty-svg"
                  >
                    <path
                      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <p>No drafts yet. Upload your first draft!</p>
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
                  <div className="md-draft-file-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 2v6h6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <div className="md-draft-info">
                    <p className="md-draft-title">{draft.title}</p>

                    <p className="md-draft-meta">
                      {draft.file_type} ·{' '}
                      {new Date(draft.created_at).toLocaleDateString()}
                    </p>

                    {draft.comments?.length > 0 && (
                      <p className="md-draft-comments">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>

                        {draft.comments.length} comment
                        {draft.comments.length !== 1 ? 's' : ''}
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
                    <svg viewBox="0 0 24 24" fill="none">
                      <polyline
                        points="3 6 5 6 21 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="md-detail-panel">
              {!selectedDraft ? (
                <div className="md-detail-empty">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="md-empty-svg"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>

                  <p>Select a draft to view instructor comments</p>
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
                      {' · '}
                      {selectedDraft.file_type}
                    </p>

                    <a
                      href={selectedDraft.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="md-view-btn"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      View File
                    </a>
                  </div>

                  <div className="md-comments">
                    <h4 className="md-comments-title">
                      Instructor Comments (
                      {selectedDraft.comments?.length || 0})
                    </h4>

                    {selectedDraft.comments?.length === 0 && (
                      <p className="md-no-comments">
                        No comments yet. Your instructor will leave feedback
                        here.
                      </p>
                    )}

                    {selectedDraft.comments?.map((c) => (
                      <div key={c.id} className="md-comment-item">
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

                        <p className="md-comment-text">{c.comment}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {uploadError && (
                <p className="md-upload-error">{uploadError}</p>
              )}

              <div className="md-upload-field">
                <label>Title</label>

                <input
                  type="text"
                  placeholder="Enter the title of your draft"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="md-upload-field">
                <label>File (PDF or DOCX)</label>

                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setFile(e.target.files[0])}
                />

                {file && (
                  <p className="md-upload-filename">{file.name}</p>
                )}

                <p className="md-upload-privacy-note">
                  Your file will be stored securely and is only accessible to
                  your assigned research instructor. See our{' '}
                  <button
                    className="legal-link"
                    onClick={() => setShowPrivacyNote(true)}
                  >
                    Privacy Policy
                  </button>
                  .
                </p>
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
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <svg viewBox="0 0 24 24" fill="none">
                  <polyline
                    points="3 6 5 6 21 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4h6v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="md-confirm-title">Delete Draft?</h3>

              <p className="md-confirm-desc">
                Are you sure you want to delete{' '}
                <strong>"{deleteTarget.title}"</strong>?
                This cannot be undone.
              </p>

              <div className="md-upload-actions">
                <button
                  className="md-upload-cancel"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </button>

                <button
                  className="md-upload-submit md-delete-btn"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrivacyNote && (
          <PrivacyPolicy
            onClose={() => setShowPrivacyNote(false)}
          />
        )}

      </div>
    </div>
  )
}

export default MyDrafts