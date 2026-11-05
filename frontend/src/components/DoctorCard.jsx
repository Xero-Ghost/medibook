import { Link } from 'react-router-dom';
import { FaArrowRight, FaBriefcaseMedical, FaStar } from 'react-icons/fa';

const photos = {
  Cardiology: 'photo-1612349317150-e413f6a5b16d',
  Dermatology: 'photo-1612349317150-e413f6a5b16d',
  Neurology: 'photo-1559839734-2b71ea197ec2',
  Pediatrics: 'photo-1622253692010-333f2da6031d',
  Orthopedics: 'photo-1622902046580-2b47f47f5471',
  'General Practice': 'photo-1582750433449-648ed127bb54'
};

export function doctorPhoto(doctor) {
  const custom = doctor.userId?.profileImage;
  const image = photos[doctor.specialization] || photos['General Practice'];
  return custom || `https://images.unsplash.com/${image}?auto=format&fit=crop&w=700&q=80`;
}

export default function DoctorCard({ doctor }) {
  return (
    <article className="doctor-card">
      <Link to={`/doctors/${doctor._id}`} className="doctor-photo"><img src={doctorPhoto(doctor)} alt={doctor.userId?.name || 'Doctor'} /><span className="availability-pill"><i /> Accepting patients</span></Link>
      <div className="doctor-card-body">
        <span className="specialty-label">{doctor.specialization}</span>
        <h3>{doctor.userId?.name || 'MediBook doctor'}</h3>
        <p className="doctor-qualification">{doctor.qualification}</p>
        <div className="doctor-meta"><span><FaBriefcaseMedical /> {doctor.experience} years exp.</span><span><FaStar /> 4.9</span></div>
        <div className="doctor-card-bottom"><strong>${doctor.consultationFee}<small> / visit</small></strong><Link to={`/doctors/${doctor._id}`} className="text-link">View profile <FaArrowRight /></Link></div>
      </div>
    </article>
  );
}
