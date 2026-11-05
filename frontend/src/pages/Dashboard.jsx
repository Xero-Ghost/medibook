import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaCalendarCheck, FaCheck, FaClock, FaEdit, FaPlus, FaStethoscope, FaUsers, FaUserMd } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getErrorMessage } from '../services/api.js';
import Loading from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { doctorPhoto } from '../components/DoctorCard.jsx';
import { clinicNow } from '../../../shared/clinicTime.js';

const dateLabel = (value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const getDoctorName = (appointment) => appointment.doctorId?.userId?.name || 'Doctor';
const getPatientName = (appointment) => appointment.patientId?.name || 'Patient';
const statusClass = (status) => `status status-${status}`;

function AppointmentItem({ appointment, actions, showPatient = false }) {
  const patient = appointment.patientId;
  const doctor = showPatient ? null : appointment.doctorId;
  return (
    <article className="appointment-item">
      <div className="appointment-date"><strong>{new Date(appointment.appointmentDate).getUTCDate()}</strong><span>{new Date(appointment.appointmentDate).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}</span></div>
      <div className="appointment-info"><h3>{doctor ? getDoctorName(appointment) : getPatientName(appointment)}</h3><p>{doctor ? appointment.doctorId?.specialization : patient?.email || 'Patient appointment'}</p><div className="appointment-time"><FaClock /> {dateLabel(appointment.appointmentDate)} · {appointment.timeSlot}</div>{appointment.reason && <small className="appointment-reason">Note: {appointment.reason}</small>}</div>
      <div className="appointment-actions"><span className={statusClass(appointment.status)}>{appointment.status}</span>{actions}</div>
    </article>
  );
}

function PatientDashboard({ user, setUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/appointments/my');
      setAppointments(data.appointments);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const cancel = async (appointment) => {
    if (!window.confirm(`Cancel your appointment with ${getDoctorName(appointment)}?`)) return;
    try {
      await api.put(`/appointments/${appointment._id}/status`, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', profile);
      setUser(data.user);
      setEditing(false);
      toast.success('Profile updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const now = clinicNow();
  const isUpcoming = (item) => ['pending', 'confirmed'].includes(item.status) &&
    `${item.appointmentDate.slice(0, 10)}T${item.timeSlot}` >= `${now.date}T${now.time}`;
  const upcoming = appointments.filter(isUpcoming);
  const previous = appointments.filter((item) => !isUpcoming(item));

  return (
    <div className="dashboard-body">
      <section className="dashboard-welcome"><div><span className="eyebrow">YOUR HEALTH, YOUR SPACE</span><h1>Welcome back, {user.name.split(' ')[0]}.</h1><p>Here’s what’s happening with your care.</p></div><Link className="button button-primary" to="/doctors">Find a doctor <FaArrowRight /></Link></section>
      <div className="dashboard-columns">
        <div className="dashboard-main">
          <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">UP NEXT</span><h2>Upcoming appointments</h2></div><span className="count-badge">{upcoming.length}</span></div>
            {loading ? <Loading /> : upcoming.length ? <div className="appointment-list">{upcoming.map((item) => <AppointmentItem key={item._id} appointment={item} actions={item.status !== 'completed' && <button className="small-action danger-action" onClick={() => cancel(item)}>Cancel</button>} />)}</div> : <EmptyState title="Nothing on your calendar" message="When you book a visit, you’ll find it here." />}
          </section>
          <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR CARE HISTORY</span><h2>Previous appointments</h2></div></div>
            {!loading && previous.length ? <div className="appointment-list">{previous.map((item) => <AppointmentItem key={item._id} appointment={item} />)}</div> : !loading && <EmptyState title="Your care story starts here" message="Past visits will show up here once you’ve had your first appointment." />}
          </section>
        </div>
        <aside className="dashboard-side">
          <section className="dashboard-panel profile-summary"><div className="panel-heading"><div><span className="eyebrow">YOUR PROFILE</span><h2>Personal details</h2></div><button className="icon-action" onClick={() => setEditing(!editing)} aria-label="Edit profile"><FaEdit /></button></div>
            {editing ? <form className="form-stack compact-form" onSubmit={saveProfile}><label className="form-label">Name<input className="form-input" required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label><label className="form-label">Phone<input className="form-input" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label><button className="button button-primary button-full" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></form> : <div className="profile-details"><div className="profile-avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><strong>{user.name}</strong><span>{user.email}</span><span>{user.phone || 'Add a phone number'}</span></div>}
          </section>
          <section className="dashboard-tip"><span>✦</span><h3>Your health, at your pace.</h3><p>Keep your contact details current so your care team can reach you when it matters.</p></section>
        </aside>
      </div>
    </div>
  );
}

function DoctorDashboard({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsResponse, doctorsResponse] = await Promise.all([api.get('/appointments/doctor'), api.get('/doctors')]);
      setAppointments(appointmentsResponse.data.appointments);
      const mine = doctorsResponse.data.doctors.find((item) => String(item.userId?._id) === String(user._id));
      setDoctor(mine);
      if (mine) setAvailability({ ...mine.availability, days: mine.availability.days || [] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user._id]);
  useEffect(() => { refresh(); }, [refresh]);

  const updateStatus = async (appointment, status) => {
    try {
      await api.put(`/appointments/${appointment._id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/doctors/me/profile', { availability, about: doctor.about });
      setDoctor(data.doctor);
      toast.success('Your availability has been updated.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => setAvailability((current) => ({ ...current, days: current.days.includes(day) ? current.days.filter((item) => item !== day) : [...current.days, day].sort() }));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="dashboard-body">
      <section className="dashboard-welcome"><div><span className="eyebrow">PROVIDER WORKSPACE</span><h1>Good day, {user.name.split(' ')[1] || user.name}.</h1><p>Manage your schedule and patient appointment requests.</p></div><div className="dashboard-avatar"><FaUserMd /></div></section>
      <div className="dashboard-columns">
        <div className="dashboard-main"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR SCHEDULE</span><h2>Patient appointments</h2></div></div>
          {loading ? <Loading /> : appointments.length ? <div className="appointment-list">{appointments.map((item) => <AppointmentItem showPatient key={item._id} appointment={item} actions={item.status === 'pending' ? <><button className="small-action accept-action" onClick={() => updateStatus(item, 'confirmed')}><FaCheck /> Accept</button><button className="small-action danger-action" onClick={() => updateStatus(item, 'cancelled')}>Decline</button></> : item.status === 'confirmed' ? <button className="small-action accept-action" onClick={() => updateStatus(item, 'completed')}>Complete</button> : null} />)}</div> : <EmptyState title="No appointments yet" message="New patient requests will appear in this list." />}
        </section></div>
        <aside className="dashboard-side"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR PRACTICE</span><h2>Availability</h2></div></div>
          {availability ? <form className="form-stack compact-form" onSubmit={saveAvailability}><label className="form-label">Available days</label><div className="weekday-picker">{weekdays.map((day, index) => <button key={day} type="button" className={availability.days.includes(index) ? 'weekday-selected' : ''} onClick={() => toggleDay(index)}>{day}</button>)}</div><div className="time-inputs"><label className="form-label">Start<input required type="time" className="form-input" value={availability.startTime} onChange={(event) => setAvailability({ ...availability, startTime: event.target.value })} /></label><label className="form-label">End<input required type="time" className="form-input" value={availability.endTime} onChange={(event) => setAvailability({ ...availability, endTime: event.target.value })} /></label></div><label className="form-label">Visit length<select className="form-input" value={availability.slotDuration} onChange={(event) => setAvailability({ ...availability, slotDuration: Number(event.target.value) })}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label><button className="button button-primary button-full" disabled={saving}>{saving ? 'Saving...' : 'Save availability'}</button></form> : <Loading label="Loading your practice..." />}
        </section></aside>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', experience: 0, consultationFee: '' });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [doctorResponse, patientResponse, appointmentResponse, messageResponse] = await Promise.all([api.get('/doctors'), api.get('/users'), api.get('/appointments'), api.get('/contact')]);
      setDoctors(doctorResponse.data.doctors);
      setPatients(patientResponse.data.users);
      setAppointments(appointmentResponse.data.appointments);
      setMessages(messageResponse.data.messages);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const createDoctor = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/doctors', form);
      toast.success('Doctor account added.');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', phone: '', specialization: '', qualification: '', experience: 0, consultationFee: '' });
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const removeDoctor = async (doctor) => {
    if (!window.confirm(`Remove ${doctor.userId?.name} from MediBook?`)) return;
    try {
      await api.delete(`/doctors/${doctor._id}`);
      toast.success('Doctor removed.');
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateStatus = async (appointment, status) => {
    try {
      await api.put(`/appointments/${appointment._id}/status`, { status });
      toast.success(`Appointment ${status}.`);
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (loading) return <div className="dashboard-body"><Loading label="Loading admin workspace..." /></div>;
  const pending = appointments.filter((item) => item.status === 'pending').length;
  const stats = [{ label: 'Registered patients', value: patients.length, icon: <FaUsers /> }, { label: 'Doctors', value: doctors.length, icon: <FaUserMd /> }, { label: 'Appointments', value: appointments.length, icon: <FaCalendarCheck /> }, { label: 'Awaiting review', value: pending, icon: <FaClock /> }];

  return (
    <div className="dashboard-body">
      <section className="dashboard-welcome"><div><span className="eyebrow">MEDIBOOK ADMINISTRATION</span><h1>Good morning, Admin.</h1><p>A clear view of your care community.</p></div><button className="button button-primary" onClick={() => setShowForm(!showForm)}><FaPlus /> Add a doctor</button></section>
      <div className="stats-grid">{stats.map((item) => <article className="stat-card" key={item.label}><span>{item.icon}</span><div><strong>{item.value}</strong><small>{item.label}</small></div></article>)}</div>
      {showForm && <form className="dashboard-panel doctor-create-form" onSubmit={createDoctor}><div className="panel-heading"><div><span className="eyebrow">TEAM MANAGEMENT</span><h2>Add a doctor account</h2></div></div><div className="form-grid"><label className="form-label">Doctor name<input required className="form-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label className="form-label">Email<input required type="email" className="form-input" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="form-label">Temporary password<input required minLength="8" type="password" className="form-input" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label><label className="form-label">Phone<input className="form-input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label className="form-label">Specialty<input required className="form-input" value={form.specialization} onChange={(event) => setForm({ ...form, specialization: event.target.value })} /></label><label className="form-label">Qualification<input required className="form-input" value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} /></label><label className="form-label">Years of experience<input min="0" type="number" className="form-input" value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })} /></label><label className="form-label">Consultation fee ($)<input required min="0" type="number" className="form-input" value={form.consultationFee} onChange={(event) => setForm({ ...form, consultationFee: event.target.value })} /></label></div><button className="button button-primary" disabled={saving}>{saving ? 'Adding doctor...' : 'Create doctor account'}</button></form>}
      <div className="admin-grid">
        <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">CARE TEAM</span><h2>Manage doctors</h2></div></div>{doctors.length ? <div className="admin-list">{doctors.map((doctor) => <div className="admin-person" key={doctor._id}><img src={doctorPhoto(doctor)} alt="" /><div><strong>{doctor.userId?.name}</strong><span>{doctor.specialization} · ${doctor.consultationFee}</span></div><button className="small-action danger-action" onClick={() => removeDoctor(doctor)}>Remove</button></div>)}</div> : <EmptyState title="No doctors yet" message="Add your first doctor to the team." />}</section>
        <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">PATIENT COMMUNITY</span><h2>Recent patients</h2></div></div>{patients.length ? <div className="admin-list">{patients.slice(0, 8).map((patient) => <div className="admin-person" key={patient._id}><span className="patient-initials">{patient.name.slice(0, 1)}</span><div><strong>{patient.name}</strong><span>{patient.email}</span></div></div>)}</div> : <EmptyState title="No patients yet" message="New patient accounts will appear here." />}</section>
      </div>
      <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">ALL VISITS</span><h2>Appointment management</h2></div></div>{appointments.length ? <div className="appointment-list">{appointments.map((item) => <article className="appointment-item admin-appointment" key={item._id}><div className="appointment-date"><strong>{new Date(item.appointmentDate).getUTCDate()}</strong><span>{new Date(item.appointmentDate).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}</span></div><div className="appointment-info"><h3>{getPatientName(item)} <span className="admin-with">with</span> {getDoctorName(item)}</h3><p>{item.doctorId?.specialization} · {item.patientId?.email}</p><div className="appointment-time"><FaClock /> {dateLabel(item.appointmentDate)} · {item.timeSlot}</div></div><div className="appointment-actions"><span className={statusClass(item.status)}>{item.status}</span>{item.status === 'pending' && <button className="small-action accept-action" onClick={() => updateStatus(item, 'confirmed')}>Confirm</button>}{item.status === 'confirmed' && <button className="small-action accept-action" onClick={() => updateStatus(item, 'completed')}>Complete</button>}{['pending', 'confirmed'].includes(item.status) && <button className="small-action danger-action" onClick={() => updateStatus(item, 'cancelled')}>Cancel</button>}</div></article>)}</div> : <EmptyState title="No appointments yet" message="Appointments will appear here once patients book." />}</section>
      <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">SUPPORT INBOX</span><h2>Recent contact messages</h2></div><span className="count-badge">{messages.length}</span></div>{messages.length ? <div className="admin-list">{messages.map((message) => <article className="contact-message" key={message._id}><div className="contact-message-heading"><strong>{message.name}</strong><span>{new Date(message.createdAt).toLocaleDateString()}</span></div><a href={`mailto:${message.email}`}>{message.email}</a><span className="specialty-label">{message.topic}</span><p>{message.message}</p></article>)}</div> : <EmptyState title="Your inbox is clear" message="New messages submitted from Contact will appear here." />}</section>
    </div>
  );
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const content = useMemo(() => {
    if (user.role === 'admin') return <AdminDashboard />;
    if (user.role === 'doctor') return <DoctorDashboard user={user} />;
    return <PatientDashboard user={user} setUser={setUser} />;
  }, [user, setUser]);
  return <section className="dashboard-page"><div className="container">{content}</div></section>;
}
