import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/MyUploads.css'
import '../css/ConfirmModal.css'

const API_BASE = 'https://iris-backend-7717.onrender.com'

function MyUploads() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // Check Similar Studies modal
  const [showSimilarModal, setShowSimilarModal] = useState(false)
  const [similarTitle, setSimilarTitle] = useState('')
  const [similarAbstract, setSimilarAbstract] = useState('')
  const [similarPapers, setSimilarPapers] = useState([])
  const [checkingSimilar, setCheckingSimilar] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)
  const [similarError, setSimilarError] = useState('')

  useEffect(() => { fetchMyPapers() }, [])

  const fetchMyPapers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/papers/my-papers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(response.data.papers || [])
    } catch {
      console.error('Failed to fetch my papers')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(deleteTarget.id)
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/papers/delete/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPapers(papers.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      alert('Failed to delete paper')
    }
    setDeleting(null)
  }

  const checkSimilar = async () => {
    if (!similarTitle.trim() && !similarAbstract.trim()) return
    setCheckingSimilar(true)
    setSimilarError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE}/papers/check-similar`,
        { title: similarTitle, abstract: similarAbstract },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSimilarPapers(response.data.similar_papers || [])
      setHasChecked(true)
    } catch {
      setSimilarError('Similarity check failed. Please try again.')
    }
    setCheckingSimilar(false)
  }

  const closeSimilarModal = () => {
    setShowSimilarModal(false)
    setSimilarTitle('')
    setSimilarAbstract('')
    setSimilarPapers([])
    setHasChecked(false)
    setSimilarError('')
  }

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.authors?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="myuploads-content">
      <div className="myuploads-card">

        <div className="myuploads-page-header">
          <h2 className="myuploads-page-title">My Uploads</h2>
          <p className="myuploads-page-sub">
            Papers you have contributed to the IRIS repository
          </p>
        </div>

        <div className="myuploads-top">
          <h3 className="myuploads-heading">
            {papers.length} paper{papers.length !== 1 ? 's' : ''} uploaded
          </h3>

          <div className="myuploads-top-right">
            <input
              className="myuploads-search"
              placeholder="🔍  Search by title or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="myuploads-new-btn"
              onClick={() => setShowSimilarModal(true)}
            >
              Check for Similar Studies
            </button>
          </div>
        </div>

        {loading && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">⏳</div>
            <p>Loading your papers...</p>
          </div>
        )}

        {!loading && papers.length === 0 && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">📄</div>
            <p>You haven't contributed any papers to the repository yet.</p>
          </div>
        )}

        {!loading && papers.length > 0 && filtered.length === 0 && (
          <div className="myuploads-empty">
            <div className="myuploads-empty-icon">🔍</div>
            <p>No papers match your search.</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="myuploads-table-wrapper">
            <table className="myuploads-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Strand</th>
                  <th>Year</th>
                  <th>Downloads</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((paper) => (
                  <tr key={paper.id}>
                    <td>{paper.title}</td>
                    <td>{paper.authors}</td>
                    <td>
                      <span className="myuploads-strand-badge">
                        {paper.category || 'N/A'}
                      </span>
                    </td>
                    <td>{paper.year}</td>
                    <td>{paper.downloads || 0}</td>
                    <td>
                      {paper.created_at
                        ? new Date(paper.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td>
                      <button
                        className="myuploads-delete"
                        onClick={() =>
                          setDeleteTarget({ id: paper.id, title: paper.title })
                        }
                        disabled={deleting === paper.id}
                      >
                        {deleting === paper.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Check for Similar Studies modal */}
      {showSimilarModal && (
        <div className="myuploads-modal-overlay" onClick={closeSimilarModal}>
          <div className="myuploads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="myuploads-modal-header">
              <h3 className="myuploads-modal-title">Check for Similar Studies</h3>
              <button className="myuploads-modal-close-btn" onClick={closeSimilarModal}>
                ✕
              </button>
            </div>

            <p className="myuploads-page-sub" style={{ marginBottom: '16px' }}>
              Enter a title and/or abstract to check whether similar studies
              already exist in the repository.
            </p>

            {similarError && <p className="myuploads-modal-error">{similarError}</p>}

            <div className="myuploads-modal-field">
              <label>Title</label>
              <input
                type="text"
                placeholder="Enter the paper title"
                value={similarTitle}
                onChange={(e) => setSimilarTitle(e.target.value)}
              />
            </div>

            <div className="myuploads-modal-field">
              <label>Abstract</label>
              <textarea
                rows={4}
                placeholder="Enter abstract"
                value={similarAbstract}
                onChange={(e) => setSimilarAbstract(e.target.value)}
              />
            </div>

            <button
              className="myuploads-check-similar-btn"
              type="button"
              onClick={checkSimilar}
              disabled={checkingSimilar || (!similarTitle.trim() && !similarAbstract.trim())}
            >
              {checkingSimilar ? 'Checking...' : '🔍 Check for Similar Studies'}
            </button>

            {hasChecked && similarPapers.length > 0 && (
              <div className="myuploads-similar-warning">
                <p className="myuploads-similar-title">
                  ⚠️ Similar papers found in the repository:
                </p>
                {similarPapers.map((p) => (
                  <div key={p.paper_id} className="myuploads-similar-item">
                    <div className="myuploads-similar-pct">{p.similarity}%</div>
                    <div>
                      <p className="myuploads-similar-paper-title">{p.title}</p>
                      <p className="myuploads-similar-paper-meta">
                        {p.authors} · {p.category} · {p.year}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasChecked && similarPapers.length === 0 && (
              <div className="myuploads-no-similar">
                ✅ No similar papers found in the repository.
              </div>
            )}

            <div className="myuploads-modal-actions">
              <button className="myuploads-modal-cancel" onClick={closeSimilarModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Delete Paper?</h3>
            <p className="confirm-desc">
              Are you sure you want to delete{' '}
              <strong>"{deleteTarget.title}"</strong>? This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyUploads