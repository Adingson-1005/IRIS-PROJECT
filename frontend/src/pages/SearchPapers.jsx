import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/SearchPapers.css'

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

  useEffect(() => {
    fetchAllPapers()
  }, [])

  const fetchAllPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/papers/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAllPapers(response.data.papers)
    } catch (err) {
      setError('Failed to load papers.')
    }
    setLoading(false)
  }

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMode('browse')
      return
    }
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
    } catch (err) {
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

  const applyFilters = (papers) => {
    return papers.filter(p => {
      if (filters.category && p.category !== filters.category) return false
      if (filters.methodology && p.methodology !== filters.methodology) return false
      if (filters.year && String(p.year) !== String(filters.year)) return false
      return true
    })
  }

  const displayPapers = mode === 'search'
    ? searchResults
    : applyFilters(allPapers)

  return (
    <div className="sp-container">
      <div className="sp-header">
        <h1 className="sp-header-title">IRIS — Research Repository</h1>
        <button className="sp-back-btn" onClick={() => {
          localStorage.clear()
          navigate('/')
        }}>
          Logout
        </button>
      </div>

      <div className="sp-body">

        <div className="sp-search-row">
          <input
            className="sp-input"
            type="text"
            placeholder="Search by keyword using inverted index..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="sp-search-btn"
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
          {mode === 'search' && (
            <button className="sp-clear-btn" onClick={handleClear}>
              Clear
            </button>
          )}
        </div>

        <div className="sp-filters">
          <select
            className="sp-select"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All Categories</option>
            <option value="Science">Science</option>
            <option value="Technology">Technology</option>
            <option value="Engineering">Engineering</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Humanities">Humanities</option>
            <option value="Social Science">Social Science</option>
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
            <p>No papers found for "{keyword}". Try a different keyword or clear your filters.</p>
          </div>
        )}

        <div className="sp-results">
          {displayPapers.map((paper) => {
            const id = paper.paper_id || paper.id
            return (
              <div key={id} className="sp-card">
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
    </div>
  )
}

export default SearchPapers