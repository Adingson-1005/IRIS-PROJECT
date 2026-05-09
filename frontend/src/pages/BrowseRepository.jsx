import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/BrowseRepository.css'
import PaperView from '../components/PaperView'

function BrowseRepository() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [strand, setStrand] = useState('')
  const [methodology, setMethodology] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const role = localStorage.getItem('role')

  useEffect(() => { fetchPapers() }, [])

  const fetchPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('https://iris-backend-7717.onrender.com/papers/list', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(response.data.papers)
    } catch {
      console.error('Failed to fetch papers')
    }
    setLoading(false)
  }

  const handleReindex = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'https://iris-backend-7717.onrender.com/papers/reindex-all', {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert(response.data.message)
    } catch {
      alert('Reindex failed')
    }
  }

  const filtered = papers
    .filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authors.toLowerCase().includes(search.toLowerCase())
      const matchStrand = strand ? p.category === strand : true
      const matchMethod = methodology ? p.methodology === methodology : true
      return matchSearch && matchStrand && matchMethod
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  const initials = (name) => {
    if (!name) return '?'
    return name.split(',')[0].trim().split(' ')
      .map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  return (
    <div className="br-container">

      <div className="br-page-header">
        <div>
          <h2 className="br-page-title">Main Repository</h2>
          <p className="br-page-sub">
            Browse and explore all uploaded research papers
          </p>
        </div>
      </div>

      <div className="br-filterbar">
        <input
          className="br-search"
          placeholder="🔍  Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="br-select" value={strand} onChange={(e) => setStrand(e.target.value)}>
          <option value="">All Strands</option>
          <option value="STEM">STEM</option>
          <option value="HUMSS">HUMSS</option>
          <option value="ABM">ABM</option>
          <option value="GAS">GAS</option>
        </select>
        <select className="br-select" value={methodology} onChange={(e) => setMethodology(e.target.value)}>
          <option value="">All Methodologies</option>
          <option value="Qualitative">Qualitative</option>
          <option value="Quantitative">Quantitative</option>
          <option value="Mixed Methods">Mixed Methods</option>
          <option value="Experimental">Experimental</option>
          <option value="Descriptive">Descriptive</option>
        </select>
        <select className="br-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
        {role === 'instructor' && (
          <button className="br-reindex" onClick={handleReindex}>
            Re-index All
          </button>
        )}
      </div>

      {!loading && (
        <p className="br-count">
          Showing {filtered.length} of {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading && (
        <div className="br-empty">
          <div className="br-empty-icon">⏳</div>
          <p>Loading papers...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="br-empty">
          <div className="br-empty-icon">📭</div>
          <p>No papers found. Try adjusting your filters.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="br-grid">
          {filtered.map((paper) => (
            <div key={paper.id} className="br-card" onClick={() => setSelectedPaper(paper)}>
              <div className="br-card-top">
                <span className="br-strand-badge">{paper.category || 'N/A'}</span>
                <span className="br-year">{paper.year}</span>
              </div>
              <h3 className="br-card-title">{paper.title}</h3>
              <div className="br-card-authors">
                <div className="br-avatar">{initials(paper.authors)}</div>
                <span className="br-author-name">
                  {paper.authors?.split(',')[0]?.trim()}
                  {paper.authors?.split(',').length > 1 && ` +${paper.authors.split(',').length - 1}`}
                </span>
              </div>
              <p className="br-card-abstract">
                {paper.abstract
                  ? paper.abstract.substring(0, 120) + '...'
                  : 'No abstract available.'}
              </p>
              <div className="br-card-footer">
                <span className="br-method-badge">{paper.methodology}</span>
                <span className="br-date">
                  {new Date(paper.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPaper && (
        <PaperView paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}
    </div>
  )
}

export default BrowseRepository