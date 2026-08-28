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

export default function MyBooksPage({ user, books }) {
  if (!user) return <Navigate to="/login" replace />;

  const myBooks = books.filter((book) => Number(book.ownerId ?? book.owner_id) === Number(user.id));

  return (
    <section>
      <h2>My Books</h2>
      <div className="book-grid compact">
        {myBooks.map((book) => (
          <article className="book-card" key={book.id}>
            <img src={book.imageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80'} alt={book.title} />
            <div className="book-card-body">
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p><span className={`badge status-badge ${getStatusClass(book.status)}`}>{formatStatus(book.status)}</span></p>
              <p>Sharing: {book.sharingType}</p>
              {book.dueDate && <p>Due date: {new Date(book.dueDate).toLocaleDateString()}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
