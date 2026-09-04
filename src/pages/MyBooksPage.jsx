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

import { useState } from 'react';

export default function MyBooksPage({ user, books, shelves = [], onCreateShelf, wishlist = [], onToggleWishlist = () => {} }) {
  if (!user) return <Navigate to="/login" replace />;

  const myBooks = books.filter((book) => Number(book.ownerId ?? book.owner_id) === Number(user.id));
  const [creating, setCreating] = useState(false);
  const [shelfName, setShelfName] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const toggleSelect = (id) => {
    const idx = selectedBookIds.indexOf(id);
    if (idx === -1) setSelectedBookIds([...selectedBookIds, id]);
    else setSelectedBookIds(selectedBookIds.filter((x) => x !== id));
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    if (!shelfName.trim()) return;
    await onCreateShelf({ name: shelfName.trim(), description: '', bookIds: selectedBookIds });
    setShelfName('');
    setSelectedBookIds([]);
    setCreating(false);
  };

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2>My Books</h2>
        <div>
          <button onClick={() => setCreating(true)} style={{ marginRight: 8 }}>Create Shelf</button>
        </div>
      </div>

      <div className="auth-tabs" style={{ marginBottom: 12 }}>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Books</button>
        <button className={`tab ${activeTab === 'shelves' ? 'active' : ''}`} onClick={() => setActiveTab('shelves')}>Shelves</button>
      </div>

      {activeTab === 'shelves' ? (
        <div style={{ marginBottom: 16 }}>
          {shelves.length === 0 ? (
            <p>No shelves yet. Create one to organize your books.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {shelves.map((shelf) => (
                <div key={shelf.id} className="shelf-section">
                  <div className="shelf-header">
                    <h3>{shelf.name}</h3>
                    <div className="byline">{(shelf.books || []).length} books</div>
                  </div>
                  <div className="book-grid">
                    {(shelf.books || []).map((b) => {
                      const likedB = Array.isArray(wishlist) && wishlist.some((w) => Number(w.id) === Number(b.id));
                      return (
                        <article className="book-card" key={b.id}>
                          <button type="button" className={`heart-btn ${likedB ? 'liked' : ''}`} onClick={async () => { try { if (typeof onToggleWishlist === 'function') await onToggleWishlist({ bookId: b.id, add: !likedB }); } catch (e) {} }} aria-label={likedB ? 'Remove from wishlist' : 'Add to wishlist'}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                              <path d="M12 21s-7.5-4.5-10-7.5C-0.5 9.5 3 4 8 4c1.7 0 3.4.8 4 2 .6-1.2 2.3-2 4-2 5 0 8.5 5.5 6 9.5C19.5 16.5 12 21 12 21z" />
                            </svg>
                          </button>
                          <img src={b.image_url || b.imageUrl || ''} alt={b.title} />
                          <div className="book-card-body">
                            <h3>{b.title}</h3>
                            <p className="byline">{b.author}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="book-grid compact">
          {myBooks.map((book) => 
          {
            const liked = Array.isArray(wishlist) && wishlist.some((b) => Number(b.id) === Number(book.id));
           return (
            <article className="book-card" key={book.id}>
              <button
                  type="button"
                  className={`heart-btn ${liked ? 'liked' : ''}`}
                  onClick={async () => { try { if (typeof onToggleWishlist === 'function') await onToggleWishlist({ bookId: book.id, add: !liked }); } catch (e) { } }}
                  aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                    <path d="M12 21s-7.5-4.5-10-7.5C-0.5 9.5 3 4 8 4c1.7 0 3.4.8 4 2 .6-1.2 2.3-2 4-2 5 0 8.5 5.5 6 9.5C19.5 16.5 12 21 12 21z" />
                  </svg>
                </button>
              <img src={book.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'} alt={book.title} />
              <div className="book-card-body">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <p><span className={`badge status-badge ${getStatusClass(book.status)}`}>{formatStatus(book.status)}</span></p>
                <p>Sharing: {book.sharingType}</p>
                {book.dueDate && <p>Due date: {new Date(book.dueDate).toLocaleDateString()}</p>}
              </div>
            </article>
          )})}
        </div>
      )}

      {/* Modal for creating shelf */}
      {creating && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Create Shelf</h3>
            <form onSubmit={submitCreate} className="stacked-form">
              <input placeholder="Shelf name" value={shelfName} onChange={(e) => setShelfName(e.target.value)} />
                <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eef2ff', padding: 8, borderRadius: 8 }}>
                  {myBooks.map((book) => (
                    <label key={book.id} className="book-select-item">
                      <input type="checkbox" checked={selectedBookIds.includes(book.id)} onChange={() => toggleSelect(book.id)} />
                      {/* <img src={book.imageUrl || book.image_url || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=400&q=60'} alt={book.title} /> */}
                      <span>{book.title}</span>
                      <small className="byline">{book.author}</small>
                    </label>
                  ))}
                </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit">Save Shelf</button>
                <button type="button" className="secondary" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
