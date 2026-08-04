import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyUploads.css'
import '../css/ConfirmModal.css'

const API_BASE = 'https://iris-backend-7717.onrender.com'

function MyUploads() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Upload modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    title: '',
    authors: '',
    abstract: '',
    category: '',
    methodology: '',
    year: ''
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showUploadingModal, setShowUploadingModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => { fetchMyPapers() }, [])

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/papers/my-papers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(response.data.papers || [])
    } catch {
      console.error('Failed to fetch my papers')
    }
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      title: '',
      authors: '',
      abstract: '',
      category: '',
      methodology: '',
      year: ''
    })
    setFile(null)
  }

  const clearUploadState = () => {
    setUploadError('')
    setUploadSuccess('')
    setUploadMessage('')
    setUploadProgress(0)
  }

  const handleFormChange = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  const handleUpload = async () => {
    const { title, authors, abstract, category, methodology, year } = form

    if (!title.trim()) { setUploadError('Title is required'); return }
    if (!authors.trim()) { setUploadError('Authors are required'); return }
    if (!abstract.trim()) { setUploadError('Abstract is required'); return }
    if (!category) { setUploadError('Please select a strand'); return }
    if (!methodology) { setUploadError('Please select a methodology'); return }
    if (!year || isNaN(year)) { setUploadError('Please enter a valid year'); return }
    if (!file) { setUploadError('Please select a PDF file'); return }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    setUploadMessage('')
    setUploadProgress(0)
    setShowUploadingModal(true)

    try {
      const data = new FormData()
      data.append('title', title)
      data.append('authors', authors)
      data.append('abstract', abstract)
      data.append('category', category)
      data.append('methodology', methodology)
      data.append('year', year)
      data.append('file', file)

      const token = localStorage.getItem('token')
      await axios.post(`${API_BASE}/papers/upload`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(pct)
          setUploadMessage(pct < 100 ? 'Uploading your paper...' : 'Finishing up...')
        }
      })

      setShowUploadingModal(false)
      setShowModal(false)
      setShowSuccessModal(true)
      setUploadSuccess('Paper uploaded successfully')
      setUploadMessage('Your paper has been uploaded successfully.')
      setUploadProgress(100)
      resetForm()
      setSimilarPapers([])
      setShowSimilarWarning(false)
      fetchMyPapers()
    } catch (err) {
      setShowUploadingModal(false)
      setUploadError(err.response?.data?.detail || 'Upload failed. Please try again.')
    }

    setUploading(false)
  }

  const checkSimilar = async (title, abstract) => {
  if (!title.trim() && !abstract.trim()) return
  setCheckingSimilar(true)
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post(
      'https://iris-backend-7717.onrender.com/papers/check-similar',
      { title, abstract },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const results = response.data.similar_papers || []
    setSimilarPapers(results)
    if (results.length > 0) setShowSimilarWarning(true)
  } catch {
    console.error('Similarity check failed')
  }
  setCheckingSimilar(false)
}

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/papers/delete/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(papers.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const closeModal = () => {
    if (uploading) return
    setShowModal(false)
    resetForm()
    clearUploadState()
    setShowSuccessModal(false)
    setShowUploadingModal(false)
  }

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.authors?.toLowerCase().includes(q)
    )
  })

  const [similarPapers, setSimilarPapers] = useState([])
const [checkingSimlar, setCheckingSimilar] = useState(false)
const [showSimilarWarning, setShowSimilarWarning] = useState(false)

  return (
    <div className="myuploads-content">
      <div className="myuploads-card">

        <div className="myuploads-page-header">
          <h2 className="myuploads-page-title">My Uploads</h2>
          <p className="myuploads-page-sub">
            Papers you have contributed to the IRIS repository
          </p>
        </div>

        <div className="myuploads-top">
          <h3 className="myuploads-heading">
            {papers.length} paper{papers.length !== 1 ? 's' : ''} uploaded
          </h3>

          <div className="myuploads-top-right">
            <input
              className="myuploads-search"
              placeholder="🔍  Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="myuploads-new-btn"
              onClick={() => setShowModal(true)}
            >
              + Upload Paper
            </button>
          </div>
        </div>

        {loading && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">⏳</div>
            <p>Loading your papers...</p>
          </div>
        )}

        {!loading && papers.length === 0 && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">📄</div>
            <p>You haven't uploaded any papers yet. Click "Upload Paper" to add your first one.</p>
          </div>
        )}

        {!loading && papers.length > 0 && filtered.length === 0 && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">🔍</div>
            <p>No papers match your search.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="myuploads-table-wrapper">
            <table className="myuploads-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Strand</th>
                  <th>Year</th>
                  <th>Downloads</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((paper) => (
                  <tr key={paper.id}>
                    <td>{paper.title}</td>
                    <td>{paper.authors}</td>
                    <td>
                      <span className="myuploads-strand-badge">
                        {paper.category || 'N/A'}
                      </span>
                    </td>
                    <td>{paper.year}</td>
                    <td>{paper.downloads || 0}</td>
                    <td>
                      {paper.created_at
                        ? new Date(paper.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="myuploads-delete"
                        onClick={() =>
                          setDeleteTarget({ id: paper.id, title: paper.title })
                        }
                        disabled={deleting === paper.id}
                      >
                        {deleting === paper.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {showUploadingModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="upload-spinner"></div>
            <h3 className="confirm-title">Uploading Paper...</h3>
            <p className="confirm-desc">
              Please wait while your paper is being uploaded and indexed.
            </p>
            <div className="myuploads-progress-bar-wrapper">
              <div
                className="myuploads-progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="myuploads-progress-pct">{uploadProgress}%</p>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="myuploads-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="myuploads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="myuploads-modal-header">
              <h3 className="myuploads-modal-title">Upload Complete</h3>
            </div>
            <p className="myuploads-modal-success">{uploadSuccess || uploadMessage}</p>
            <div className="myuploads-modal-actions">
              <button className="myuploads-modal-submit" onClick={() => setShowSuccessModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showModal && (
        <div className="myuploads-modal-overlay" onClick={closeModal}>
          <div
            className="myuploads-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="myuploads-modal-header">
              <h3 className="myuploads-modal-title">Upload Paper</h3>
              <button
                className="myuploads-modal-close-btn"
                onClick={closeModal}
                disabled={uploading}
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <p className="myuploads-modal-error">{uploadError}</p>
            )}
            {uploadSuccess && (
              <p className="myuploads-modal-success">{uploadSuccess}</p>
            )}

            <div className="myuploads-modal-field">
              <label>Title</label>
              <input
                type="text"
                placeholder="Enter the paper title"
                value={form.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
              />
            </div>

            <div className="myuploads-modal-field">
              <label>Authors</label>
              <input
                type="text"
                placeholder="e.g. Dela Cruz, J., Santos, M."
                value={form.authors}
                onChange={(e) => handleFormChange('authors', e.target.value)}
              />
            </div>

            <div className="myuploads-modal-field">
              <label>Abstract</label>
              <textarea
                rows={4}
                placeholder="Enter abstract"
                value={form.abstract}
                onChange={(e) => handleFormChange('abstract', e.target.value)}
              />
            </div>

            <button
              className="myuploads-check-similar-btn"
              type="button"
              onClick={() => checkSimilar(form.title, form.abstract)}
              disabled={checkingSimlar || (!form.title && !form.abstract)}
            >
              {checkingSimlar ? 'Checking...' : '🔍 Check for Similar Studies'}
            </button>

            {showSimilarWarning && similarPapers.length > 0 && (
              <div className="myuploads-similar-warning">
                <p className="myuploads-similar-title">
                  ⚠️ Similar papers found in the repository:
                </p>
                {similarPapers.map((p) => (
                  <div key={p.paper_id} className="myuploads-similar-item">
                    <div className="myuploads-similar-pct">{p.similarity}%</div>
                    <div>
                      <p className="myuploads-similar-paper-title">{p.title}</p>
                      <p className="myuploads-similar-paper-meta">
                        {p.authors} · {p.category} · {p.year}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="myuploads-similar-note">
                  You can still upload this paper if it is sufficiently different.
                </p>
              </div>
            )}

            {showSimilarWarning && similarPapers.length === 0 && (
              <div className="myuploads-no-similar">
                ✅ No similar papers found in the repository.
              </div>
            )}

            <div className="myuploads-modal-row">
              <div className="myuploads-modal-field">
                <label>Strand</label>
                <select
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  <option value="">— Select strand —</option>
                  <option value="STEM">STEM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="ABM">ABM</option>
                  <option value="GAS">GAS</option>
                </select>
              </div>

              <div className="myuploads-modal-field">
                <label>Methodology</label>
                <select
                  value={form.methodology}
                  onChange={(e) =>
                    handleFormChange('methodology', e.target.value)
                  }
                >
                  <option value="">— Select methodology —</option>
                  <option value="Qualitative">Qualitative</option>
                  <option value="Quantitative">Quantitative</option>
                  <option value="Mixed Methods">Mixed Methods</option>
                  <option value="Experimental">Experimental</option>
                  <option value="Descriptive">Descriptive</option>
                </select>
              </div>

              <div className="myuploads-modal-field">
                <label>Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2030"
                  placeholder="2026"
                  value={form.year}
                  onChange={(e) => handleFormChange('year', e.target.value)}
                />
              </div>
            </div>

            <div className="myuploads-modal-field">
              <label>PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <p className="myuploads-modal-filename">📄 {file.name}</p>
              )}
            </div>

            <div className="myuploads-modal-actions">
              <button
                className="myuploads-modal-cancel"
                onClick={closeModal}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="myuploads-modal-submit"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete Paper?</h3>
            <p className="confirm-desc">
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget.title}"</strong>? This cannot be undone.
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

export default MyUploads
