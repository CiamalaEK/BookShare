import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import BookDetailPage from './pages/BookDetailPage';
import MyBooksPage from './pages/MyBooksPage';
import RequestsPage from './pages/RequestsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

const API_URL = '/api';

const authHeaders = (token = localStorage.getItem('bookshare-token')) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const normalizeBook = (book = {}) => ({
  ...book,
  id: Number(book.id),
  ownerId: book.ownerId ?? book.owner_id,
  ownerName: book.ownerName ?? book.owner_name ?? 'Unknown',
  imageUrl: book.imageUrl ?? book.image_url ?? '',
  sharingType: book.sharingType ?? book.sharing_type ?? 'lend',
  condition: book.condition ?? book.condition_name ?? 'Good',
  dueDate: book.dueDate ?? book.due_date,
  createdAt: book.createdAt ?? book.created_at
});

const normalizeRequest = (request = {}) => ({
  ...request,
  id: Number(request.id),
  bookId: request.bookId ?? request.book_id,
  requesterId: request.requesterId ?? request.requester_id,
  ownerId: request.ownerId ?? request.owner_id,
  bookTitle: request.bookTitle ?? request.book_title,
  requesterName: request.requesterName ?? request.requester_name,
  ownerName: request.ownerName ?? request.owner_name,
  dueDate: request.dueDate ?? request.due_date,
  createdAt: request.createdAt ?? request.created_at
});

const normalizeNotification = (notification = {}) => ({
  ...notification,
  id: Number(notification.id),
  userId: notification.userId ?? notification.user_id,
  createdAt: notification.createdAt ?? notification.created_at,
  isRead: notification.isRead ?? notification.is_read ?? false
});

const normalizeHold = (hold = {}) => ({
  ...hold,
  id: Number(hold.id),
  bookId: hold.bookId ?? hold.book_id,
  userId: hold.userId ?? hold.user_id,
  queuePosition: hold.queuePosition ?? hold.queue_position ?? 1,
  createdAt: hold.createdAt ?? hold.created_at
});

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('bookshare-user') || 'null'));
  const [token, setToken] = useState(() => localStorage.getItem('bookshare-token') || '');
  const [books, setBooks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [holds, setHolds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [flash, setFlash] = useState(null);

  const loadData = async () => {
    if (!user || !token) {
      setBooks([]);
      setRequests([]);
      setHolds([]);
      setNotifications([]);
      return;
    }

    const [booksResponse, requestsResponse, alertsResponse, holdsResponse] = await Promise.all([
      fetch(`${API_URL}/books`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/requests`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/alerts`, { headers: authHeaders(token) }),
      fetch(`${API_URL}/holds`, { headers: authHeaders(token) })
    ]);

    const booksData = await booksResponse.json();
    const requestsData = await requestsResponse.json();
    const alertsData = await alertsResponse.json();
    const holdsData = await holdsResponse.json();

    setBooks(Array.isArray(booksData) ? booksData.map(normalizeBook) : []);
    setRequests(Array.isArray(requestsData) ? requestsData.map(normalizeRequest) : []);
    setNotifications(Array.isArray(alertsData) ? alertsData.map(normalizeNotification) : []);
    setHolds(Array.isArray(holdsData) ? holdsData.map(normalizeHold) : []);
  };

  useEffect(() => {
    if (user && token) {
      loadData();
    } else {
      setBooks([]);
      setRequests([]);
      setHolds([]);
      setNotifications([]);
    }
  }, [user, token]);

  const alerts = useMemo(() => notifications, [notifications]);

  const handleLogin = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('bookshare-user', JSON.stringify(userData));
    localStorage.setItem('bookshare-token', accessToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    setFlash(null);
    localStorage.removeItem('bookshare-user');
    localStorage.removeItem('bookshare-token');
  };

  const requestBook = async (bookId) => {
    if (!user || !token) return;

    const targetBook = books.find((book) => Number(book.id) === Number(bookId));
    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        bookId,
        requesterId: user.id,
        ownerId: targetBook?.ownerId,
        requestType: targetBook?.sharingType || 'lend'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setFlash({ type: 'error', text: data.message || 'Unable to send request.' });
      return;
    }

    setFlash({ type: 'success', text: `Request sent successfully. Status: Pending for ${targetBook?.title || 'this book'}.` });
    await loadData();
  };

  const placeHold = async (bookId) => {
    if (!user || !token) return;

    const response = await fetch(`${API_URL}/holds`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ bookId, userId: user.id })
    });

    const data = await response.json();
    if (!response.ok) {
      setFlash({ type: 'error', text: data.message || 'Unable to place hold.' });
      return;
    }

    setFlash({ type: 'success', text: `Your hold has been queued successfully. Position: #${data.queue_position || 1}.` });
    await loadData();
  };

  const fulfillHold = async (holdId) => {
    if (!user || !token) return;

    const response = await fetch(`${API_URL}/holds/${holdId}/fulfill`, {
      method: 'POST',
      headers: authHeaders(token)
    });

    const data = await response.json();
    if (!response.ok) {
      setFlash({ type: 'error', text: data.message || 'Unable to fulfill hold.' });
      return;
    }

    setFlash({ type: 'success', text: 'Hold fulfilled and queue advanced.' });
    await loadData();
  };

  const importBookBuddyData = async (payload) => {
    if (!user || !token) return;

    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    const response = await fetch(`${API_URL}/books/import`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(parsed)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Unable to import Book Buddy records.');
    }

    await loadData();
    return data;
  };

  const updateRequestStatus = async (requestId, status, dueDate, deliveryDate, receiptDate, loanDurationDays) => {
    const response = await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status, dueDate, deliveryDate, receiptDate, loanDurationDays })
    });

    const data = await response.json();
    if (!response.ok) {
      setFlash({ type: 'error', text: data.message || 'Unable to update request.' });
      return;
    }

    setFlash({ type: 'success', text: `Request ${status} successfully.` });
    await loadData();
  };

  const markReturned = async (requestId) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/return`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ userId: user.id })
    });

    const data = await response.json();
    if (!response.ok) {
      setFlash({ type: 'error', text: data.message || 'Return action failed.' });
      return;
    }

    setFlash({ type: 'success', text: 'Book marked as returned successfully.' });
    await loadData();
  };

  const addBook = async (formData) => {
    const response = await fetch(`${API_URL}/books`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });

    const created = await response.json();
    if (response.ok) {
      await loadData();
      return created;
    }
    throw new Error(created.message || 'Unable to add book');
  };

  return (
    <Layout user={user} onLogout={handleLogout} flash={flash}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />} />
        <Route path="/" element={<HomePage user={user} books={books} requests={requests} holds={holds} onRequest={requestBook} onHold={placeHold} onAddBook={addBook} onImportBookBuddy={importBookBuddyData} />} />
        <Route path="/books/:id" element={<BookDetailPage user={user} books={books} requests={requests} holds={holds} onRequest={requestBook} onHold={placeHold} />} />
        <Route path="/my-books" element={<MyBooksPage user={user} books={books} />} />
        <Route path="/requests" element={<RequestsPage user={user} requests={requests} holds={holds} onUpdateStatus={updateRequestStatus} onMarkReturned={markReturned} onFulfillHold={fulfillHold} />} />
        <Route path="/notifications" element={<NotificationsPage notifications={alerts} user={user} />} />
        <Route path="/admin" element={<AdminDashboardPage user={user} />} />
      </Routes>
    </Layout>
  );
}

export default App;
