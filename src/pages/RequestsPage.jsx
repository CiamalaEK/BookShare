import { Navigate } from 'react-router-dom';

const formatStatus = (status) =>
  status?.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const getStatusClass = (status = '') => {
  const value = String(status).toLowerCase();
  if (value.includes('approved') || value.includes('borrowed') || value.includes('returned')) return 'status-approved';
  if (value.includes('rejected')) return 'status-rejected';
  if (value.includes('pending') || value.includes('request')) return 'status-pending';
  if (value.includes('overdue')) return 'status-overdue';
  return 'status-info';
};

export default function RequestsPage({ user, requests, holds, onUpdateStatus, onMarkReturned, onFulfillHold }) {
  if (!user) return <Navigate to="/login" replace />;

  const relevantRequests = requests.filter(
    (request) => Number(request.requesterId) === Number(user.id) || Number(request.ownerId) === Number(user.id)
  );

  const holdEntries = holds.filter(
    (hold) => Number(hold.userId) === Number(user.id) || Number(hold.bookId) === Number(user.id)
  );

  return (
    <section>
      <h2>My Requests</h2>
      <div className="request-list">
        {relevantRequests.map((request) => (
          <div className="request-item" key={request.id}>
            <div>
              <strong>{request.bookTitle || request.book_title}</strong>
              <p>{request.requesterName || request.requester_name || 'Reader'} → {request.ownerName || request.owner_name || 'Owner'}</p>
              <span className={`badge status-badge ${getStatusClass(request.status)}`}>{formatStatus(request.status)}</span>
              {request.deliveryDate && <p>Delivery date: {new Date(request.deliveryDate).toLocaleDateString()}</p>}
              {request.receiptDate && <p>Receipt date: {new Date(request.receiptDate).toLocaleDateString()}</p>}
              {request.dueDate && <p>Due date: {new Date(request.dueDate).toLocaleDateString()}</p>}
            </div>
            {Number(request.ownerId) === Number(user.id) && request.status === 'pending' && (
              <div className="request-actions">
                <button
                  onClick={() => onUpdateStatus(
                    request.id,
                    'approved',
                    new Date(Date.now() + 14 * 86400000).toISOString(),
                    new Date().toISOString(),
                    new Date().toISOString(),
                    14
                  )}
                >
                  Approve
                </button>
                <button className="secondary" onClick={() => onUpdateStatus(request.id, 'rejected')}>Reject</button>
              </div>
            )}
            {Number(request.requesterId) === Number(user.id) && request.status === 'approved' && (
              <button onClick={() => onMarkReturned(request.id)}>Mark returned</button>
            )}
          </div>
        ))}
      </div>

      <h2>Hold queue</h2>
      <div className="request-list">
        {holds.length === 0 ? (
          <div className="request-item empty-state">
            <p>No active holds.</p>
          </div>
        ) : (
          holds.map((hold) => (
            <div className="request-item" key={hold.id}>
              <div>
                <strong>{hold.book_title || hold.bookTitle || 'Book'}</strong>
                <p>Reader: {hold.user_name || hold.userName || 'Member'}</p>
                <span className="badge">Queue #{hold.queuePosition || hold.queue_position || 1}</span>
              </div>
              {Number(user.id) === Number(hold.userId) && hold.status === 'queued' && (
                <span className="badge status-badge status-info">Your position</span>
              )}
              {Number(user.id) !== Number(hold.userId) && hold.status === 'queued' && (
                <button className="secondary" onClick={() => onFulfillHold(hold.id)}>Fulfill next</button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
