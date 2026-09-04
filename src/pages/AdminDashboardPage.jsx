import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API_BASE_URL = 'https://booksharebackend-production.up.railway.app';
const API_URL = `${API_BASE_URL}/api`;

export default function AdminDashboardPage({ user }) {
  const [summary, setSummary] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeLoans: 0,
    overdueBooks: 0,
    queuedHolds: 0
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const fetchSummary = async () => {
    const response = await fetch(`${API_URL}/admin/summary`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('bookshare-token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      setSummary(data);
    }
  };

  const fetchAllData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/admin/data`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('bookshare-token')}`, 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Unable to load admin data');
      const payload = await res.json();
      setData(payload);
    } catch (err) {
      setError(err.message || 'Failed');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchSummary();
    fetchAllData();
  }, [user]);

  const exportCSV = (key, rows = []) => {
    if (!rows || !rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${key}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') {
    return (
      <section className="detail-card">
        <h2>Access restricted</h2>
        <p>This dashboard is only available for library administrators.</p>
      </section>
    );
  }

  return (
    <section>
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Library Admin</h1>
          <p className="admin-subtitle">Overview and management tools for your library</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-small" onClick={() => window.open('/', '_blank')}>Open Public Site</button>
          <button className="btn btn-outline btn-small" onClick={() => { fetchSummary(); fetchAllData(); }}>Refresh</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card stat-books">
          <div className="stat-icon">📚</div>
          <div>
            <small>Total books</small>
            <strong>{summary.totalBooks}</strong>
          </div>
        </div>
        <div className="stat-card stat-members">
          <div className="stat-icon">👥</div>
          <div>
            <small>Total members</small>
            <strong>{summary.totalMembers}</strong>
          </div>
        </div>
        <div className="stat-card stat-loans">
          <div className="stat-icon">🔁</div>
          <div>
            <small>Active loans</small>
            <strong>{summary.activeLoans}</strong>
          </div>
        </div>
        <div className="stat-card stat-overdue">
          <div className="stat-icon">⚠️</div>
          <div>
            <small>Overdue</small>
            <strong>{summary.overdueBooks}</strong>
          </div>
        </div>
        <div className="stat-card stat-holds">
          <div className="stat-icon">📌</div>
          <div>
            <small>Queued holds</small>
            <strong>{summary.queuedHolds}</strong>
          </div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <input placeholder="Search users/books/requests" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="admin-actions">
          <button className="btn btn-outline btn-small" onClick={() => { setData(null); setError(null); fetchSummary(); fetchAllData(); }}>Refresh</button>
          <button className="btn btn-secondary btn-small" onClick={() => { if (!data) return; exportCSV('users', data.users); }}>Export Users</button>
          <button className="btn btn-secondary btn-small" onClick={() => { if (!data) return; exportCSV('books', data.books); }}>Export Books</button>
        </div>
      </div>

      {loading && <div className="panel-form">Loading admin data…</div>}
      {error && <div className="panel-form"><p className="helper-text">Error: {error}</p></div>}

      {data && (
        <div className="admin-grid">
          <div className="panel-form">
            <h4>Users ({data.users.length})</h4>
            <div className="table-scroll">
              <div className="table-card">
                <table className="data-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>City</th><th>Role</th></tr></thead>
                  <tbody>
                    {data.users.filter(u => !query || `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())).map((u) => (
                      <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.city}</td><td>{u.role}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel-form">
            <h4>Books ({data.books.length})</h4>
            <div className="table-scroll">
              <div className="table-card">
                <table className="data-table"><thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Owner</th><th>Status</th></tr></thead>
                  <tbody>{data.books.filter(b => !query || `${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())).map((b) => (<tr key={b.id}><td>{b.id}</td><td>{b.title}</td><td>{b.author}</td><td>{b.owner_name}</td><td>{b.status}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel-form">
            <h4>Requests ({data.requests.length})</h4>
            <div className="table-scroll">
              <div className="table-card">
                <table className="data-table"><thead><tr><th>ID</th><th>Book</th><th>Requester</th><th>Owner</th><th>Status</th></tr></thead>
                  <tbody>{data.requests.filter(r => !query || `${r.book_title} ${r.requester_name}`.toLowerCase().includes(query.toLowerCase())).map((r) => (<tr key={r.id}><td>{r.id}</td><td>{r.book_title}</td><td>{r.requester_name}</td><td>{r.owner_name}</td><td>{r.status}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel-form">
            <h4>Holds ({data.holds.length})</h4>
            <div className="table-scroll">
              <div className="table-card">
                <table className="data-table"><thead><tr><th>ID</th><th>Book</th><th>User</th><th>Position</th></tr></thead>
                  <tbody>{data.holds.map((h) => (<tr key={h.id}><td>{h.id}</td><td>{h.book_title}</td><td>{h.user_name}</td><td>{h.queue_position}</td></tr>))}</tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel-form">
            <h4>Shelves ({data.shelves.length})</h4>
            <div className="table-scroll">
              <div className="table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Owner</th>
                      <th>Books</th>
                      <th>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.shelves.filter(s => !query || `${s.name} ${s.description || ''}`.toLowerCase().includes(query.toLowerCase())).map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.name}</td>
                        <td>{s.user_name || (s.user_id ? `user ${s.user_id}` : '—')}</td>
                        <td>{(s.books || []).length}</td>
                        <td className="shelf-preview">
                          {((s.books || []).slice(0,3)).map((b, idx) => (
                            <span key={idx} className="shelf-book-tag">{b.title}</span>
                          ))}
                          {(s.books || []).length > 3 && <span className="shelf-more">+{(s.books || []).length - 3} more</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
