import { useState } from 'react';
import { FaClock, FaMapMarkerAlt, FaPhoneAlt, FaRegEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api, { getErrorMessage } from '../services/api.js';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', topic: 'General question', message: '' });
  const [sending, setSending] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await api.post('/contact', form);
      toast.success('Thanks for reaching out. Our team will be in touch soon.');
      setForm({ name: '', email: '', topic: 'General question', message: '' });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-section">
      <div className="page-banner"><div className="container"><span className="eyebrow">WE’RE HERE FOR YOU</span><h1>Let’s talk.</h1><p>Questions about care or your account? Our friendly team is happy to help.</p></div></div>
      <section className="container contact-layout">
        <div className="contact-details"><span className="eyebrow">GET IN TOUCH</span><h2>Good care starts with a conversation.</h2><p>Reach out and a member of our team will be glad to point you in the right direction.</p><div className="contact-detail"><span><FaPhoneAlt /></span><div><strong>Give us a call</strong><a href="tel:+18005550148">(800) 555-0148</a><small>Monday–Friday, 8am–6pm</small></div></div><div className="contact-detail"><span><FaRegEnvelope /></span><div><strong>Send us an email</strong><a href="mailto:hello@medibook.example">hello@medibook.example</a><small>We usually reply within one business day.</small></div></div><div className="contact-detail"><span><FaMapMarkerAlt /></span><div><strong>Visit our care center</strong><span>1200 Wellness Way, Suite 200<br />Portland, OR 97201</span></div></div><div className="contact-hours"><FaClock /> If you're experiencing a medical emergency, call your local emergency services.</div></div>
        <form className="contact-form" onSubmit={submit}><span className="eyebrow">SEND A NOTE</span><h2>How can we help?</h2><label className="form-label">Your name<input required className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" /></label><label className="form-label">Email address<input required type="email" className="form-input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label className="form-label">What can we help with?<select className="form-input" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}><option>General question</option><option>Appointments</option><option>Account support</option><option>Provider partnership</option></select></label><label className="form-label">Your message<textarea required rows="5" maxLength="2000" className="form-input" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us a little more..." /></label><button disabled={sending} className="button button-primary button-full">{sending ? 'Sending message...' : 'Send message'}</button><small className="contact-privacy">Your message is securely shared with the MediBook support team.</small></form>
      </section>
    </div>
  );
}
