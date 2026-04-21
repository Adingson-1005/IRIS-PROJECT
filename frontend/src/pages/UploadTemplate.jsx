import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/UploadTemplate.css'

function UploadTemplate() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [currentTemplate, setCurrentTemplate] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => { fetchCurrentTemplate() }, [])

  const fetchCurrentTemplate = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/templates/current', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCurrentTemplate(response.data.template)
      setIsOwner(response.data.is_owner)
    } catch {
      console.error('Failed to fetch template')
    }
    setFetching(false)
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a PDF file'); return }
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = new FormData()
      data.append('file', file)
      const token = localStorage.getItem('token')
      await axios.post('http://127.0.0.1:8000/templates/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      setMessage('Template uploaded successfully! Students can now submit their drafts.')
      setFile(null)
      fetchCurrentTemplate()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Upload failed. Please try again.'
      )
    }
    setLoading(false)
  }

  if (fetching) {
    return <div className="ut-loading">Loading template info...</div>
  }

  return (
    <div className="ut-container">
      <h2 className="ut-heading">Research Template</h2>

      {currentTemplate ? (
        <div className="ut-current-card">
          <div className="ut-current-icon">✓</div>
          <div className="ut-current-info">
            <p className="ut-current-title">Active Template</p>
            <p className="ut-current-date">
              Uploaded by <strong>{currentTemplate.uploaded_by_name}</strong> on{' '}
              {new Date(currentTemplate.created_at).toLocaleDateString()}
            </p>
            {isOwner && (
              <p className="ut-owner-note">You uploaded this template. You can replace it.</p>
            )}
          </div>
          <span className="ut-active-badge">Active</span>
        </div>
      ) : (
        <div className="ut-no-template">
          No template uploaded yet. Upload one so students can submit their drafts.
        </div>
      )}

      {currentTemplate && !isOwner ? (
        <div className="ut-locked-card">
          <p className="ut-locked-icon">🔒</p>
          <p className="ut-locked-title">Template locked</p>
          <p className="ut-locked-desc">
            This template was uploaded by <strong>{currentTemplate.uploaded_by_name}</strong>.
            Only they can replace it. Contact them if a new template is needed.
          </p>
        </div>
      ) : (
        <div className="ut-upload-card">
          <h3 className="ut-upload-title">
            {currentTemplate ? 'Replace Current Template' : 'Upload Template'}
          </h3>
          <p className="ut-upload-desc">
            Upload a PDF research template. This will be the standard
            format that student drafts are compared against.
            {currentTemplate && ' Uploading a new one will replace the existing template.'}
          </p>

          {message && <p className="ut-success">{message}</p>}
          {error && <p className="ut-error">{error}</p>}

          <div className="ut-file-field">
            <label>Select PDF Template</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && (
              <p className="ut-filename">Selected: {file.name}</p>
            )}
          </div>

          <button
            className="ut-submit"
            onClick={handleUpload}
            disabled={loading || !file}
          >
            {loading
              ? 'Uploading...'
              : currentTemplate ? 'Replace Template' : 'Upload Template'}
          </button>
        </div>
      )}
    </div>
  )
}

export default UploadTemplate