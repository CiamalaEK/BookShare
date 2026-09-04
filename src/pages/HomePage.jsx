import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage({ user, books, requests, holds, onRequest, onAddBook, onImportBookBuddy, wishlist = [], onToggleWishlist }) {
  const [search, setSearch] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [adv, setAdv] = useState({
    title: '', author: '', isbn: '', category: '', publisher: '', language: '', genre: '', tags: '', member: '', availability: ''
  });
  const [activeFilter, setActiveFilter] = useState('');
  const [category, setCategory] = useState('All');
  const [showAddBook, setShowAddBook] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [bookBuddyImport, setBookBuddyImport] = useState('');
  const [serverBooks, setServerBooks] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(24);
  const [totalCount, setTotalCount] = useState(null);
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
      const matchesAdvancedTitle = !adv.title || (book.title || '').toLowerCase().includes(adv.title.toLowerCase());
      const matchesAdvancedAuthor = !adv.author || (book.author || '').toLowerCase().includes(adv.author.toLowerCase());
      const matchesIsbn = !adv.isbn || (book.isbn || '').toLowerCase().includes(adv.isbn.toLowerCase());
      const matchesCategory = (adv.category && adv.category !== 'All') ? ((book.category || '').toLowerCase().includes(adv.category.toLowerCase())) : (category === 'All' || book.category === category);
      const matchesPublisher = !adv.publisher || (book.publisher || '').toLowerCase().includes(adv.publisher.toLowerCase());
      const matchesLanguage = !adv.language || (book.language || '').toLowerCase().includes(adv.language.toLowerCase());
      const matchesGenre = !adv.genre || (book.genre || book.category || '').toLowerCase().includes(adv.genre.toLowerCase());
      const matchesTags = !adv.tags || ((book.tags || '').toLowerCase().split(',').some((t) => t.trim() && t.includes(adv.tags.toLowerCase())));
      const matchesMember = !adv.member || (book.ownerName || book.owner_name || '').toLowerCase().includes(adv.member.toLowerCase());
      const matchesAvailability = !adv.availability || (adv.availability === 'available' ? (book.status === 'available') : true);
      const matchesNearby = !nearbyOnly || !user?.city || !book.location || book.location.toLowerCase().includes(user.city.toLowerCase());

      return matchesSearch && matchesAdvancedTitle && matchesAdvancedAuthor && matchesIsbn && matchesCategory && matchesPublisher && matchesLanguage && matchesGenre && matchesTags && matchesMember && matchesAvailability && matchesNearby;
    });

    // compute popularity metrics from requests/holds
    const reqCount = {};
    (requests || []).forEach((r) => { reqCount[r.bookId ?? r.book_id] = (reqCount[r.bookId ?? r.book_id] || 0) + 1; });
    const holdCount = {};
    (holds || []).forEach((h) => { holdCount[h.bookId ?? h.book_id] = (holdCount[h.bookId ?? h.book_id] || 0) + 1; });

    // apply filter chips
    if (activeFilter === 'available') {
      data = data.filter((b) => (b.status || '').toLowerCase() === 'available');
    }
    if (activeFilter === 'issued') {
      data = data.filter((b) => (b.status || '').toLowerCase() !== 'available');
    }
    if (activeFilter === 'new') {
      const cutoff = Date.now() - (1000 * 60 * 60 * 24 * 30); // 30 days
      data = data.filter((b) => new Date(b.createdAt || b.created_at || 0).getTime() >= cutoff);
    }

    // sorting
    if (activeFilter === 'most_borrowed') {
      data = data.sort((a, b) => (reqCount[b.id] || 0) - (reqCount[a.id] || 0));
    } else if (activeFilter === 'most_popular') {
      data = data.sort((a, b) => ((reqCount[b.id] || 0) + (holdCount[b.id] || 0)) - ((reqCount[a.id] || 0) + (holdCount[a.id] || 0)));
    } else if (activeFilter === 'recent') {
      data = data.sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    } else if (nearbyOnly && user?.city) {
      data = data.sort((a, b) => {
        const aMatch = a.location && a.location.toLowerCase().includes(user.city.toLowerCase()) ? 0 : 1;
        const bMatch = b.location && b.location.toLowerCase().includes(user.city.toLowerCase()) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return data;
  }, [books, search, category, nearbyOnly, user]);

  // Decide when to use server-side search: when advanced or filter active or search length > 2
  const useServer = useMemo(() => !!(search && search.length > 2) || activeFilter || advancedOpen, [search, activeFilter, advancedOpen]);

  // Build query params object for server search
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (adv.title) params.set('title', adv.title);
    if (adv.author) params.set('author', adv.author);
    if (adv.isbn) params.set('isbn', adv.isbn);
    if (adv.genre) params.set('genre', adv.genre);
    if (adv.publisher) params.set('publisher', adv.publisher);
    if (adv.language) params.set('language', adv.language);
    if (adv.tags) params.set('tags', adv.tags);
    if (adv.member) params.set('member', adv.member);
    if (adv.availability) params.set('availability', adv.availability);
    if (activeFilter) params.set('filter', activeFilter);
    params.set('limit', String(limit));
    params.set('offset', String(page * limit));
    return params.toString();
  };

  // Debounced server search
  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const doSearch = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const qs = buildQueryParams();
        const res = await fetch(`http://localhost:5001/api/search?${qs}`);
        const data = await res.json();
        const totalHeader = res.headers.get('x-total-count');
        if (!cancelled) {
          setServerBooks(Array.isArray(data) ? data : []);
          setTotalCount(totalHeader ? Number(totalHeader) : null);
        }
      } catch (err) {
        if (!cancelled) setSearchError(err.message || 'Search failed');
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    };

    if (useServer) {
      timer = setTimeout(doSearch, 300);
    } else {
      // clear server results when not using server
      setServerBooks(null);
      setTotalCount(null);
    }

    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [search, adv, activeFilter, page, limit, useServer]);

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
        <button className="secondary" onClick={() => setAdvancedOpen((s) => !s)}>{advancedOpen ? 'Hide' : 'Advanced'}</button>
      </div>

      {advancedOpen && (
        <div className="panel-form">
          <div className="panel-grid">
            <input placeholder="Title" value={adv.title} onChange={(e) => setAdv({ ...adv, title: e.target.value })} />
            <input placeholder="Author" value={adv.author} onChange={(e) => setAdv({ ...adv, author: e.target.value })} />
            <input placeholder="ISBN" value={adv.isbn} onChange={(e) => setAdv({ ...adv, isbn: e.target.value })} />
            {/* <input placeholder="Category / Genre" value={adv.genre} onChange={(e) => setAdv({ ...adv, genre: e.target.value })} /> */}
            {/* <input placeholder="Publisher" value={adv.publisher} onChange={(e) => setAdv({ ...adv, publisher: e.target.value })} /> */}
            <input placeholder="Language" value={adv.language} onChange={(e) => setAdv({ ...adv, language: e.target.value })} />
            {/* <input placeholder="Tags (comma separated)" value={adv.tags} onChange={(e) => setAdv({ ...adv, tags: e.target.value })} /> */}
            {/* <input placeholder="Member / Donor name" value={adv.member} onChange={(e) => setAdv({ ...adv, member: e.target.value })} /> */}
            <select value={adv.availability} onChange={(e) => setAdv({ ...adv, availability: e.target.value })}>
              <option value="">Any availability</option>
              <option value="available">Available now</option>
              <option value="issued">Currently issued</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setActiveFilter('')}>Clear Filters</button>
            {/* <button onClick={() => setActiveFilter('available')}>Available now</button>
            <button onClick={() => setActiveFilter('issued')}>Currently issued</button>
            <button onClick={() => setActiveFilter('new')}>New arrivals</button>
            <button onClick={() => setActiveFilter('most_borrowed')}>Most borrowed</button>
            <button onClick={() => setActiveFilter('most_popular')}>Most popular</button>
            <button onClick={() => setActiveFilter('recent')}>Recently added</button> */}
          </div>
        </div>
      )}

      {searchLoading ? (
        <div className="search-loading">Loading results…</div>
      ) : searchError ? (
        <div className="search-error">Error: {searchError}</div>
      ) : useServer && serverBooks && serverBooks.length === 0 ? (
        <div className="no-results">No results found.</div>
      ) : (
        <div className="book-grid">
          {(serverBooks || displayedBooks).map((book) => {
          const statusText = getRequestStatus(book.id) ? formatStatus(getRequestStatus(book.id)) : formatStatus(book.status);
          const requestState = getRequestStatus(book.id);
          const holdPosition = getHoldQueuePosition(book.id);

          const liked = Array.isArray(wishlist) && wishlist.some((b) => Number(b.id) === Number(book.id));

          return (
            <article className="book-card" key={book.id}>
              <button
                type="button"
                className={`heart-btn ${liked ? 'liked' : ''}`}
                onClick={async () => {
                  try { if (typeof onToggleWishlist === 'function') await onToggleWishlist({ bookId: book.id, add: !liked }); } catch (e) { }
                }}
                aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                  <path d="M12 21s-7.5-4.5-10-7.5C-0.5 9.5 3 4 8 4c1.7 0 3.4.8 4 2 .6-1.2 2.3-2 4-2 5 0 8.5 5.5 6 9.5C19.5 16.5 12 21 12 21z" />
                </svg>
              </button>
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
                  <button className="secondary" onClick={() => navigate(`/books/${book.id}`)}>View details</button>
                </div>
              </div>
            </article>
          );
          })}
        </div>
      )}

      {useServer && (() => {
        const hasPrev = page > 0;
        const hasNext = typeof totalCount === 'number' ? ((page + 1) * limit) < totalCount : (Array.isArray(serverBooks) ? serverBooks.length === limit : false);
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>
              <button onClick={() => hasPrev && setPage((p) => Math.max(0, p - 1))} disabled={!hasPrev}>Prev</button>
              <button onClick={() => hasNext && setPage((p) => p + 1)} disabled={!hasNext} style={{ marginLeft: 8 }}>Next</button>
              <span style={{ marginLeft: 12 }}>Page {page + 1}{ typeof totalCount === 'number' ? ` of ${Math.max(1, Math.ceil(totalCount / limit))}` : '' }</span>
            </div>
            <div>
              <label>Per page: </label>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }}>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>
        );
      })()}
    </section>
  );
}
