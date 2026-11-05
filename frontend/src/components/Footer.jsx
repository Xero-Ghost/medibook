import { Link } from 'react-router-dom';
import { FaHeartbeat, FaMapMarkerAlt, FaPhoneAlt, FaRegEnvelope } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div><Link className="brand footer-brand" to="/"><span className="brand-mark"><FaHeartbeat /></span><span>Medi<span>Book</span></span></Link><p>Better care starts with a simpler way to connect with the people who care for you.</p></div>
        <div><h4>Explore</h4><Link to="/doctors">Find a doctor</Link><Link to="/contact">Contact us</Link><Link to="/register">Create an account</Link></div>
        <div><h4>Get in touch</h4><span><FaPhoneAlt /> (800) 555-0148</span><span><FaRegEnvelope /> hello@medibook.example</span><span><FaMapMarkerAlt /> 1200 Wellness Way, Suite 200</span></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} MediBook. Made for healthier days.</span><span>For emergencies, call your local emergency services.</span></div>
    </footer>
  );
}
