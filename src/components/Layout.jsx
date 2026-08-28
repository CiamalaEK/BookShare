import { NavLink } from 'react-router-dom';

export default function Layout({ user, onLogout, flash, children }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-logo">B</div>
          <div>
            <h1>BookShare</h1>
            <p>Peer-to-peer book sharing</p>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/">Browse</NavLink>
          {user && <NavLink to="/my-books">My Books</NavLink>}
          {user && <NavLink to="/requests">Requests</NavLink>}
          {user && <NavLink to="/notifications">Alerts</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="user-section">
          {user ? (
            <>
              <span>{user.name}</span>
              <button className="secondary" onClick={onLogout}>Logout</button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </div>
      </header>

      {flash && <div className={`flash ${flash.type}`}>{flash.text}</div>}
      <main className="main-content">{children}</main>
    </div>
  );
}
