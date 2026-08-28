import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API_URL = '/api';

export default function AdminDashboardPage({ user }) {
  const [summary, setSummary] = useState({
    totalBooks: 0,
    totalMembers: 0,
    activeLoans: 0,
    overdueBooks: 0,
    queuedHolds: 0
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

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

    fetchSummary();
  }, [user]);

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
      <h2>Library admin dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total books</span>
          <strong>{summary.totalBooks}</strong>
        </div>
        <div className="stat-card">
          <span>Total members</span>
          <strong>{summary.totalMembers}</strong>
        </div>
        <div className="stat-card">
          <span>Active loans</span>
          <strong>{summary.activeLoans}</strong>
        </div>
        <div className="stat-card">
          <span>Overdue books</span>
          <strong>{summary.overdueBooks}</strong>
        </div>
        <div className="stat-card">
          <span>Queued holds</span>
          <strong>{summary.queuedHolds}</strong>
        </div>
      </div>
    </section>
  );
}
