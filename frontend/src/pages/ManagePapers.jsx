import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/ManagePapers.css'

function ManagePapers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPapers() }, [])

  const fetchPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/papers/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPapers(response.data.papers)
    } catch (err) {
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
    } catch (err) {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authors.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="manage-content">
      <div className="manage-card">
        <div className="manage-top">
          <h2 className="manage-heading">All Research Papers ({filtered.length})</h2>
          <input
            className="manage-search"
            placeholder="Filter by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading papers...</p>}
        {!loading && filtered.length === 0 && <p className="manage-empty">No papers found.</p>}
        {!loading && filtered.length > 0 && (
          <table className="manage-table">
            <thead>
              <tr>
                <th>Title</th><th>Authors</th><th>Category</th>
                <th>Methodology</th><th>Year</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((paper) => (
                <tr key={paper.id}>
                  <td>{paper.title}</td>
                  <td>{paper.authors}</td>
                  <td>{paper.category}</td>
                  <td>{paper.methodology}</td>
                  <td>{paper.year}</td>
                  <td>
                    <button
                      className="manage-delete"
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
    </div>
  )
}

export default ManagePapers