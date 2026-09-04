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

import { useState } from 'react';

export default function BookDetailPage({ user, books, requests, holds, onRequest, shelves = [], onToggleShelf, wishlist = [], onToggleWishlist }) {
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
  const [toast, setToast] = useState(null);
  const [thumbLoaded, setThumbLoaded] = useState({});
  const [shelvesModalOpen, setShelvesModalOpen] = useState(false);

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <section className="detail-card">
      <button className="secondary back-button" onClick={() => navigate('/')}>Back</button>
      <div className="detail-layout">
        <div className="detail-media">
          <img src={book.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'} alt={book.title} />
        </div>
        <div className="detail-info">
          <div className="detail-header">
            <div>
              <h2>{book.title}</h2>
              <p className="byline">by {book.author}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge">{book.sharingType}</span>
              <span className={`badge status-badge ${getStatusClass(bookStatus)}`}>{bookStatus}</span>
            </div>
          </div>

          <div className="meta-grid">
            <div><strong>Category</strong><div className="meta-val">{book.category}</div></div>
            <div><strong>Location</strong><div className="meta-val">{book.location}</div></div>
            <div><strong>Owner</strong><div className="meta-val">{book.ownerName || book.owner_name || 'Unknown'}</div></div>
            <div><strong>Condition</strong><div className="meta-val">{book.condition}</div></div>
            <div><strong>Language</strong><div className="meta-val">{book.language}</div></div>
            <div><strong>ISBN</strong><div className="meta-val">{book.isbn || 'Not provided'}</div></div>
          </div>

          <div className="detail-actions">
            <div className="actions-row">
              <button
                className={requestStatus ? `status-button ${getStatusClass(requestStatus.status)}` : 'primary'}
                onClick={() => onRequest(book.id)}
                disabled={!user || Number(book.ownerId) === Number(user.id) || !!requestStatus}
              >
                {requestStatus ? formatStatus(requestStatus.status) : 'Request this book'}
              </button>

              {user && typeof onToggleWishlist === 'function' && (() => {
                const isFav = Array.isArray(wishlist) && wishlist.some((b) => Number(b.id) === Number(book.id));
                return (
                  <button
                    className={`detail-wishlist-btn ${isFav ? 'liked' : ''}`}
                    onClick={async () => {
                      try {
                        await onToggleWishlist({ bookId: book.id, add: !isFav });
                      } catch (e) { }
                    }}
                    aria-pressed={isFav}
                    aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                      <path d="M12 21s-7.5-4.5-10-7.5C-0.5 9.5 3 4 8 4c1.7 0 3.4.8 4 2 .6-1.2 2.3-2 4-2 5 0 8.5 5.5 6 9.5C19.5 16.5 12 21 12 21z" />
                    </svg>
                    <span className="wishlist-label">{isFav ? 'In Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                );
              })()}
            </div>

            {holdStatus && <p className="helper-text">Queued #{holdStatus.queuePosition}</p>}

            {user && shelves && shelves.length > 0 && (
              <div className="shelves-list">
                <strong style={{ display: 'block', marginBottom: 8 }}>Collections</strong>
                <div className="shelves-grid">
                  {shelves.map((shelf) => {
                    const has = (shelf.books || []).some((b) => Number(b.id) === Number(book.id));
                    const thumb = (shelf.books && shelf.books[0] && (shelf.books[0].image_url || shelf.books[0].imageUrl)) || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=200&q=60';
                    return (
                      <div key={shelf.id} className="shelf-card">
                        <div className={`thumb-placeholder ${thumbLoaded[shelf.id] ? 'loaded' : ''}`}>
                          <img
                            src={thumb}
                            alt={shelf.name}
                            onLoad={() => setThumbLoaded((s) => ({ ...s, [shelf.id]: true }))}
                          />
                        </div>
                        <div className="shelf-meta">
                          <div className="shelf-name">{shelf.name}</div>
                          <div className="shelf-count byline">{(shelf.books || []).length} books</div>
                        </div>
                        <button
                          className={`shelf-toggle-btn ${has ? 'on' : ''}`}
                          onClick={async () => {
                            try {
                              await onToggleShelf({ shelfId: shelf.id, bookId: book.id, add: !has });
                              showToast(has ? 'Removed from collection' : 'Added to collection');
                            } catch (e) { showToast('Action failed', 'error'); }
                          }}
                        >
                          {has ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {shelves && shelves.length > 4 && (
              <div style={{ marginTop: 8 }}>
                <button className="secondary" onClick={() => setShelvesModalOpen(true)}>View all collections</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {shelvesModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Collections</h3>
              <button className="secondary" onClick={() => setShelvesModalOpen(false)}>Close</button>
            </div>
            <div className="shelves-grid modal-grid">
              {shelves.map((shelf) => {
                const has = (shelf.books || []).some((b) => Number(b.id) === Number(book.id));
                const thumb = (shelf.books && shelf.books[0] && (shelf.books[0].image_url || shelf.books[0].imageUrl)) || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=200&q=60';
                return (
                  <div key={`modal-${shelf.id}`} className="shelf-card">
                    <img src={thumb} alt={shelf.name} />
                    <div className="shelf-meta">
                      <div className="shelf-name">{shelf.name}</div>
                      <div className="shelf-count byline">{(shelf.books || []).length} books</div>
                    </div>
                    <button
                      className={`shelf-toggle-btn ${has ? 'on' : ''}`}
                      onClick={async () => {
                        try {
                          await onToggleShelf({ shelfId: shelf.id, bookId: book.id, add: !has });
                          showToast(has ? 'Removed from collection' : 'Added to collection');
                        } catch (e) { showToast('Action failed', 'error'); }
                      }}
                    >
                      {has ? 'Added' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`flash ${toast.type}`} style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 60 }}>{toast.text}</div>
      )}
    </section>
  );
}
