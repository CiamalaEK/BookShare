import { Navigate } from 'react-router-dom';

export default function NotificationsPage({ notifications, user }) {
  if (!user) return <Navigate to="/login" replace />;

  return (
    <section>
      <h2>Alerts</h2>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-item empty-state">
            <p>No alerts right now.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div className="notification-item" key={notification.id}>
              <p>{notification.message}</p>
              <span className="badge">{notification.type || 'info'}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
