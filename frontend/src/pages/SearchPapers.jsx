import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/SearchPapers.css'
import PaperView from '../components/PaperView'

function SearchPapers() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState({ category: '', methodology: '', year: '' })
  const [allPapers, setAllPapers] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [mode, setMode] = useState('browse')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitFile, setSubmitFile] = useState(null)
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)

  useEffect(() => { fetchAllPapers() }, [])

  const fetchAllPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/papers/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAllPapers(response.data.papers)
    } catch {
      setError('Failed to load papers.')
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!keyword.trim()) { setMode('browse'); return }
    setSearching(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const params = { keyword }
      if (filters.category) params.category = filters.category
      if (filters.methodology) params.methodology = filters.methodology
      if (filters.year) params.year = filters.year
      const response = await axios.get('http://127.0.0.1:8000/search/', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      })
      setSearchResults(response.data.results)
      setMode('search')
    } catch {
      setError('Search failed. Please try again.')
    }
    setSearching(false)
  }

  const handleClear = () => {
    setKeyword('')
    setFilters({ category: '', methodology: '', year: '' })
    setMode('browse')
    setSearchResults([])
    setError('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const applyFilters = (papers) => papers.filter(p => {
    if (filters.category && p.category !== filters.category) return false
    if (filters.methodology && p.methodology !== filters.methodology) return false
    if (filters.year && String(p.year) !== String(filters.year)) return false
    return true
  })

  const handleSubmitPaper = async () => {
    if (!submitFile) { setSubmitError('Please select a PDF file'); return }
    if (!submitTitle.trim()) { setSubmitError('Please enter a title'); return }
    setSubmitLoading(true)
    setSubmitError('')
    setSubmitMessage('')
    try {
      const data = new FormData()
      data.append('title', submitTitle)
      data.append('file', submitFile)
      const token = localStorage.getItem('token')
      await axios.post('http://127.0.0.1:8000/ai/submit-draft', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      setSubmitMessage('Draft submitted! AI feedback will appear here once built.')
      setSubmitFile(null)
      setSubmitTitle('')
    } catch {
      setSubmitError('Submission failed. Please try again.')
    }
    setSubmitLoading(false)
  }

  const displayPapers = mode === 'search'
    ? searchResults
    : applyFilters(allPapers)

  return (
    <div className="sp-container">
      <div className="sp-header">
        <h1 className="sp-header-title">IRIS — Research Repository</h1>
        <div className="sp-header-right">
          <button
            className="sp-submit-btn"
            onClick={() => setShowModal(true)}
            title="Submit your research draft"
          >
            +
          </button>
          <button
            className="sp-logout-btn"
            onClick={() => { localStorage.clear(); navigate('/') }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="sp-body">
        <div className="sp-search-row">
          <input
            className="sp-input"
            type="text"
            placeholder="Search by keyword..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="sp-search-btn"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? '...' : 'Search'}
          </button>
          {mode === 'search' && (
            <button className="sp-clear-btn" onClick={handleClear}>Clear</button>
          )}
        </div>

        <div className="sp-filters">
          <select
            className="sp-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="STEM">STEM</option>
            <option value="HUMSS">HUMSS</option>
            <option value="ABM">ABM</option>
            <option value="GAS">GAS</option>
          </select>

          <select
            className="sp-select"
            value={filters.methodology}
            onChange={(e) => setFilters({ ...filters, methodology: e.target.value })}
          >
            <option value="">All Methodologies</option>
            <option value="Qualitative">Qualitative</option>
            <option value="Quantitative">Quantitative</option>
            <option value="Mixed Methods">Mixed Methods</option>
            <option value="Experimental">Experimental</option>
            <option value="Descriptive">Descriptive</option>
          </select>

          <input
            className="sp-select sp-year"
            type="number"
            placeholder="Year"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            min="2000"
            max="2030"
          />
        </div>

        {error && <p className="sp-error">{error}</p>}

        <div className="sp-status-bar">
          {mode === 'browse' && !loading && (
            <p className="sp-results-label">
              Showing all papers ({displayPapers.length})
            </p>
          )}
          {mode === 'search' && !searching && (
            <p className="sp-results-label">
              {displayPapers.length} result{displayPapers.length !== 1 ? 's' : ''} found for "{keyword}"
              <span className="sp-relevance-note"> — sorted by relevance</span>
            </p>
          )}
        </div>

        {loading && <div className="sp-empty-state"><p>Loading papers...</p></div>}

        {!loading && displayPapers.length === 0 && mode === 'browse' && (
          <div className="sp-empty-state">
            <p>No papers in the repository yet.</p>
          </div>
        )}

        {!loading && displayPapers.length === 0 && mode === 'search' && (
          <div className="sp-empty-state">
            <p>No papers found for "{keyword}". Try a different keyword.</p>
          </div>
        )}

        <div className="sp-results">
          {displayPapers.map((paper) => {
            const id = paper.paper_id || paper.id
            return (
              <div key={id} className="sp-card" onClick={() => setSelectedPaper(paper)} style={{ cursor: 'pointer' }}>
                <h3 className="sp-card-title">{paper.title}</h3>
                <p className="sp-card-authors">{paper.authors}</p>
                <div className="sp-tags">
                  {paper.category && <span className="sp-tag">{paper.category}</span>}
                  {paper.methodology && <span className="sp-tag">{paper.methodology}</span>}
                  {paper.year && <span className="sp-tag">{paper.year}</span>}
                </div>
                <p className="sp-card-abstract">
                  {paper.abstract
                    ? paper.abstract.substring(0, 220) + '...'
                    : 'No abstract available.'}
                </p>
                {mode === 'search' && paper.score && (
                  <p className="sp-score">Relevance score: {paper.score}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="sp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Research Draft</h2>

            {submitMessage && <p className="sp-modal-success">{submitMessage}</p>}
            {submitError && <p className="sp-modal-error">{submitError}</p>}

            <div className="sp-modal-field">
              <label>Title of your paper</label>
              <input
                type="text"
                placeholder="Enter your paper title"
                value={submitTitle}
                onChange={(e) => setSubmitTitle(e.target.value)}
              />
            </div>

            <div className="sp-modal-field">
              <label>Upload your draft (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSubmitFile(e.target.files[0])}
              />
              {submitFile && (
                <p style={{ fontSize: '12px', color: '#0e9f6e', marginTop: '4px' }}>
                  Selected: {submitFile.name}
                </p>
              )}
            </div>

            <div className="sp-modal-actions">
              <button
                className="sp-modal-cancel"
                onClick={() => {
                  setShowModal(false)
                  setSubmitMessage('')
                  setSubmitError('')
                  setSubmitFile(null)
                  setSubmitTitle('')
                }}
              >
                Cancel
              </button>
              <button
                className="sp-modal-submit"
                onClick={handleSubmitPaper}
                disabled={submitLoading}
              >
                {submitLoading ? 'Submitting...' : 'Submit Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPaper && (
        <PaperView
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  )
}

export default SearchPapers