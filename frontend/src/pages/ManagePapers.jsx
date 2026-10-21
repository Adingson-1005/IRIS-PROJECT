import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/ManagePapers.css'
import PaperView from '../components/PaperView'
import '../css/ConfirmModal.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL ||
  (['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:8000'
    : 'https://iris-backend-7717.onrender.com')

function ManagePapers() {
  const [papers, setPapers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('active') // 'active' | 'archived'
  const [processing, setProcessing] = useState(null)
  const [classSaving, setClassSaving] = useState(null)
  const [search, setSearch] = useState('')
  const [strand, setStrand] = useState('')
  const [methodology, setMethodology] = useState('')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null)
  const [statusModal, setStatusModal] = useState(null) // { type: 'success' | 'error', message }

  useEffect(() => { fetchPapers() }, [view])

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }
  })

  const handleClassChange = async (paper, className) => {
    setClassSaving(paper.id)
    try {
      await axios.patch(
        `${API_BASE}/papers/${paper.id}/class`,
        { class_name: className || null },
        authHeaders()
      )
      setPapers(current => current.map(item =>
        item.id === paper.id ? { ...item, class_name: className || null } : item
      ))
    } catch (err) {
      setStatusModal({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to update paper class'
      })
    }
    setClassSaving(null)
  }

  const fetchPapers = async () => {
    setLoading(true)
    try {
      const endpoint = view === 'archived' ? '/papers/archived' : '/papers/list'
      const response = await axios.get(`${API_BASE}${endpoint}`, authHeaders())
      setPapers(response.data.papers || [])
    } catch {
      console.error('Failed to fetch papers')
      setPapers([])
    }
    setLoading(false)
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setProcessing(archiveTarget.id)
    try {
      const response = await axios.delete(
        `${API_BASE}/papers/delete/${archiveTarget.id}`,
        authHeaders()
      )
      if (response.data?.error) throw new Error(response.data.error)
      setPapers(papers.filter(p => p.id !== archiveTarget.id))
      setArchiveTarget(null)
      setStatusModal({
        type: 'success',
        message: 'Paper archived. You can restore it anytime from the Archived tab.'
      })
    } catch (err) {
      setArchiveTarget(null)
      setStatusModal({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to archive paper'
      })
    }
    setProcessing(null)
  }

  const handleRestore = async (paper) => {
    setProcessing(paper.id)
    try {
      const response = await axios.post(
        `${API_BASE}/papers/restore/${paper.id}`,
        {},
        authHeaders()
      )
      if (response.data?.error) throw new Error(response.data.error)
      setPapers(papers.filter(p => p.id !== paper.id))
      setStatusModal({
        type: 'success',
        message: 'Paper restored. It is now visible in the repository again.'
      })
    } catch (err) {
      setStatusModal({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to restore paper'
      })
    }
    setProcessing(null)
  }

  const handlePermanentlyDelete = async () => {
    if (!permanentDeleteTarget) return
    setProcessing(permanentDeleteTarget.id)
    try {
      const response = await axios.delete(
        `${API_BASE}/papers/permanent-delete/${permanentDeleteTarget.id}`,
        authHeaders()
      )
      if (response.data?.error) throw new Error(response.data.error)
      setPapers(papers.filter(p => p.id !== permanentDeleteTarget.id))
      setPermanentDeleteTarget(null)
      setStatusModal({
        type: response.data?.storage_deleted ? 'success' : 'error',
        message: response.data?.storage_deleted
          ? 'Paper and its stored PDF were permanently deleted.'
          : 'The paper was deleted from the repository, but its PDF could not be removed from Supabase Storage.'
      })
    } catch (err) {
      setPermanentDeleteTarget(null)
      setStatusModal({
        type: 'error',
        message: err.response?.data?.detail || err.message || 'Failed to permanently delete paper'
      })
    }
    setProcessing(null)
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

  const isArchivedView = view === 'archived'

  return (
    <div className="mp-container">

      <div className="mp-page-header">
        <div>
          <h2 className="mp-page-title">Manage Papers</h2>
          <p className="mp-page-sub">
            {isArchivedView
              ? `${papers.length} archived paper${papers.length !== 1 ? 's' : ''}`
              : `${papers.length} paper${papers.length !== 1 ? 's' : ''} in the repository`}
          </p>
        </div>
      </div>

      <div className="mp-tabs">
        <button
          className={`mp-tab ${!isArchivedView ? 'mp-tab-active' : ''}`}
          onClick={() => setView('active')}
        >
          Active
        </button>
        <button
          className={`mp-tab ${isArchivedView ? 'mp-tab-active' : ''}`}
          onClick={() => setView('archived')}
        >
          Archived
        </button>
      </div>

      <div className="mp-filterbar">
        <input
          className="mp-search"
          placeholder="🔍  Search by title or author..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="mp-select" value={strand} onChange={(e) => setStrand(e.target.value)}>
          <option value="">All Strands</option>
          <option value="STEM">STEM</option>
          <option value="HUMSS">HUMSS</option>
          <option value="ABM">ABM</option>
          <option value="GAS">GAS</option>
        </select>
        <select className="mp-select" value={methodology} onChange={(e) => setMethodology(e.target.value)}>
          <option value="">All Methodologies</option>
          <option value="Qualitative">Qualitative</option>
          <option value="Quantitative">Quantitative</option>
          <option value="Mixed Methods">Mixed Methods</option>
          <option value="Experimental">Experimental</option>
          <option value="Descriptive">Descriptive</option>
        </select>
        <select className="mp-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>

      {!loading && (
        <p className="mp-count">
          Showing {filtered.length} of {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </p>
      )}

      {loading && (
        <div className="mp-empty">
          <div className="mp-empty-icon">⏳</div>
          <p>Loading papers...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mp-empty">
          <div className="mp-empty-icon">📭</div>
          <p>
            {isArchivedView && papers.length === 0
              ? 'No archived papers.'
              : 'No papers found. Try adjusting your filters.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mp-grid">
          {filtered.map((paper) => (
            <div key={paper.id} className="mp-card" onClick={() => setSelectedPaper(paper)}>
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
              {sessionStorage.getItem('role') === 'admin' && (
                <label className="mp-class-field" onClick={(e) => e.stopPropagation()}>
                  <span>Class</span>
                  <select
                    className="mp-select"
                    value={paper.class_name || ''}
                    onChange={(e) => handleClassChange(paper, e.target.value)}
                    disabled={classSaving === paper.id}
                  >
                    <option value="">Unassigned</option>
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                    <option value="Class D">Class D</option>
                  </select>
                  {classSaving === paper.id && <span>Saving...</span>}
                </label>
              )}
              {isArchivedView && paper.deleted_at && (
                <span className="mp-archived-date">
                  Archived on {new Date(paper.deleted_at).toLocaleDateString()}
                </span>
              )}
              <div className={`mp-card-footer ${isArchivedView ? 'mp-card-footer-archived' : ''}`}>
                <span className="mp-method-badge">{paper.methodology}</span>
                {isArchivedView ? (
                  <div className="mp-archived-actions">
                    <button
                      className="mp-restore-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore(paper)
                      }}
                      disabled={processing === paper.id}
                    >
                      {processing === paper.id ? 'Restoring...' : 'Restore'}
                    </button>
                    <button
                      className="mp-permanent-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPermanentDeleteTarget({ id: paper.id, title: paper.title })
                      }}
                      disabled={processing === paper.id}
                    >
                      Permanently Delete
                    </button>
                  </div>
                ) : (
                  <button
                    className="mp-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setArchiveTarget({ id: paper.id, title: paper.title })
                    }}
                    disabled={processing === paper.id}
                  >
                    {processing === paper.id ? 'Archiving...' : 'Archive'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPaper && (
        <PaperView paper={selectedPaper} onClose={() => setSelectedPaper(null)} />
      )}

      {/* Archive confirmation */}
      {archiveTarget && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon" style={{ color: '#1a56db' }}>
              <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                <polyline points="21 8 21 21 3 21 3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1" y="3" width="22" height="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="10" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="confirm-title">Archive Paper?</h3>
            <p className="confirm-desc">
              Are you sure you want to archive <strong>"{archiveTarget.title}"</strong>?
              It will be hidden from the repository and search, but you can restore
              it anytime from the Archived tab.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setArchiveTarget(null)}>Cancel</button>
              <button className="confirm-proceed" onClick={handleArchive} disabled={!!processing}>
                {processing ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent deletion confirmation */}
      {permanentDeleteTarget && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-icon" style={{ color: '#b91c1c' }}>
              <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="confirm-title">Permanently Delete Paper?</h3>
            <p className="confirm-desc">
              This will permanently delete <strong>"{permanentDeleteTarget.title}"</strong>,
              its search index, and its stored PDF. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setPermanentDeleteTarget(null)}>Cancel</button>
              <button className="mp-permanent-delete-confirm" onClick={handlePermanentlyDelete} disabled={!!processing}>
                {processing ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success / error popup */}
      {statusModal && (
        <div className="confirm-overlay" onClick={() => setStatusModal(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="confirm-icon"
              style={{ color: statusModal.type === 'success' ? '#0e9f6e' : '#d97706' }}
            >
              {statusModal.type === 'success' ? (
                <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <h3 className="confirm-title">
              {statusModal.type === 'success' ? 'Success' : 'Something went wrong'}
            </h3>
            <p className="confirm-desc">{statusModal.message}</p>
            <div className="confirm-actions">
              <button className="confirm-proceed" onClick={() => setStatusModal(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagePapers