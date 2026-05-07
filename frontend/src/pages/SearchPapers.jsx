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
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const papersPerPage = 12

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
    setAiResult(null)
    try {
      const data = new FormData()
      data.append('title', submitTitle)
      data.append('file', submitFile)
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'https://iris-backend-7717.onrender.com/ai/submit-draft',
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
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
    setShowModal(false)
    setSubmitError('')
    setSubmitFile(null)
    setSubmitTitle('')
    setAiResult(null)
  }

  const closeRagModal = () => {
    setShowRagModal(false)
    setRagQuestion('')
    setRagAnswer(null)
    setRagError('')
  }

  const initials = (name) => {
    if (!name) return '?'
    return name.split(',')[0].trim().split(' ')
      .map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const displayPapers = mode === 'search'
    ? searchResults
    : applyFilters(allPapers)


    const totalPages = Math.ceil(displayPapers.length / papersPerPage)
const paginatedPapers = displayPapers.slice(
  (currentPage - 1) * papersPerPage,
  currentPage * papersPerPage
)

// Reset to page 1 when search/filter changes
useEffect(() => {
  setCurrentPage(1)
}, [keyword, filters, mode])

  return (
    <div className="sp-container">

      {/* Header */}
      <div className="sp-header">
        <h1 className="sp-header-title">IRIS — Research Repository</h1>
        <button
          className="sp-logout-btn"
          onClick={() => { localStorage.clear(); navigate('/') }}
        >
          Logout
        </button>
      </div>

      {/* Body */}
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
            <option value="">All Strands</option>
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

        <div className="sp-grid">
  {paginatedPapers.map((paper) => {
    const id = paper.paper_id || paper.id
    return (
      <div key={id} className="sp-card" onClick={() => setSelectedPaper(paper)}>
        <div className="sp-card-top">
          <span className="sp-strand-badge">{paper.category || 'N/A'}</span>
          <span className="sp-card-year">{paper.year}</span>
        </div>
        <h3 className="sp-card-title">{paper.title}</h3>
        <div className="sp-card-authors-row">
          <div className="sp-avatar">{initials(paper.authors)}</div>
          <span className="sp-author-name">
            {paper.authors?.split(',')[0]?.trim()}
            {paper.authors?.split(',').length > 1 &&
              ` +${paper.authors.split(',').length - 1}`}
          </span>
        </div>
        <p className="sp-card-abstract">
          {paper.abstract
            ? paper.abstract.substring(0, 120) + '...'
            : 'No abstract available.'}
        </p>
        <div className="sp-card-footer">
          <span className="sp-method-badge">{paper.methodology}</span>
          {mode === 'search' && paper.score && (
            <span className="sp-relevance-score">Score: {paper.score}</span>
          )}
        </div>
      </div>
    )
  })}
</div>

{/* Pagination */}
{totalPages > 1 && (
  <div className="sp-pagination">
    <button
      className="sp-page-btn"
      onClick={() => setCurrentPage(1)}
      disabled={currentPage === 1}
    >
      «
    </button>
    <button
      className="sp-page-btn"
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
    >
      ‹
    </button>

    {Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter(page =>
        page === 1 ||
        page === totalPages ||
        Math.abs(page - currentPage) <= 1
      )
      .reduce((acc, page, idx, arr) => {
        if (idx > 0 && page - arr[idx - 1] > 1) {
          acc.push('...')
        }
        acc.push(page)
        return acc
      }, [])
      .map((item, idx) =>
        item === '...' ? (
          <span key={`dots-${idx}`} className="sp-page-dots">...</span>
        ) : (
          <button
            key={item}
            className={`sp-page-btn ${currentPage === item ? 'sp-page-active' : ''}`}
            onClick={() => setCurrentPage(item)}
          >
            {item}
          </button>
        )
      )}

    <button
      className="sp-page-btn"
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
    >
      ›
    </button>
    <button
      className="sp-page-btn"
      onClick={() => setCurrentPage(totalPages)}
      disabled={currentPage === totalPages}
    >
      »
    </button>
  </div>
)}
      </div>

      {/* Floating Action Buttons */}
      <div className="sp-fab-container">
        <div className="sp-fab-group">
          <span className="sp-fab-label">Ask AI</span>
          <button
            className="sp-fab sp-fab-rag"
            onClick={() => setShowRagModal(true)}
            title="Ask AI about research"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="white" stroke="white" strokeWidth="0.5"/>
              <circle cx="8" cy="10" r="1.2" fill="#1a56db"/>
              <circle cx="12" cy="10" r="1.2" fill="#1a56db"/>
              <circle cx="16" cy="10" r="1.2" fill="#1a56db"/>
            </svg>
          </button>
        </div>

        <div className="sp-fab-group">
          <span className="sp-fab-label">Check Paper</span>
          <button
            className="sp-fab sp-fab-checker"
            onClick={() => setShowModal(true)}
            title="Submit your research draft"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="white"/>
              <path d="M14 2V8H20" stroke="#7e3af2" strokeWidth="1.5" fill="none"/>
              <path d="M9 13L11 15L15 11" stroke="#7e3af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* AI Checker Modal */}
      {showModal && (
        <div className="sp-modal-overlay" onClick={closeCheckerModal}>
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            {!aiResult ? (
              <>
                <div className="sp-modal-header">
                  <div className="sp-modal-icon sp-modal-icon-checker">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#ede9fe"/>
                      <path d="M14 2V8H20" stroke="#7e3af2" strokeWidth="1.5" fill="none"/>
                      <path d="M9 13L11 15L15 11" stroke="#7e3af2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Check My Research</h2>
                    <p className="sp-modal-desc">
                      Upload your draft and AI will compare it against the instructor's template.
                    </p>
                  </div>
                </div>

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
                  <label>Upload your draft (PDF only)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSubmitFile(e.target.files[0])}
                  />
                  {submitFile && (
                    <p className="sp-modal-filename">📄 {submitFile.name}</p>
                  )}
                </div>

                <div className="sp-modal-actions">
                  <button
                    className="sp-modal-cancel"
                    onClick={closeCheckerModal}
                    disabled={submitLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="sp-modal-submit sp-modal-submit-checker"
                    onClick={handleSubmitPaper}
                    disabled={submitLoading}
                  >
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

                <div className={`sp-score-circle ${
                  aiResult.score >= 75 ? 'sp-score-high' :
                  aiResult.score >= 50 ? 'sp-score-mid' : 'sp-score-low'
                }`}>
                  <span className="sp-score-num">{aiResult.score}%</span>
                  <span className="sp-score-label">Accuracy Score</span>
                </div>

                <div className="sp-feedback-box">
                  {aiResult.feedback.split('\n').map((line, i) => {
                    if (line.startsWith('SCORE:')) return null
                    if (
                      line.startsWith('STRENGTHS:') ||
                      line.startsWith('TO IMPROVE:') ||
                      line.startsWith('SUGGESTIONS:') ||
                      line.startsWith('OVERALL FEEDBACK:') ||
                      line.startsWith('DOCUMENT TYPE:')
                    ) {
                      return <p key={i} className="sp-feedback-section">{line}</p>
                    }
                    if (line.startsWith('- ')) {
                      return <p key={i} className="sp-feedback-item">{line}</p>
                    }
                    if (line.trim()) {
                      return <p key={i} className="sp-feedback-text">{line}</p>
                    }
                    return null
                  })}
                </div>

                <button
                  className="sp-modal-submit sp-modal-submit-checker"
                  onClick={closeCheckerModal}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* RAG Modal */}
      {showRagModal && (
        <div className="sp-modal-overlay" onClick={closeRagModal}>
          <div className="sp-modal sp-rag-modal" onClick={(e) => e.stopPropagation()}>
            {!ragAnswer ? (
              <>
                <div className="sp-modal-header">
                  <div className="sp-modal-icon sp-modal-icon-rag">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="#dbeafe" stroke="#1a56db" strokeWidth="1"/>
                      <circle cx="8" cy="10" r="1.2" fill="#1a56db"/>
                      <circle cx="12" cy="10" r="1.2" fill="#1a56db"/>
                      <circle cx="16" cy="10" r="1.2" fill="#1a56db"/>
                    </svg>
                  </div>
                  <div>
                    <h2>Ask AI Guidance</h2>
                    <p className="sp-modal-desc">
                      Ask a research question and AI will answer based on papers in the repository.
                    </p>
                  </div>
                </div>

                {ragError && <p className="sp-modal-error">{ragError}</p>}

                <div className="sp-modal-field">
                  <label>Your research question</label>
                  <textarea
                    className="sp-rag-textarea"
                    placeholder="e.g. What methodologies are used in studies about social media?"
                    value={ragQuestion}
                    onChange={(e) => setRagQuestion(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="sp-modal-actions">
                  <button
                    className="sp-modal-cancel"
                    onClick={closeRagModal}
                    disabled={ragLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="sp-modal-submit sp-modal-submit-rag"
                    onClick={handleAskRag}
                    disabled={ragLoading}
                  >
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
                <p className="sp-modal-desc" style={{ fontStyle: 'italic' }}>
                  "{ragQuestion}"
                </p>

                <div className="sp-rag-answer">
                  <p>{ragAnswer.answer}</p>
                </div>

                {ragAnswer.sources && ragAnswer.sources.length > 0 && (
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

                <div className="sp-modal-actions" style={{ marginTop: '16px' }}>
                  <button
                    className="sp-modal-cancel"
                    onClick={() => { setRagAnswer(null); setRagQuestion('') }}
                  >
                    Ask another
                  </button>
                  <button
                    className="sp-modal-submit sp-modal-submit-rag"
                    onClick={closeRagModal}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {selectedPaper && (
        <PaperView
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}

      {/* Footer */}
<footer className="sp-footer">
  <div className="sp-footer-content">
    <div className="sp-footer-brand">
      <h3>IRIS</h3>
      <p>Institutional Research Repository System</p>
    </div>
    <div className="sp-footer-links">
      <div className="sp-footer-col">
        <h4>System</h4>
        <p>Search Repository</p>
        <p>AI Research Checker</p>
        <p>AI Guidance (RAG)</p>
      </div>
      <div className="sp-footer-col">
        <h4>Institution</h4>
        <p>St. Joseph College</p>
        <p>Olongapo City</p>
        <p>Philippines</p>
      </div>
      <div className="sp-footer-col">
        <h4>Developed by</h4>
        <p>Team TECHRIFT</p>
        <p>BSCS Capstone 2026</p>
        <p>Allynson Ibanez</p>
      </div>
    </div>
  </div>
  <div className="sp-footer-bottom">
    <p>© 2026 IRIS — Institutional Research Repository System. St. Joseph College Olongapo.</p>
    <p>Built with ReactJS · FastAPI · PostgreSQL · Groq AI</p>
  </div>
</footer>
    </div>
  )
}

export default SearchPapers