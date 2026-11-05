import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaHeartbeat, FaRegUserCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const signOut = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <header className="site-header">
      <nav className="navbar container">
        <Link className="brand" to="/" onClick={close}><span className="brand-mark"><FaHeartbeat /></span><span>Medi<span>Book</span></span></Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <FaTimes /> : <FaBars />}</button>
        <div className={`nav-links ${open ? 'nav-open' : ''}`}>
          <NavLink to="/" onClick={close}>Home</NavLink>
          <NavLink to="/doctors" onClick={close}>Find a doctor</NavLink>
          <NavLink to="/contact" onClick={close}>Contact</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={close}><FaRegUserCircle /> My dashboard</NavLink>
              <button className="button button-outline nav-logout" onClick={signOut}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Log in</NavLink>
              <Link className="button button-primary nav-cta" to="/register" onClick={close}>Create account</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
