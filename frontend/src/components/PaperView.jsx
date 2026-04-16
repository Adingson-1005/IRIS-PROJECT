import '../css/PaperView.css'

function PaperView({ paper, onClose }) {
  const initials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const authorList = paper.authors
    ? paper.authors.split(',').map(a => a.trim()).filter(Boolean)
    : []

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token')
      const paperId = paper.paper_id || paper.id
      const response = await fetch(
        `http://127.0.0.1:8000/papers/download/${paperId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      )
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${paper.title}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Download failed. The file may not be available.')
    }
  }

  return (
    <div className="pv-overlay" onClick={onClose}>
      <div className="pv-modal" onClick={(e) => e.stopPropagation()}>

        <div className="pv-topbar">
          <div className="pv-breadcrumb">
            <span className="pv-breadcrumb-link" onClick={onClose}>
              Manage Papers
            </span>
            <span className="pv-breadcrumb-sep"> › </span>
            <span>View Paper</span>
          </div>
          <div className="pv-topbar-actions">
                      <button
            className="pv-btn-outline"
            onClick={() => handleDownload()}
          >
            Download PDF
          </button>
            <button className="pv-close-x" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="pv-body">
          <div className="pv-left">
            <div className="pv-tags">
              {paper.category && (
                <span className="pv-category-tag">{paper.category.toUpperCase()}</span>
              )}
              {paper.year && (
                <span className="pv-year-tag">{paper.year}</span>
              )}
            </div>

            <h1 className="pv-title">{paper.title}</h1>

            {authorList.length > 0 && (
              <div className="pv-authors">
                {authorList.map((author, i) => (
                  <div key={i} className="pv-author-chip">
                    <div className="pv-avatar">{initials(author)}</div>
                    <div className="pv-author-info">
                      <span className="pv-author-name">{author}</span>
                      <span className="pv-author-role">Author</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pv-abstract-section">
              <h4 className="pv-abstract-label">ABSTRACT</h4>
              <p className="pv-abstract-text">
                {paper.abstract || 'No abstract available.'}
              </p>
            </div>

            {paper.methodology && (
              <div className="pv-keywords-section">
                <h4 className="pv-keywords-label">Keywords</h4>
                <div className="pv-keywords">
                  <span className="pv-keyword">{paper.category}</span>
                  <span className="pv-keyword">{paper.methodology}</span>
                </div>
              </div>
            )}
          </div>

          <div className="pv-right">
                      <div className="pv-stats-card">
            <div className="pv-stat">
              <span className="pv-stat-number">
                {paper.downloads || 0}
              </span>
              <span className="pv-stat-label">DOWNLOADS</span>
            </div>
            <div className="pv-stat">
              <span className="pv-stat-number">
                {paper.year || '—'}
              </span>
              <span className="pv-stat-label">YEAR</span>
            </div>
          </div>

            <div className="pv-details-card">
              <h4 className="pv-details-title">Document Details</h4>
              <div className="pv-detail-row">
                <span className="pv-detail-label">FILE FORMAT</span>
                <span className="pv-detail-value">PDF</span>
              </div>
              <div className="pv-detail-row">
                <span className="pv-detail-label">YEAR</span>
                <span className="pv-detail-value">{paper.year || '—'}</span>
              </div>
              <div className="pv-detail-row">
                <span className="pv-detail-label">CATEGORY</span>
                <span className="pv-detail-value">{paper.category || '—'}</span>
              </div>
              <div className="pv-detail-row">
                <span className="pv-detail-label">METHODOLOGY</span>
                <span className="pv-detail-value">{paper.methodology || '—'}</span>
              </div>
              <div className="pv-detail-row">
                <span className="pv-detail-label">ACCESS</span>
                <span className="pv-access-badge">OPEN ACCESS</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PaperView