import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaSearch, FaSlidersH } from 'react-icons/fa';
import api, { getErrorMessage } from '../services/api.js';
import DoctorCard from '../components/DoctorCard.jsx';
import Loading from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { toast } from 'react-toastify';

export default function Doctors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [specialization, setSpecialization] = useState(searchParams.get('specialization') || '');
  const [sort, setSort] = useState('');

  useEffect(() => {
    api.get('/doctors')
      .then(({ data }) => setSpecializations([...new Set(data.doctors.map((doctor) => doctor.specialization))].sort()))
      .catch((error) => toast.error(getErrorMessage(error)));
  }, []);

  useEffect(() => {
    const params = {};
    const controller = new AbortController();
    if (search.trim()) params.search = search.trim();
    if (specialization) params.specialization = specialization;
    if (sort) params.sort = sort;
    setLoading(true);
    api.get('/doctors', { params, signal: controller.signal })
      .then(({ data }) => setDoctors(data.doctors))
      .catch((error) => { if (!controller.signal.aborted) toast.error(getErrorMessage(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, specialization, sort]);

  const reset = () => {
    setSearch('');
    setSpecialization('');
    setSort('');
    setSearchParams({});
  };

  return (
    <div className="page-section">
      <div className="page-banner"><div className="container"><span className="eyebrow">YOUR CARE TEAM IS HERE</span><h1>Find your doctor</h1><p>Thoughtful care from people who put you first.</p></div></div>
      <section className="container doctors-content">
        <div className="filter-bar">
          <label className="filter-search"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by doctor or specialty" /></label>
          <label className="filter-select"><FaSlidersH /><select value={specialization} onChange={(event) => setSpecialization(event.target.value)}><option value="">All specialties</option>{specializations.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="filter-select"><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="">Sort by</option><option value="fee-asc">Fee: low to high</option><option value="fee-desc">Fee: high to low</option></select></label>
        </div>
        <div className="results-heading"><div><h2>Meet our specialists</h2><p>{doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'} ready to help</p></div>{(search || specialization || sort) && <button className="text-link clear-filter" onClick={reset}>Clear filters</button>}</div>
        {loading ? <Loading label="Finding the right doctors..." /> : doctors.length ? <div className="doctor-grid">{doctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor._id} />)}</div> : <EmptyState title="No doctors found" message="Try a different name or specialty, or clear your filters." />}
      </section>
    </div>
  );
}
