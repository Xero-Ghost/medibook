import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaHeartbeat, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api.js';

export default function Register() {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  if (user) return <div className="auth-page"><div className="auth-card"><h1>You’re already signed in</h1><Link to="/dashboard" className="button button-primary">Go to dashboard <FaArrowRight /></Link></div></div>;

  const submit = async (event) => {
    event.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    setSubmitting(true);
    try {
      await signUp(form);
      toast.success('Your patient account is ready.');
      navigate('/dashboard', { replace: true });
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
        <span className="eyebrow">A HEALTHIER YOU STARTS HERE</span><h1>Care starts with you.</h1><p className="auth-subtitle">Create your free patient account and find care that feels right.</p>
        <form className="form-stack" onSubmit={submit}>
          <label className="form-label">Full name<input required minLength="2" maxLength="80" className="form-input" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
          <label className="form-label">Email address<input required type="email" className="form-input" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label className="form-label">Phone number <span>Optional</span><input className="form-input" type="tel" autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="(555) 000-0000" /></label>
          <label className="form-label">Password<input required minLength="8" type="password" className="form-input" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></label>
          <button className="button button-primary button-full" disabled={submitting}>{submitting ? 'Creating account...' : 'Create my account'} <FaArrowRight /></button>
        </form>
        <div className="auth-assurance"><FaShieldAlt /> Your information is private and protected.</div>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
