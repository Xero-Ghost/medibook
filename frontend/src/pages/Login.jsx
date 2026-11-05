import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaHeartbeat, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Login() {
  const { signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (user) return <div className="auth-page"><div className="auth-card"><h1>You’re already signed in</h1><Link to="/dashboard" className="button button-primary">Go to dashboard <FaArrowRight /></Link></div></div>;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn(form);
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <Link className="brand auth-brand" to="/"><span className="brand-mark"><FaHeartbeat /></span><span>Medi<span>Book</span></span></Link>
        <span className="eyebrow">WELCOME BACK</span><h1>Good to see you.</h1><p className="auth-subtitle">Sign in to pick up where you left off.</p>
        <form className="form-stack" onSubmit={submit}>
          <label className="form-label">Email address<input required className="form-input" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label className="form-label">Password<input required className="form-input" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" /></label>
          <button className="button button-primary button-full" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'} <FaArrowRight /></button>
        </form>
        <div className="auth-assurance"><FaShieldAlt /> Your account and health information are secure.</div>
        <p className="auth-switch">New to MediBook? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  );
}
