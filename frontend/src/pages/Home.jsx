import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCalendarCheck, FaCheck, FaChevronRight, FaClock, FaHeart, FaHeartbeat, FaLaptopMedical, FaSearch, FaShieldAlt, FaStar, FaUserMd } from 'react-icons/fa';
import api, { getErrorMessage } from '../services/api.js';
import DoctorCard from '../components/DoctorCard.jsx';
import Loading from '../components/Loading.jsx';
import { toast } from 'react-toastify';

const specialties = [
  { name: 'Cardiology', icon: '♡', tint: 'mint' }, { name: 'Dermatology', icon: '✳', tint: 'peach' },
  { name: 'Neurology', icon: '⌁', tint: 'lavender' }, { name: 'Pediatrics', icon: '＋', tint: 'blue' },
  { name: 'Orthopedics', icon: '↗', tint: 'mint' }, { name: 'General Practice', icon: '✚', tint: 'peach' }
];

export default function Home() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors')
      .then(({ data }) => setDoctors(data.doctors.slice(0, 3)))
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const searchDoctors = (event) => {
    event.preventDefault();
    navigate(`/doctors${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> YOUR HEALTH, OUR PRIORITY</span>
            <h1>Care that fits<br />your <span>life.</span></h1>
            <p className="hero-lead">Finding the right doctor shouldn't be hard. Book trusted care, on your schedule, with MediBook.</p>
            <form className="hero-search" onSubmit={searchDoctors}><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Doctor name or specialty" aria-label="Search doctors" /><button className="button button-primary">Find a doctor <FaArrowRight /></button></form>
            <div className="hero-trust"><div className="avatar-stack"><span>J</span><span>A</span><span>M</span><b>+</b></div><div><strong>10,000+ patients</strong><small>trust MediBook for their care</small></div><div className="trust-stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /><small>4.9/5</small></div></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame"><img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85" alt="Friendly doctor ready to help" /><div className="hero-image-shape" /></div>
            <div className="floating-note note-appointment"><span><FaCalendarCheck /></span><div><strong>Appointment booked</strong><small>Dr. Amelia Carter · 10:30 AM</small></div><FaCheck className="note-check" /></div>
            <div className="floating-note note-rating"><span className="rating-icon"><FaHeart /></span><div><strong>Here for you</strong><small>Care you can count on</small></div></div>
            <div className="hero-sparkle">✳</div>
          </div>
        </div>
        <div className="hero-bottom container"><span><FaShieldAlt /> Verified, trusted doctors</span><span><FaClock /> Appointments that fit your day</span><span><FaHeart /> Care that puts you first</span></div>
      </section>

      <section className="section specialties-section">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow">CARE FOR EVERY YOU</span><h2>Find care by specialty</h2><p>Expert care for every chapter of your health journey.</p></div><Link className="text-link" to="/doctors">View all doctors <FaArrowRight /></Link></div>
          <div className="specialty-grid">{specialties.map((item) => <Link className="specialty-tile" to={`/doctors?specialization=${encodeURIComponent(item.name)}`} key={item.name}><span className={`specialty-icon ${item.tint}`}>{item.icon}</span><strong>{item.name}</strong><FaChevronRight /></Link>)}</div>
        </div>
      </section>

      <section className="section featured-section"><div className="container">
        <div className="section-heading"><div><span className="eyebrow">MEET YOUR CARE TEAM</span><h2>Doctors who listen</h2><p>Get to know some of the people who make MediBook special.</p></div><Link className="text-link" to="/doctors">Meet our doctors <FaArrowRight /></Link></div>
        {loading ? <Loading label="Finding your care team..." /> : <div className="doctor-grid">{doctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor._id} />)}</div>}
      </div></section>

      <section className="section how-section"><div className="container how-grid">
        <div className="how-copy"><span className="eyebrow">HEALTHCARE, MADE SIMPLE</span><h2>A few clicks closer<br />to feeling better.</h2><p>From finding the right specialist to getting the care you need, we make every step feel easy.</p><Link className="button button-primary" to="/doctors">Book an appointment <FaArrowRight /></Link></div>
        <div className="steps">
          <div className="step-card"><span className="step-icon"><FaSearch /></span><div><span>01</span><h3>Find your doctor</h3><p>Browse trusted specialists and find the right fit for you.</p></div></div>
          <div className="step-card"><span className="step-icon"><FaCalendarCheck /></span><div><span>02</span><h3>Choose a time</h3><p>See available appointments and pick what works for your day.</p></div></div>
          <div className="step-card"><span className="step-icon"><FaLaptopMedical /></span><div><span>03</span><h3>Get the care you need</h3><p>Show up, feel heard, and take your next step toward better health.</p></div></div>
        </div>
      </div></section>

      <section className="section why-section"><div className="container why-inner"><div><span className="eyebrow">A BETTER WAY TO CARE</span><h2>Your health journey,<br />with a little more heart.</h2><p>Healthcare is personal. MediBook helps make finding care feel that way, too.</p><Link className="text-link" to="/doctors">Get started today <FaArrowRight /></Link></div><div className="why-benefits"><div><span><FaUserMd /></span><strong>People-first care</strong><p>Find thoughtful providers who take time to listen.</p></div><div><span><FaShieldAlt /></span><strong>Care you can trust</strong><p>Every profile is reviewed so you can book with confidence.</p></div><div><span><FaClock /></span><strong>Time well spent</strong><p>Convenient online booking means fewer calls and more control.</p></div></div></div></section>

      <section className="section testimonial-section"><div className="container testimonial-wrap"><div className="testimonial-quote">“</div><span className="eyebrow">KIND WORDS, HEALTHIER DAYS</span><h2>Finally, healthcare that<br />feels like it was made for me.</h2><p>“Booking my appointment was so easy, and I found a doctor who really listened. I felt cared for from the very first click.”</p><div className="testimonial-person"><span>JM</span><div><strong>Jordan M.</strong><small>MediBook patient</small></div><div className="testimonial-stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div></div></div></section>

      <section className="cta-section"><div className="container cta-inner"><div><span className="eyebrow">YOUR NEXT STEP STARTS HERE</span><h2>Ready to make your health<br />a little easier?</h2></div><Link className="button button-white" to="/doctors">Find your doctor <FaArrowRight /></Link></div></section>
    </>
  );
}
