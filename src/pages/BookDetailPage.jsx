import { useNavigate, useParams } from 'react-router-dom';

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

export default function BookDetailPage({ user, books, requests, holds, onRequest }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const book = books.find((item) => Number(item.id) === Number(id));

  if (!book) {
    return (
      <section className="detail-card">
        <h2>Book not found</h2>
        <button onClick={() => navigate('/')}>Back to browse</button>
      </section>
    );
  }

  const requestStatus = user
    ? requests.find((request) => Number(request.bookId ?? request.book_id) === Number(book.id) && Number(request.requesterId ?? request.requester_id) === Number(user.id))
    : null;
  const holdStatus = user
    ? holds.find((hold) => Number(hold.bookId ?? hold.book_id) === Number(book.id) && Number(hold.userId ?? hold.user_id) === Number(user.id))
    : null;

  const bookStatus = requestStatus ? formatStatus(requestStatus.status) : formatStatus(book.status);

  return (
    <section className="detail-card">
      <button className="secondary back-button" onClick={() => navigate('/')}>Back</button>
      <div className="detail-layout">
        <img src={book.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'} alt={book.title} />
        <div className="detail-info">
          <span className="badge">{book.sharingType}</span>
          <h2>{book.title}</h2>
          <p className="byline">by {book.author}</p>
          <p><strong>Status:</strong> <span className={`badge status-badge ${getStatusClass(bookStatus)}`}>{bookStatus}</span></p>
          <p><strong>Category:</strong> {book.category}</p>
          <p><strong>Location:</strong> {book.location}</p>
          <p><strong>Owner:</strong> {book.ownerName || book.owner_name || 'Unknown'}</p>
          <p><strong>Condition:</strong> {book.condition}</p>
          <p><strong>Language:</strong> {book.language}</p>
          <p><strong>ISBN:</strong> {book.isbn || 'Not provided'}</p>

          <div className="detail-actions compact-actions">
            <button
              className={requestStatus ? `status-button ${getStatusClass(requestStatus.status)}` : 'primary'}
              onClick={() => onRequest(book.id)}
              disabled={!user || Number(book.ownerId) === Number(user.id) || !!requestStatus}
            >
              {requestStatus ? formatStatus(requestStatus.status) : 'Request this book'}
            </button>
            {holdStatus && <span className="helper-text">Queued #{holdStatus.queuePosition}</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
