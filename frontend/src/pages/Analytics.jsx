import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/Analytics.css'

const ICONS = {
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  student: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  instructor: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  paper: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  download: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
}

function Icon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  )
}

function Analytics() {
  const [summary, setSummary] = useState(null)
  const [topSearches, setTopSearches] = useState([])
  const [topDownloads, setTopDownloads] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fullName = sessionStorage.getItem('full_name') || 'Admin'
  const firstName = fullName.split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const token = sessionStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }

      const [s, ts, td, cat] = await Promise.all([
        axios.get('https://iris-backend-7717.onrender.com/analytics/summary', { headers }),
        axios.get('https://iris-backend-7717.onrender.com/analytics/top-searches', { headers }),
        axios.get('https://iris-backend-7717.onrender.com/analytics/top-downloads', { headers }),
        axios.get('https://iris-backend-7717.onrender.com/analytics/category-breakdown', { headers }),
      ])

      setSummary(s.data)
      setTopSearches(ts.data.top_searches || [])
      setTopDownloads(td.data.top_downloads || [])
      setCategories(cat.data.categories || [])
    } catch (err) {
      console.error('Failed to load analytics')
    }
    setLoading(false)
  }

  const maxSearchCount = topSearches.length > 0
    ? Math.max(...topSearches.map(s => s.count))
    : 1

  const maxCatCount = categories.length > 0
    ? Math.max(...categories.map(c => c.count))
    : 1

  const topCategoryIndex = categories.findIndex(c => c.count === maxCatCount)

  const stats = [
    { label: 'Total Users',     value: summary?.users?.total,       icon: 'users',      featured: true },
    { label: 'Students',        value: summary?.users?.students,    icon: 'student' },
    { label: 'Instructors',     value: summary?.users?.instructors, icon: 'instructor' },
    { label: 'Total Papers',    value: summary?.papers,             icon: 'paper' },
    { label: 'Total Searches',  value: summary?.searches,           icon: 'search' },
    { label: 'Total Downloads', value: summary?.downloads,          icon: 'download' },
  ]

  if (loading) return <div className="an-loading">Loading analytics...</div>

  return (
    <div className="an-container">

      {/* Header */}
      <div className="an-header">
        <div>
          <h2 className="an-welcome">
            Welcome Back, <span>{firstName}</span>
          </h2>
          <p className="an-subtitle">Here's what's happening in IRIS today.</p>
        </div>
        <div className="an-date-chip">
          <Icon name="calendar" />
          {today}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="an-summary-grid">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`an-stat-card ${stat.featured ? 'an-featured' : ''}`}
          >
            <div className="an-stat-icon">
              <Icon name={stat.icon} />
            </div>
            <div>
              <span className="an-stat-num">{stat.value || 0}</span>
              <span className="an-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="an-charts-grid">

        {/* Papers by Strand */}
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <h3 className="an-card-title">Papers by Strand</h3>
              <p className="an-card-sub">Distribution across all strands</p>
            </div>
          </div>
          {categories.length === 0 ? (
            <p className="an-empty">No papers yet.</p>
          ) : (
            <div className="an-vchart">
              {categories.map((item, i) => {
                const isTop = i === topCategoryIndex
                return (
                  <div key={i} className="an-vcol">
                    <div className="an-vbar-area">
                      <div
                        className={`an-vbar ${isTop ? 'an-vbar-top' : ''}`}
                        style={{ height: `${Math.max((item.count / maxCatCount) * 100, 8)}%` }}
                      >
                        {isTop && <span className="an-vbadge">{item.count}</span>}
                      </div>
                    </div>
                    <div className="an-vlabel">
                      <strong>{item.category}</strong>
                      <small>{item.count} paper{item.count !== 1 ? 's' : ''}</small>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Searches */}
        <div className="an-card">
          <div className="an-card-head">
            <div>
              <h3 className="an-card-title">Top Searched Keywords</h3>
              <p className="an-card-sub">Most frequent search terms</p>
            </div>
          </div>
          {topSearches.length === 0 ? (
            <p className="an-empty">No searches yet.</p>
          ) : (
            <div className="an-bar-list">
              {topSearches.map((item, i) => (
                <div key={i} className="an-bar-item">
                  <span className="an-bar-rank">{i + 1}</span>
                  <span className="an-bar-label">{item.keyword}</span>
                  <div className="an-bar-track">
                    <div
                      className="an-bar-fill"
                      style={{ width: `${(item.count / maxSearchCount) * 100}%` }}
                    />
                  </div>
                  <span className="an-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Top Downloads */}
      <div className="an-card">
        <div className="an-card-head">
          <div>
            <h3 className="an-card-title">Most Downloaded Papers</h3>
            <p className="an-card-sub">Top papers by download count</p>
          </div>
        </div>
        {topDownloads.length === 0 ? (
          <p className="an-empty">No downloads yet.</p>
        ) : (
          <div className="an-table-wrapper">
            <table className="an-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Authors</th>
                  <th>Category</th>
                  <th>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {topDownloads.map((paper, i) => (
                  <tr key={i}>
                    <td><span className="an-rank">{i + 1}</span></td>
                    <td className="an-cell-title">{paper.title}</td>
                    <td>{paper.authors}</td>
                    <td><span className="an-category-badge">{paper.category}</span></td>
                    <td><span className="an-download-badge">{paper.downloads}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

export default Analytics