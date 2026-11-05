import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBriefcaseMedical, FaCalendarCheck, FaCheckCircle, FaClock, FaGraduationCap, FaMapMarkerAlt, FaShieldAlt, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getErrorMessage } from '../services/api.js';
import Loading from '../components/Loading.jsx';
import { doctorPhoto } from '../components/DoctorCard.jsx';
import { clinicNow } from '../../../shared/clinicTime.js';

const today = () => clinicNow().date;

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(today());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const minDate = useMemo(() => today(), []);

  useEffect(() => {
    const controller = new AbortController();
    api.get(`/doctors/${id}`, { signal: controller.signal })
      .then(({ data }) => setDoctor(data.doctor))
      .catch((error) => { if (!controller.signal.aborted) toast.error(getErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    setSelectedSlot('');
    setSlots([]);
    if (!doctor || !date) {
      setSlotsLoading(false);
      return;
    }
    const controller = new AbortController();
    setSlotsLoading(true);
    api.get(`/doctors/${id}/slots`, { params: { date }, signal: controller.signal })
      .then(({ data }) => setSlots(data.slots))
      .catch((error) => { if (!controller.signal.aborted) toast.error(getErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setSlotsLoading(false); });
    return () => controller.abort();
  }, [doctor, date, id]);

  if (loading) return <div className="container profile-loading"><Loading label="Loading doctor profile..." /></div>;
  if (!doctor) return <div className="container profile-loading"><h2>We couldn't find this doctor.</h2><Link className="text-link" to="/doctors">Browse all doctors</Link></div>;

  const bookAppointment = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
      return;
    }
    if (user.role !== 'patient') return toast.info('Appointments can be booked from a patient account.');
    if (!date || !selectedSlot) return toast.error('Choose an appointment date and available time.');
    setBooking(true);
    try {
      await api.post('/appointments', { doctorId: doctor._id, appointmentDate: date, timeSlot: selectedSlot, reason });
      toast.success('Appointment request sent! You can follow its status in your dashboard.');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
      if (error.response?.status === 409) {
        setSelectedSlot('');
        setSlots([]);
        try {
          const { data } = await api.get(`/doctors/${id}/slots`, { params: { date } });
          setSlots(data.slots);
        } catch (refreshError) {
          toast.error(getErrorMessage(refreshError));
        }
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <section className="container profile-page">
      <Link className="back-link" to="/doctors"><FaArrowLeft /> All doctors</Link>
      <div className="profile-layout">
        <div className="profile-main">
          <article className="profile-card">
            <img className="profile-image" src={doctorPhoto(doctor)} alt={doctor.userId?.name} />
            <div className="profile-intro">
              <span className="availability-pill"><i /> Accepting patients</span>
              <h1>{doctor.userId?.name}</h1>
              <p className="profile-specialty">{doctor.specialization} <span>·</span> {doctor.qualification}</p>
              <div className="profile-rating"><FaStar /> 4.9 <span>(120+ patient reviews)</span></div>
              <div className="profile-facts"><span><FaBriefcaseMedical /> {doctor.experience} years of experience</span><span><FaMapMarkerAlt /> MediBook Health Center</span><span><FaShieldAlt /> Verified provider</span></div>
            </div>
          </article>
          <article className="content-card about-card"><span className="eyebrow">GET TO KNOW YOUR DOCTOR</span><h2>About {doctor.userId?.name?.split(' ')[1] || 'your doctor'}</h2><p>{doctor.about || 'Dedicated to providing thoughtful, personalized care to every patient.'}</p><div className="credential-line"><FaGraduationCap /><div><strong>Education & qualifications</strong><span>{doctor.qualification}</span></div></div></article>
          <article className="content-card"><div className="card-title-row"><div><span className="eyebrow">SCHEDULE A VISIT</span><h2>Choose a time that works</h2></div><span className="timezone-note"><FaClock /> India time (IST)</span></div>
            <label className="form-label">Appointment date<input className="form-input" type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} /></label>
            {slotsLoading ? <Loading label="Loading available times..." /> : slots.length ? <div className="slot-grid">{slots.map((slot) => <button key={slot} className={`slot-button ${selectedSlot === slot ? 'slot-selected' : ''}`} onClick={() => setSelectedSlot(slot)}>{slot}</button>)}</div> : <p className="no-slots">No times available for this date. Please try another day.</p>}
            <label className="form-label reason-label">What would you like help with? <span>Optional</span><textarea className="form-input" rows="3" maxLength="500" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="A short note to help your doctor prepare..." /></label>
          </article>
        </div>
        <aside className="booking-card"><span className="eyebrow">YOUR APPOINTMENT</span><h3>Plan your visit</h3><div className="booking-detail"><span>Consultation fee</span><strong>${doctor.consultationFee}</strong></div><div className="booking-detail"><span>Appointment</span><strong>{selectedSlot ? `${date} · ${selectedSlot}` : 'Select a date and time'}</strong></div><div className="booking-included"><FaCheckCircle /> No payment required to request a visit</div><button className="button button-primary button-full" disabled={booking || !selectedSlot} onClick={bookAppointment}>{booking ? 'Sending request...' : 'Request appointment'} <FaCalendarCheck /></button><small className="secure-note"><FaShieldAlt /> Your health information stays private</small></aside>
      </div>
    </section>
  );
}
