import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyUploads.css'

function MyUploads() {
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
    } catch {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const filtered = papers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.authors.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="myuploads-content">
      <div className="myuploads-card">
        <div className="myuploads-top">
          <h2 className="myuploads-heading">Uploaded Research Papers ({filtered.length})</h2>
          <input
            className="myuploads-search"
            placeholder="Filter by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <p>Loading papers...</p>}
        {!loading && filtered.length === 0 && (
          <p className="myuploads-empty">
            {search ? 'No papers match your search.' : 'No papers uploaded yet. Go upload your first paper!'}
          </p>
        )}
        {!loading && filtered.length > 0 && (
          <table className="myuploads-table">
            <thead>
              <tr>
                <th>Title</th><th>Authors</th><th>Category</th>
                <th>Year</th><th>Date Uploaded</th><th>Action</th>
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
    </div>
  )
}

export default MyUploads