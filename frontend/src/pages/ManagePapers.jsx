import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/ManagePapers.css'
import PaperView from '../components/PaperView'

function ManagePapers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [strand, setStrand] = useState('')
  const [methodology, setMethodology] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedPaper, setSelectedPaper] = useState(null)

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

  const handleDelete = async (e, paperId, title) => {
    e.stopPropagation()
    const confirm = window.confirm(
      `Are you sure you want to delete "${title}"? This cannot be undone.`
    )
    if (!confirm) return
    setDeleting(paperId)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`https://iris-backend-7717.onrender.com/papers/delete/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(papers.filter(p => p.id !== paperId))
    } catch {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const initials = (name) => {
    if (!name) return '?'
    return name.split(',')[0].trim().split(' ')
      .map(n => n[0]).join('').substring(0, 2).toUpperCase()
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

  return (
    <div className="mp-container">

      <div className="mp-filterbar">
        <input
          className="mp-search"
          placeholder="Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="mp-select"
          value={strand}
          onChange={(e) => setStrand(e.target.value)}
        >
          <option value="">All Strands</option>
          <option value="STEM">STEM</option>
          <option value="HUMSS">HUMSS</option>
          <option value="ABM">ABM</option>
          <option value="GAS">GAS</option>
        </select>
        <select
          className="mp-select"
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
        >
          <option value="">All Methodologies</option>
          <option value="Qualitative">Qualitative</option>
          <option value="Quantitative">Quantitative</option>
          <option value="Mixed Methods">Mixed Methods</option>
          <option value="Experimental">Experimental</option>
          <option value="Descriptive">Descriptive</option>
        </select>
        <select
          className="mp-select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      <p className="mp-count">
        Showing {filtered.length} paper{filtered.length !== 1 ? 's' : ''}
      </p>

      {loading && <div className="mp-empty">Loading papers...</div>}

      {!loading && filtered.length === 0 && (
        <div className="mp-empty">No papers found. Try adjusting your filters.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mp-grid">
          {filtered.map((paper) => (
            <div
              key={paper.id}
              className="mp-card"
              onClick={() => setSelectedPaper(paper)}
            >
              <div className="mp-card-top">
                <span className="mp-strand-badge">{paper.category || 'N/A'}</span>
                <span className="mp-year">{paper.year}</span>
              </div>

              <h3 className="mp-card-title">{paper.title}</h3>

              <div className="mp-card-authors">
                <div className="mp-avatar">{initials(paper.authors)}</div>
                <span className="mp-author-name">
                  {paper.authors?.split(',')[0]?.trim()}
                  {paper.authors?.split(',').length > 1 &&
                    ` +${paper.authors.split(',').length - 1}`}
                </span>
              </div>

              <p className="mp-card-abstract">
                {paper.abstract
                  ? paper.abstract.substring(0, 120) + '...'
                  : 'No abstract available.'}
              </p>

              <div className="mp-card-footer">
                <span className="mp-method-badge">{paper.methodology}</span>
                <button
                  className="mp-delete-btn"
                  onClick={(e) => handleDelete(e, paper.id, paper.title)}
                  disabled={deleting === paper.id}
                >
                  {deleting === paper.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
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

export default ManagePapers