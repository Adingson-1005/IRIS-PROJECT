import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/UploadPaper.css'

function UploadPaper() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    abstract: '',
    category: '',
    methodology: '',
    year: ''
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please select a PDF file')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('authors', formData.authors)
      data.append('abstract', formData.abstract)
      data.append('category', formData.category)
      data.append('methodology', formData.methodology)
      data.append('year', formData.year)
      data.append('file', file)

      const token = localStorage.getItem('token')
      await axios.post('http://127.0.0.1:8000/papers/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })

      setMessage('Paper uploaded successfully!')
      setFormData({
        title: '',
        authors: '',
        abstract: '',
        category: '',
        methodology: '',
        year: ''
      })
      setFile(null)

    } catch (err) {
      setError('Upload failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1 className="upload-header-title">IRIS — Upload Research Paper</h1>
        <button className="upload-back" onClick={() => navigate('/instructor')}>
          Back to Dashboard
        </button>
      </div>

      <div className="upload-form-wrapper">
        <div className="upload-card">
          <h2 className="upload-form-title">Paper Details</h2>

          {message && <p className="upload-success">{message}</p>}
          {error && <p className="upload-error">{error}</p>}

          <div className="upload-field">
            <label>Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter research title"
            />
          </div>

          <div className="upload-field">
            <label>Authors</label>
            <input
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              placeholder="e.g. Juan Dela Cruz, Maria Santos"
            />
          </div>

          <div className="upload-field">
            <label>Abstract</label>
            <textarea
              name="abstract"
              value={formData.abstract}
              onChange={handleChange}
              placeholder="Enter the research abstract"
              rows={4}
            />
          </div>

          <div className="upload-row">
            <div className="upload-field">
              <label>Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                <option value="Science">Science</option>
                <option value="Technology">Technology</option>
                <option value="Engineering">Engineering</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Humanities">Humanities</option>
                <option value="Social Science">Social Science</option>
              </select>
            </div>

            <div className="upload-field">
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

          <div className="upload-field">
            <label>Methodology</label>
            <select
              name="methodology"
              value={formData.methodology}
              onChange={handleChange}
            >
              <option value="">Select methodology</option>
              <option value="Qualitative">Qualitative</option>
              <option value="Quantitative">Quantitative</option>
              <option value="Mixed Methods">Mixed Methods</option>
              <option value="Experimental">Experimental</option>
              <option value="Descriptive">Descriptive</option>
            </select>
          </div>

          <div className="upload-field">
            <label>PDF File</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file && <p className="upload-filename">Selected: {file.name}</p>}
          </div>

          <button
            className="upload-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Paper'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadPaper