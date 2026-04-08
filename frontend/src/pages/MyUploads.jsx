import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../css/MyUploads.css'

function MyUploads() {
  const navigate = useNavigate()
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchPapers()
  }, [])

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
    const confirm = window.confirm(
      `Are you sure you want to delete "${title}"? This cannot be undone.`
    )
    if (!confirm) return

    setDeleting(paperId)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(
        `http://127.0.0.1:8000/papers/delete/${paperId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      setPapers(papers.filter(p => p.id !== paperId))
    } catch (err) {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  return (
    <div className="myuploads-container">
      <div className="myuploads-header">
        <h1 className="myuploads-title">IRIS — My Uploads</h1>
        <button
          className="myuploads-back"
          onClick={() => navigate('/instructor')}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="myuploads-content">
        <div className="myuploads-card">
          <h2 className="myuploads-heading">Uploaded Research Papers</h2>

          {loading && <p>Loading papers...</p>}

          {!loading && papers.length === 0 && (
            <p className="myuploads-empty">
              No papers uploaded yet. Go upload your first paper!
            </p>
          )}

          {!loading && papers.length > 0 && (
            <table className="myuploads-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>Date Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
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
    </div>
  )
}

export default MyUploads