import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyUploads.css'

function MyUploads() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    title: '', authors: '', abstract: '',
    category: '', methodology: '', year: ''
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')
  const [uploadError, setUploadError] = useState('')

  useEffect(() => { fetchPapers() }, [])

  const fetchPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/papers/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPapers(response.data.papers)
    } catch {
      console.error('Failed to fetch papers')
    }
    setLoading(false)
  }

  const handleDelete = async (paperId, title) => {
    const confirm = window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)
    if (!confirm) return
    setDeleting(paperId)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://127.0.0.1:8000/papers/delete/${paperId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPapers(papers.filter(p => p.id !== paperId))
    } catch {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleUpload = async () => {
    if (!file) { setUploadError('Please select a PDF file'); return }
    if (!formData.title.trim()) { setUploadError('Please enter a title'); return }
    setUploading(true)
    setUploadError('')
    setUploadMessage('')
    try {
      const data = new FormData()
      Object.entries(formData).forEach(([k, v]) => data.append(k, v))
      data.append('file', file)
      const token = localStorage.getItem('token')
      await axios.post('http://127.0.0.1:8000/papers/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      setUploadMessage('Paper uploaded successfully!')
      setFormData({ title: '', authors: '', abstract: '', category: '', methodology: '', year: '' })
      setFile(null)
      fetchPapers()
    } catch {
      setUploadError('Upload failed. Please try again.')
    }
    setUploading(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setUploadMessage('')
    setUploadError('')
    setFormData({ title: '', authors: '', abstract: '', category: '', methodology: '', year: '' })
    setFile(null)
  }

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authors.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="myuploads-content">
      <div className="myuploads-card">
        <div className="myuploads-top">
          <h2 className="myuploads-heading">
            Uploaded Research Papers ({filtered.length})
          </h2>
          <div className="myuploads-top-right">
            <button
              className="myuploads-new-btn"
              onClick={() => setShowModal(true)}
            >
              + New Submission
            </button>
            <input
              className="myuploads-search"
              placeholder="Filter by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <p>Loading papers...</p>}
        {!loading && filtered.length === 0 && (
          <p className="myuploads-empty">
            {search ? 'No papers match your search.' : 'No papers uploaded yet. Click + New Submission to get started!'}
          </p>
        )}
        {!loading && filtered.length > 0 && (
          <table className="myuploads-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Authors</th>
                <th>Category</th>
                <th>Year</th>
                <th>Date Uploaded</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((paper) => (
                <tr key={paper.id}>
                  <td>{paper.title}</td>
                  <td>{paper.authors}</td>
                  <td>{paper.category}</td>
                  <td>{paper.year}</td>
                  <td>{new Date(paper.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="myuploads-delete"
                      onClick={() => handleDelete(paper.id, paper.title)}
                      disabled={deleting === paper.id}
                    >
                      {deleting === paper.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="myuploads-modal-overlay" onClick={handleCloseModal}>
          <div className="myuploads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="myuploads-modal-header">
              <h2 className="myuploads-modal-title">New Submission</h2>
              <button className="myuploads-modal-close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            {uploadMessage && <p className="myuploads-modal-success">{uploadMessage}</p>}
            {uploadError && <p className="myuploads-modal-error">{uploadError}</p>}

            <div className="myuploads-modal-field">
              <label>Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter research title"
              />
            </div>

            <div className="myuploads-modal-field">
              <label>Authors</label>
              <input
                name="authors"
                value={formData.authors}
                onChange={handleChange}
                placeholder="e.g. Juan Dela Cruz, Maria Santos"
              />
            </div>

            <div className="myuploads-modal-field">
              <label>Abstract</label>
              <textarea
                name="abstract"
                value={formData.abstract}
                onChange={handleChange}
                placeholder="Enter the research abstract"
                rows={3}
              />
            </div>

            <div className="myuploads-modal-row">
              <div className="myuploads-modal-field">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  <option>Science</option>
                  <option>Technology</option>
                  <option>Engineering</option>
                  <option>Mathematics</option>
                  <option>Humanities</option>
                  <option>Social Science</option>
                </select>
              </div>
              <div className="myuploads-modal-field">
                <label>Year</label>
                <input
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  min="2000"
                  max="2030"
                />
              </div>
            </div>

            <div className="myuploads-modal-field">
              <label>Methodology</label>
              <select name="methodology" value={formData.methodology} onChange={handleChange}>
                <option value="">Select methodology</option>
                <option>Qualitative</option>
                <option>Quantitative</option>
                <option>Mixed Methods</option>
                <option>Experimental</option>
                <option>Descriptive</option>
              </select>
            </div>

            <div className="myuploads-modal-field">
              <label>PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <p className="myuploads-modal-filename">Selected: {file.name}</p>
              )}
            </div>

            <div className="myuploads-modal-actions">
              <button
                className="myuploads-modal-cancel"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="myuploads-modal-submit"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyUploads