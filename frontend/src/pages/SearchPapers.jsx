import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/SearchPapers.css'
import PaperView from '../components/PaperView'

const STRAND_COLORS = {
  STEM:  { bg: '#e8f0fe', color: '#1a56db' },
  HUMSS: { bg: '#fce7f3', color: '#be185d' },
  ABM:   { bg: '#fef3c7', color: '#92400e' },
  GAS:   { bg: '#d1fae5', color: '#065f46' },
  TVL:   { bg: '#ede9fe', color: '#5b21b6' },
}

const ITEMS_PER_PAGE = 8

function SearchPapers() {
  const navigate = useNavigate()
  const full_name = localStorage.getItem('full_name') || 'Student'
  const [keyword, setKeyword] = useState('')
  const [filters, setFilters] = useState({ category: '', methodology: '', year: '' })
  const [allPapers, setAllPapers] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [mode, setMode] = useState('browse')
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState('desc')

  // AI Checker states
  const [showModal, setShowModal] = useState(false)
  const [submitFile, setSubmitFile] = useState(null)
  const [submitTitle, setSubmitTitle] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [aiResult, setAiResult] = useState(null)

  // RAG states
  const [showRagModal, setShowRagModal] = useState(false)
  const [ragQuestion, setRagQuestion] = useState('')
  const [ragLoading, setRagLoading] = useState(false)
  const [ragAnswer, setRagAnswer] = useState(null)
  const [ragError, setRagError] = useState('')

  useEffect(() => { fetchAllPapers() }, [])

  const fetchAllPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('https://iris-backend-7717.onrender.com/papers/list', {
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
    setCurrentPage(1)
    try {
      const token = localStorage.getItem('token')
      const params = { keyword }
      if (filters.category) params.category = filters.category
      if (filters.methodology) params.methodology = filters.methodology
      if (filters.year) params.year = filters.year
      const response = await axios.get('https://iris-backend-7717.onrender.com/search/', {
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
    setCurrentPage(1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const applyFilters = (papers) => papers
    .filter(p => {
      if (filters.category && p.category !== filters.category) return false
      if (filters.methodology && p.methodology !== filters.methodology) return false
      if (filters.year && String(p.year) !== String(filters.year)) return false
      return true
    })
    .sort((a, b) => {
      const dA = new Date(a.created_at), dB = new Date(b.created_at)
      return sortOrder === 'desc' ? dB - dA : dA - dB
    })

  const handleSubmitPaper = async () => {
    if (!submitFile) { setSubmitError('Please select a PDF file'); return }
    if (!submitTitle.trim()) { setSubmitError('Please enter a title'); return }
    setSubmitLoading(true)
    setSubmitError('')
    setAiResult(null)
    try {
      const data = new FormData()
      data.append('title', submitTitle)
      data.append('file', submitFile)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'https://iris-backend-7717.onrender.com/ai/submit-draft', data,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      )
      setAiResult(response.data)
      setSubmitFile(null)
      setSubmitTitle('')
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Submission failed. Please try again.')
    }
    setSubmitLoading(false)
  }

  const handleAskRag = async () => {
    if (!ragQuestion.trim()) { setRagError('Please enter a question'); return }
    setRagLoading(true)
    setRagError('')
    setRagAnswer(null)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'https://iris-backend-7717.onrender.com/rag/ask',
        { question: ragQuestion },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setRagAnswer(response.data)
    } catch (err) {
      setRagError(err.response?.data?.detail || 'Failed to get answer. Please try again.')
    }
    setRagLoading(false)
  }

  const closeCheckerModal = () => {
    setShowModal(false); setSubmitError(''); setSubmitFile(null)
    setSubmitTitle(''); setAiResult(null)
  }
  const closeRagModal = () => {
    setShowRagModal(false); setRagQuestion(''); setRagAnswer(null); setRagError('')
  }

  const initials = (name) => {
    if (!name) return '?'
    return name.split(',')[0].trim().split(' ')
      .map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const strandBadge = (cat) => STRAND_COLORS[cat] || { bg: '#f0f4f8', color: '#555' }

  const displayPapers = mode === 'search' ? searchResults : applyFilters(allPapers)
  const totalPages = Math.max(1, Math.ceil(displayPapers.length / ITEMS_PER_PAGE))
  const paginated = displayPapers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="sp-page">

      {/* ── Top Nav ── */}
      <header className="sp-nav">
        <div className="sp-nav-left">
          <span className="sp-logo">IRIS Research Repository</span>
          <nav className="sp-nav-links">
            <a className="sp-nav-link sp-nav-active" href="#">Repository</a>
            <a className="sp-nav-link" href="#">Methodologies</a>
            <a className="sp-nav-link" href="#">Strands</a>
            <a className="sp-nav-link" href="#">Archives</a>
          </nav>
        </div>
        <div className="sp-nav-right">
          <button className="sp-nav-icon" title="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button className="sp-nav-icon" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div className="sp-avatar-wrap">
            <div className="sp-user-avatar">{initials(full_name)}</div>
          </div>
          <button className="sp-logout-btn" onClick={() => { localStorage.clear(); navigate('/') }}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="sp-body">

        {/* Search bar */}
        <div className="sp-search-wrap">
          <div className="sp-search-bar">
            <svg className="sp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="sp-search-input"
              type="text"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="sp-search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Filters row */}
        <div className="sp-filters-row">
          <div className="sp-filter-pills">
            <div className="sp-filter-pill">
              <select
                value={filters.category}
                onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setCurrentPage(1) }}
              >
                <option value="">All Strands</option>
                <option value="STEM">STEM</option>
                <option value="HUMSS">HUMSS</option>
                <option value="ABM">ABM</option>
                <option value="GAS">GAS</option>
                <option value="TVL">TVL</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <div className="sp-filter-pill">
              <select
                value={filters.methodology}
                onChange={(e) => { setFilters({ ...filters, methodology: e.target.value }); setCurrentPage(1) }}
              >
                <option value="">All Methodologies</option>
                <option value="Qualitative">Qualitative</option>
                <option value="Quantitative">Quantitative</option>
                <option value="Mixed Methods">Mixed Methods</option>
                <option value="Experimental">Experimental</option>
                <option value="Descriptive">Descriptive</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </div>

            <div className="sp-filter-pill sp-filter-pill-year">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <input
                type="number"
                placeholder="Year"
                value={filters.year}
                onChange={(e) => { setFilters({ ...filters, year: e.target.value }); setCurrentPage(1) }}
                min="2000"
                max="2030"
              />
            </div>

            {(filters.category || filters.methodology || filters.year || mode === 'search') && (
              <button className="sp-clear-link" onClick={handleClear}>✕ Clear</button>
            )}
          </div>

          <div className="sp-filters-right">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7e3af2" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/>
            </svg>
            <span className="sp-adv-label">Advanced Filters</span>
          </div>
        </div>

        {error && <p className="sp-error">{error}</p>}

        {/* Status + sort */}
        <div className="sp-status-row">
          <p className="sp-status-label">
            {mode === 'browse' && !loading && (
              <>Showing all papers <span className="sp-count-badge">({displayPapers.length})</span></>
            )}
            {mode === 'search' && !searching && (
              <>{displayPapers.length} result{displayPapers.length !== 1 ? 's' : ''} for "<strong>{keyword}</strong>"<span className="sp-rel-note"> — sorted by relevance</span></>
            )}
          </p>
          {mode === 'browse' && (
            <div className="sp-sort-wrap">
              <span className="sp-sort-label">Sort by:</span>
              <button
                className={`sp-sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => { setSortOrder('desc'); setCurrentPage(1) }}
              >Most Recent</button>
              <button
                className={`sp-sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => { setSortOrder('asc'); setCurrentPage(1) }}
              >Oldest</button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="sp-divider" />

        {/* Grid */}
        {loading && <div className="sp-empty-state"><p>Loading papers...</p></div>}

        {!loading && displayPapers.length === 0 && (
          <div className="sp-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <p>{mode === 'search' ? `No papers found for "${keyword}".` : 'No papers in the repository yet.'}</p>
          </div>
        )}

        {!loading && displayPapers.length > 0 && (
          <div className="sp-grid">
            {paginated.map((paper) => {
              const id = paper.paper_id || paper.id
              const badge = strandBadge(paper.category)
              const authorList = paper.authors?.split(',') || []
              const extraCount = authorList.length - 1
              return (
                <div key={id} className="sp-card" onClick={() => setSelectedPaper(paper)}>
                  <div className="sp-card-top">
                    <span className="sp-strand-badge" style={{ background: badge.bg, color: badge.color }}>
                      {paper.category || 'N/A'}
                    </span>
                    <span className="sp-card-year">{paper.year}</span>
                  </div>

                  <h3 className="sp-card-title">{paper.title}</h3>

                  <div className="sp-card-authors-row">
                    <div className="sp-avatar-sm">{initials(paper.authors)}</div>
                    <span className="sp-author-name">
                      {authorList[0]?.trim()}
                      {extraCount > 0 && (
                        <span className="sp-author-extra">+{extraCount}</span>
                      )}
                    </span>
                  </div>

                  <p className="sp-card-abstract">
                    {paper.abstract ? paper.abstract.substring(0, 130) + '...' : 'No abstract available.'}
                  </p>

                  <div className="sp-card-footer">
                    <span className="sp-method-badge">{paper.methodology?.toUpperCase()}</span>
                    {paper.category && paper.category !== paper.methodology && (
                      <span className="sp-method-badge sp-method-badge-alt">{paper.category?.toUpperCase()}</span>
                    )}
                    {mode === 'search' && paper.score && (
                      <span className="sp-relevance-score">Score: {paper.score}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="sp-pagination">
            <button
              className="sp-page-btn sp-page-nav"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >‹</button>

            {getPageNumbers().map((pg, i) =>
              pg === '...' ? (
                <span key={`ellipsis-${i}`} className="sp-page-ellipsis">...</span>
              ) : (
                <button
                  key={pg}
                  className={`sp-page-btn ${currentPage === pg ? 'sp-page-active' : ''}`}
                  onClick={() => setCurrentPage(pg)}
                >{pg}</button>
              )
            )}

            <button
              className="sp-page-btn sp-page-nav"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >›</button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="sp-footer">
        <div className="sp-footer-left">
          <span className="sp-footer-brand">IRIS Repository</span>
          <span className="sp-footer-copy">© 2024 IRIS Research Repository. All rights reserved.</span>
        </div>
        <div className="sp-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
          <a href="#">Institutional Access</a>
        </div>
      </footer>

      {/* ── FABs ── */}
      <div className="sp-fab-container">
        <div className="sp-fab-group">
          <span className="sp-fab-label">Ask AI</span>
          <button className="sp-fab sp-fab-rag" onClick={() => setShowRagModal(true)} title="Ask AI about research">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" fill="white" stroke="white" strokeWidth="0.5"/>
              <circle cx="8" cy="10" r="1.2" fill="#1a56db"/>
              <circle cx="12" cy="10" r="1.2" fill="#1a56db"/>
              <circle cx="16" cy="10" r="1.2" fill="#1a56db"/>
            </svg>
          </button>
        </div>
        <div className="sp-fab-group">
          <span className="sp-fab-label">Check Paper</span>
          <button className="sp-fab sp-fab-checker" onClick={() => setShowModal(true)} title="Submit your research draft">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z" fill="white"/>
              <path d="M14 2V8H20" stroke="#7e3af2" strokeWidth="1.5" fill="none"/>
              <path d="M9 13L11 15L15 11" stroke="#7e3af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── AI Checker Modal ── */}
      {showModal && (
        <div className="sp-modal-overlay" onClick={closeCheckerModal}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            {!aiResult ? (
              <>
                <div className="sp-modal-header">
                  <div className="sp-modal-icon sp-modal-icon-checker">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z" fill="#ede9fe"/>
                      <path d="M14 2V8H20" stroke="#7e3af2" strokeWidth="1.5" fill="none"/>
                      <path d="M9 13L11 15L15 11" stroke="#7e3af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Check My Research</h2>
                    <p className="sp-modal-desc">Upload your draft and AI will compare it against the instructor's template.</p>
                  </div>
                </div>
                {submitError && <p className="sp-modal-error">{submitError}</p>}
                <div className="sp-modal-field">
                  <label>Title of your paper</label>
                  <input type="text" placeholder="Enter your paper title" value={submitTitle} onChange={(e) => setSubmitTitle(e.target.value)} />
                </div>
                <div className="sp-modal-field">
                  <label>Upload your draft (PDF only)</label>
                  <input type="file" accept=".pdf" onChange={(e) => setSubmitFile(e.target.files[0])} />
                  {submitFile && <p className="sp-modal-filename">📄 {submitFile.name}</p>}
                </div>
                <div className="sp-modal-actions">
                  <button className="sp-modal-cancel" onClick={closeCheckerModal} disabled={submitLoading}>Cancel</button>
                  <button className="sp-modal-submit sp-modal-submit-checker" onClick={handleSubmitPaper} disabled={submitLoading}>
                    {submitLoading ? 'Analyzing...' : 'Submit for AI Review'}
                  </button>
                </div>
                {submitLoading && (
                  <div className="sp-analyzing">
                    <div className="sp-spinner sp-spinner-checker"></div>
                    <p>AI is analyzing your paper. This may take 15–30 seconds...</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="sp-result-header">
                  <h2>AI Feedback Results</h2>
                  <p className="sp-result-title">{aiResult.title}</p>
                </div>
                <div className={`sp-score-circle ${aiResult.score >= 75 ? 'sp-score-high' : aiResult.score >= 50 ? 'sp-score-mid' : 'sp-score-low'}`}>
                  <span className="sp-score-num">{aiResult.score}%</span>
                  <span className="sp-score-label">Accuracy Score</span>
                </div>
                <div className="sp-feedback-box">
                  {aiResult.feedback.split('\n').map((line, i) => {
                    if (line.startsWith('SCORE:')) return null
                    if (['STRENGTHS:', 'TO IMPROVE:', 'SUGGESTIONS:', 'OVERALL FEEDBACK:', 'DOCUMENT TYPE:'].some(s => line.startsWith(s)))
                      return <p key={i} className="sp-feedback-section">{line}</p>
                    if (line.startsWith('- ')) return <p key={i} className="sp-feedback-item">{line}</p>
                    if (line.trim()) return <p key={i} className="sp-feedback-text">{line}</p>
                    return null
                  })}
                </div>
                <button className="sp-modal-submit sp-modal-submit-checker" onClick={closeCheckerModal}>Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── RAG Modal ── */}
      {showRagModal && (
        <div className="sp-modal-overlay" onClick={closeRagModal}>
          <div className="sp-modal sp-rag-modal" onClick={(e) => e.stopPropagation()}>
            {!ragAnswer ? (
              <>
                <div className="sp-modal-header">
                  <div className="sp-modal-icon sp-modal-icon-rag">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z" fill="#dbeafe" stroke="#1a56db" strokeWidth="1"/>
                      <circle cx="8" cy="10" r="1.2" fill="#1a56db"/>
                      <circle cx="12" cy="10" r="1.2" fill="#1a56db"/>
                      <circle cx="16" cy="10" r="1.2" fill="#1a56db"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Ask AI Guidance</h2>
                    <p className="sp-modal-desc">Ask a research question and AI will answer based on papers in the repository.</p>
                  </div>
                </div>
                {ragError && <p className="sp-modal-error">{ragError}</p>}
                <div className="sp-modal-field">
                  <label>Your research question</label>
                  <textarea className="sp-rag-textarea" placeholder="e.g. What methodologies are used in studies about social media?" value={ragQuestion} onChange={(e) => setRagQuestion(e.target.value)} rows={3} />
                </div>
                <div className="sp-modal-actions">
                  <button className="sp-modal-cancel" onClick={closeRagModal} disabled={ragLoading}>Cancel</button>
                  <button className="sp-modal-submit sp-modal-submit-rag" onClick={handleAskRag} disabled={ragLoading}>
                    {ragLoading ? 'Thinking...' : 'Ask AI'}
                  </button>
                </div>
                {ragLoading && (
                  <div className="sp-analyzing">
                    <div className="sp-spinner sp-spinner-rag"></div>
                    <p>AI is searching the repository...</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2>AI Answer</h2>
                <p className="sp-modal-desc" style={{ fontStyle: 'italic', marginBottom: 12 }}>"{ragQuestion}"</p>
                <div className="sp-rag-answer"><p>{ragAnswer.answer}</p></div>
                {ragAnswer.sources?.length > 0 && (
                  <div className="sp-rag-sources">
                    <h4>Sources from repository</h4>
                    {ragAnswer.sources.map((source, i) => (
                      <div key={i} className="sp-rag-source-item">
                        <span className="sp-rag-source-dot">●</span>
                        <div>
                          <p className="sp-rag-source-title">{source.title}</p>
                          <p className="sp-rag-source-authors">{source.authors}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="sp-modal-actions" style={{ marginTop: 16 }}>
                  <button className="sp-modal-cancel" onClick={() => { setRagAnswer(null); setRagQuestion('') }}>Ask another</button>
                  <button className="sp-modal-submit sp-modal-submit-rag" onClick={closeRagModal}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedPaper && (
        <PaperView paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}
    </div>
  )
}

export default SearchPapers