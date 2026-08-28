import { useState } from 'react';

const API_URL = '/api';

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: 'rahul@example.com', password: 'password123' });
  const [registerForm, setRegisterForm] = useState({
    name: 'New Reader',
    email: 'reader@example.com',
    password: 'password123',
    city: 'Mumbai',
    phoneNumber: '+91 98765 43210',
    libraryMembershipNumber: 'LIB-1001'
  });

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    onLogin(data.user, data.token);
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    onLogin(data.user, data.token);
  };

  return (
    <section className="auth-panel">
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => setMode('login')} type="button">Login</button>
          <button className={mode === 'register' ? 'tab active' : 'tab'} onClick={() => setMode('register')} type="button">Register</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="stacked-form">
            <h2>Welcome back</h2>
            <p>Sign in to borrow, lend, and share books with the community.</p>
            <label>
              Email
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
            </label>
            <button type="submit">Login</button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="stacked-form">
            <h2>Create account</h2>
            <p>Join the peer-to-peer book sharing community.</p>
            <label>
              Full name
              <input type="text" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
            </label>
            <label>
              Email
              <input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
            </label>
            <label>
              Password
              <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
            </label>
            <label>
              City
              <input type="text" value={registerForm.city} onChange={(e) => setRegisterForm({ ...registerForm, city: e.target.value })} />
            </label>
            <label>
              Phone number
              <input type="tel" value={registerForm.phoneNumber} onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })} />
            </label>
            <label>
              Library membership number
              <input type="text" value={registerForm.libraryMembershipNumber} onChange={(e) => setRegisterForm({ ...registerForm, libraryMembershipNumber: e.target.value })} />
            </label>
            <button type="submit">Create account</button>
          </form>
        )}
      </div>
    </section>
  );
}
