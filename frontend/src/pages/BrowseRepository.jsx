import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/BrowseRepository.css'
import PaperView from '../components/PaperView'

function BrowseRepository() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const role = localStorage.getItem('role')

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

  const handleReindex = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://127.0.0.1:8000/papers/reindex-all', {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      alert(response.data.message)
    } catch {
      alert('Reindex failed')
    }
  }

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authors.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="browse-content">
      <div className="browse-card">
        <div className="browse-top">
          <h2 className="browse-heading">All Research Papers ({filtered.length})</h2>
          <div className="browse-top-right">
            {role === 'instructor' && (
              <button className="browse-reindex" onClick={handleReindex}>Re-index All</button>
            )}
            <input
              className="browse-search"
              placeholder="Filter by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <p>Loading papers...</p>}
        {!loading && filtered.length === 0 && (
          <p className="browse-empty">
            {search ? 'No papers match your search.' : 'No papers in the repository yet.'}
          </p>
        )}
        {!loading && filtered.length > 0 && (
          <table className="browse-table">
            <thead>
              <tr>
                <th>Title</th><th>Authors</th><th>Category</th><th>Methodology</th><th>Year</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((paper) => (
                <tr key={paper.id}>
                  <td
                    className="browse-title-cell"
                    onClick={() => setSelectedPaper(paper)}
                  >
                    {paper.title}
                  </td>
                  <td>{paper.authors}</td>
                  <td>{paper.category}</td>
                  <td>{paper.methodology}</td>
                  <td>{paper.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedPaper && (
        <PaperView
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  )
}

export default BrowseRepository