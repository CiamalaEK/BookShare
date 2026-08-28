import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage({ user, books, requests, holds, onRequest, onHold, onAddBook, onImportBookBuddy }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [bookBuddyImport, setBookBuddyImport] = useState('');
  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: 'Fiction',
    language: 'English',
    condition: 'Good',
    sharingType: 'lend',
    location: user?.city || 'Bengaluru',
    lendingDurationDays: 14
  });
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setForm((current) => ({ ...current, location: user?.city || current.location || 'Bengaluru' }));
  }, [user]);

  const getRequestStatus = (bookId) => {
    if (!user) return null;
    const match = requests.find(
      (request) => Number(request.bookId) === Number(bookId) && Number(request.requesterId) === Number(user.id)
    );
    return match ? match.status : null;
  };

  const getHoldQueuePosition = (bookId) => {
    if (!user) return null;
    const match = holds.find((hold) => Number(hold.bookId) === Number(bookId) && Number(hold.userId) === Number(user.id) && hold.status !== 'cancelled');
    return match ? match.queuePosition : null;
  };

  const displayedBooks = useMemo(() => {
    let data = books.filter((book) => {
      const matchesSearch = !search || `${book.title} ${book.author}`.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || book.category === category;
      const matchesNearby = !nearbyOnly || !user?.city || !book.location || book.location.toLowerCase().includes(user.city.toLowerCase());
      return matchesSearch && matchesCategory && matchesNearby;
    });

    if (nearbyOnly && user?.city) {
      data = data.sort((a, b) => {
        const aMatch = a.location && a.location.toLowerCase().includes(user.city.toLowerCase()) ? 0 : 1;
        const bMatch = b.location && b.location.toLowerCase().includes(user.city.toLowerCase()) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return data;
  }, [books, search, category, nearbyOnly, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) return;

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    payload.append('ownerId', user.id);
    if (image) payload.append('image', image);

    await onAddBook(payload);
    setShowAddBook(false);
    setForm({
      title: '',
      author: '',
      isbn: '',
      category: 'Fiction',
      language: 'English',
      condition: 'Good',
      sharingType: 'lend',
      location: user.city || 'Bengaluru',
      lendingDurationDays: 14
    });
  };

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

  return (
    <section>
      <div className="hero">
        <div>
          <span className="eyebrow">Community library</span>
          <h2>Browse the lending catalog.</h2>
          <p>Discover books in the collection, join the hold queue, and manage member borrowing activity.</p>
        </div>
        <div className="hero-actions">
          <button onClick={() => setShowAddBook((prev) => !prev)}>Add a Book</button>
          <button className="secondary" onClick={() => setShowImport((prev) => !prev)}>Import Book Buddy</button>
          <button className="secondary" onClick={() => setNearbyOnly((prev) => !prev)}>
            {nearbyOnly ? 'Show All' : 'Browse Nearby'}
          </button>
        </div>
      </div>

      {nearbyOnly && user?.city && <p className="helper-text">Showing books near {user.city}</p>}

      {showImport && (
        <div className="panel-form">
          <div className="panel-grid single-column">
            <textarea
              rows="7"
              value={bookBuddyImport}
              onChange={(event) => setBookBuddyImport(event.target.value)}
              placeholder="Paste Book Buddy JSON array or { books: [...] } export here"
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await onImportBookBuddy(bookBuddyImport);
                setShowImport(false);
                setBookBuddyImport('');
              } catch (error) {
                alert(error.message || 'Import failed.');
              }
            }}
            disabled={!bookBuddyImport.trim()}
          >
            Import records
          </button>
        </div>
      )}

      {showAddBook && (
        <form onSubmit={handleSubmit} className="panel-form">
          <div className="panel-grid">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Title" required />
            <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} placeholder="Author" required />
            <input value={form.isbn} onChange={(event) => setForm({ ...form, isbn: event.target.value })} placeholder="ISBN" />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>Fiction</option>
              <option>Classic</option>
              <option>Technology</option>
              <option>Self Help</option>
            </select>
            <input value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} placeholder="Language" />
            <select value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })}>
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Like New</option>
            </select>
            <select value={form.sharingType} onChange={(event) => setForm({ ...form, sharingType: event.target.value })}>
              <option value="lend">Lend</option>
              <option value="giveaway">Give away</option>
            </select>
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Location" />
            <input type="number" value={form.lendingDurationDays} onChange={(event) => setForm({ ...form, lendingDurationDays: Number(event.target.value) })} placeholder="Lending duration days" />
            <input type="file" accept="image/*" onChange={(event) => setImage(event.target.files[0])} />
          </div>
          <button type="submit">Save Book</button>
        </form>
      )}

      <div className="toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or author" />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          <option>Fiction</option>
          <option>Classic</option>
          <option>Technology</option>
          <option>Self Help</option>
        </select>
      </div>

      <div className="book-grid">
        {displayedBooks.map((book) => {
          const statusText = getRequestStatus(book.id) ? formatStatus(getRequestStatus(book.id)) : formatStatus(book.status);
          const requestState = getRequestStatus(book.id);
          const holdPosition = getHoldQueuePosition(book.id);

          return (
            <article className="book-card" key={book.id}>
              <img src={book.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'} alt={book.title} />
              <div className="book-card-body">
                <div className="meta-row">
                  <span className="badge">{book.sharingType}</span>
                  <span className={`badge status-badge ${getStatusClass(statusText)}`}>{statusText}</span>
                </div>
                <h3>{book.title}</h3>
                <p className="byline">{book.author}</p>
                <p>{book.category} • {book.language}</p>
                <p>Owner: {book.ownerName || book.owner_name || 'Unknown'}</p>
                <p>{book.location}</p>
                {holdPosition && <p className="helper-text">Hold queue: #{holdPosition}</p>}
                <div className="actions-row">
                  <button
                    className={requestState ? `status-button ${getStatusClass(requestState)}` : 'primary'}
                    onClick={() => onRequest(book.id)}
                    disabled={!user || Number(book.ownerId) === Number(user.id) || !!requestState}
                  >
                    {requestState ? formatStatus(requestState) : 'Request'}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => onHold(book.id)}
                    disabled={!user || Number(book.ownerId) === Number(user.id) || !!holdPosition}
                  >
                    {holdPosition ? `Queue #${holdPosition}` : 'Place hold'}
                  </button>
                  <button className="secondary" onClick={() => navigate(`/books/${book.id}`)}>View details</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
