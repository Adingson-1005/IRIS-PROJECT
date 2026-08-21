import '../css/PaperView.css'

function PaperView({ paper, onClose }) {
  const initials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const escapeHtml = (value) => {
    if (value === null || value === undefined) return ''
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  const authorList = paper.authors
    ? paper.authors.split(',').map(a => a.trim()).filter(Boolean)
    : []

  const handleDownload = async () => {
  try {
    const token = localStorage.getItem('token')
    const paperId = paper.paper_id || paper.id

    const response = await fetch(
      `https://iris-backend-7717.onrender.com/papers/download/${paperId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const data = await response.json()

    if (!data.download_url) {
      alert('Download failed. The file may not be available.')
      return
    }

    const fileResponse = await fetch(data.download_url)
    const blob = await fileResponse.blob()
    const blobUrl = window.URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `${paper.title}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(blobUrl)
    document.body.removeChild(a)

  } catch (err) {
    alert('Download failed. The file may not be available.')
  }
}

const handlePrint = () => {
  const safeTitle = escapeHtml(paper.title)
  const safeAbstract = escapeHtml(paper.abstract || 'No abstract available.')
  const safeCategory = escapeHtml(paper.category || '')
  const safeYear = escapeHtml(paper.year || '')
  const safeMethodology = escapeHtml(paper.methodology || '')
  const safeAuthorNames = escapeHtml(authorList.join(', ') || 'Unknown')

  const printContent = `
    <html>
      <head>
        <title>${safeTitle}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Georgia', serif;
            padding: 48px;
            color: #1a1a2e;
            line-height: 1.6;
          }
          .header {
            border-bottom: 2px solid #1a56db;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .institution {
            font-size: 11px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .iris-brand {
            font-size: 13px;
            font-weight: 700;
            color: #1a56db;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }
          .tags {
            display: flex;
            gap: 8px;
            margin-bottom: 14px;
            flex-wrap: wrap;
          }
          .tag {
            background: #ede9fe;
            color: #5b21b6;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 20px;
            letter-spacing: 0.5px;
          }
          .tag-year {
            background: #f0f4f8;
            color: #555;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 16px;
            color: #1a1a2e;
          }
          .authors {
            font-size: 13px;
            color: #555;
            margin-bottom: 24px;
          }
          .section-label {
            font-size: 10px;
            font-weight: 700;
            color: #1a56db;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 8px;
            margin-top: 20px;
          }
          .abstract {
            font-size: 13px;
            color: #444;
            line-height: 1.85;
            text-align: justify;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 8px;
          }
          .detail-item {
            background: #f9fafb;
            padding: 10px 14px;
            border-radius: 8px;
          }
          .detail-label {
            font-size: 9px;
            font-weight: 700;
            color: #aaa;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: 13px;
            color: #333;
            font-weight: 500;
          }
          .apa-section {
            margin-top: 28px;
            padding: 16px;
            background: #f0f4f8;
            border-left: 3px solid #1a56db;
            border-radius: 0 8px 8px 0;
          }
          .apa-label {
            font-size: 10px;
            font-weight: 700;
            color: #1a56db;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .apa-text {
            font-size: 12px;
            color: #444;
            font-style: italic;
            line-height: 1.7;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #aaa;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="iris-brand">IRIS — Institutional Research Repository System</p>
          <p class="institution">St. Joseph College Olongapo · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="tags">
          ${safeCategory ? `<span class="tag">${safeCategory.toUpperCase()}</span>` : ''}
          ${safeYear ? `<span class="tag tag-year">${safeYear}</span>` : ''}
          ${safeMethodology ? `<span class="tag">${safeMethodology}</span>` : ''}
        </div>

        <h1>${safeTitle}</h1>

        <p class="authors"><strong>Authors:</strong> ${safeAuthorNames}</p>

        <p class="section-label">Abstract</p>
        <p class="abstract">${safeAbstract}</p>

        <p class="section-label">Document Details</p>
        <div class="details-grid">
          <div class="detail-item">
            <p class="detail-label">Category / Strand</p>
            <p class="detail-value">${safeCategory || '—'}</p>
          </div>
          <div class="detail-item">
            <p class="detail-label">Methodology</p>
            <p class="detail-value">${safeMethodology || '—'}</p>
          </div>
          <div class="detail-item">
            <p class="detail-label">Year Published</p>
            <p class="detail-value">${safeYear || '—'}</p>
          </div>
          <div class="detail-item">
            <p class="detail-label">Access Type</p>
            <p class="detail-value">Open Access</p>
          </div>
        </div>

        <div class="apa-section">
          <p class="apa-label">APA Citation</p>
          <p class="apa-text">
            ${safeAuthorNames} (${safeYear || 'n.d.'}). ${safeTitle}. St. Joseph College Olongapo.
          </p>
        </div>

        <div class="footer">
          <p>Generated from IRIS — Institutional Research Repository System · St. Joseph College Olongapo · ${new Date().getFullYear()}</p>
        </div>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    alert('Please allow pop-ups to export paper details.')
    return
  }
  printWindow.opener = null
  printWindow.document.write(printContent)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 500)
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
                className="pv-btn-export"
                onClick={handlePrint}
                title="Export paper details as PDF"
              >
                Export Details
              </button>
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