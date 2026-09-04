import { Navigate } from 'react-router-dom';

export default function WishlistPage({ user, books = [], onToggleWishlist = () => {}, wishlist = [] }) {
  if (!user) return <Navigate to="/login" replace />;

  return (
    <section>
      <h2>My Wishlist</h2>
      {books.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div className="book-grid compact">
          {books.map((book) => {
            const liked = Array.isArray(wishlist) && wishlist.some((b) => Number(b.id) === Number(book.id));
            return (
              <article className="book-card" key={book.id}>
                <button
                  type="button"
                  className={`heart-btn ${liked ? 'liked' : ''}`}
                  onClick={async () => { try { await onToggleWishlist({ bookId: book.id, add: false }); } catch (e) {} }}
                  aria-label="Remove from wishlist"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                    <path d="M12 21s-7.5-4.5-10-7.5C-0.5 9.5 3 4 8 4c1.7 0 3.4.8 4 2 .6-1.2 2.3-2 4-2 5 0 8.5 5.5 6 9.5C19.5 16.5 12 21 12 21z" />
                  </svg>
                </button>
                <img src={book.imageUrl || ''} alt={book.title} />
                <div className="book-card-body">
                  <h3>{book.title}</h3>
                  <p className="byline">{book.author}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
