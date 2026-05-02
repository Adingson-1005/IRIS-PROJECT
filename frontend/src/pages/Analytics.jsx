import { useState, useEffect } from 'react'
import axios from 'axios'
import '../css/Analytics.css'

function Analytics() {
  const [summary, setSummary] = useState(null)
  const [topSearches, setTopSearches] = useState([])
  const [topDownloads, setTopDownloads] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token')
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

  if (loading) return <div className="an-loading">Loading analytics...</div>

  return (
    <div className="an-container">
      <h2 className="an-heading">Analytics Dashboard</h2>

      {/* Summary Cards */}
      <div className="an-summary-grid">
        <div className="an-stat-card an-blue">
          <span className="an-stat-num">{summary?.users?.total || 0}</span>
          <span className="an-stat-label">Total Users</span>
        </div>
        <div className="an-stat-card an-green">
          <span className="an-stat-num">{summary?.users?.students || 0}</span>
          <span className="an-stat-label">Students</span>
        </div>
        <div className="an-stat-card an-teal">
          <span className="an-stat-num">{summary?.users?.instructors || 0}</span>
          <span className="an-stat-label">Instructors</span>
        </div>
        <div className="an-stat-card an-purple">
          <span className="an-stat-num">{summary?.papers || 0}</span>
          <span className="an-stat-label">Total Papers</span>
        </div>
        <div className="an-stat-card an-orange">
          <span className="an-stat-num">{summary?.searches || 0}</span>
          <span className="an-stat-label">Total Searches</span>
        </div>
        <div className="an-stat-card an-red">
          <span className="an-stat-num">{summary?.downloads || 0}</span>
          <span className="an-stat-label">Total Downloads</span>
        </div>
      </div>

      <div className="an-charts-grid">

        {/* Top Searches */}
        <div className="an-card">
          <h3 className="an-card-title">Top Searched Keywords</h3>
          {topSearches.length === 0 ? (
            <p className="an-empty">No searches yet.</p>
          ) : (
            <div className="an-bar-list">
              {topSearches.map((item, i) => (
                <div key={i} className="an-bar-item">
                  <span className="an-bar-label">{item.keyword}</span>
                  <div className="an-bar-track">
                    <div
                      className="an-bar-fill an-fill-blue"
                      style={{ width: `${(item.count / maxSearchCount) * 100}%` }}
                    />
                  </div>
                  <span className="an-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="an-card">
          <h3 className="an-card-title">Papers by Strand</h3>
          {categories.length === 0 ? (
            <p className="an-empty">No papers yet.</p>
          ) : (
            <div className="an-bar-list">
              {categories.map((item, i) => (
                <div key={i} className="an-bar-item">
                  <span className="an-bar-label">{item.category}</span>
                  <div className="an-bar-track">
                    <div
                      className="an-bar-fill an-fill-purple"
                      style={{ width: `${(item.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="an-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Downloads */}
        <div className="an-card an-full-width">
          <h3 className="an-card-title">Most Downloaded Papers</h3>
          {topDownloads.length === 0 ? (
            <p className="an-empty">No downloads yet.</p>
          ) : (
            <div className="an-table-wrapper">
              <table className="an-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Authors</th>
                    <th>Category</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {topDownloads.map((paper, i) => (
                    <tr key={i}>
                      <td>{paper.title}</td>
                      <td>{paper.authors}</td>
                      <td>{paper.category}</td>
                      <td>
                        <span className="an-download-badge">
                          {paper.downloads}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Analytics