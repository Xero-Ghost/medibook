import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import mongoose from 'mongoose';
import app from '../../api/index.js';
import User from '../models/User.js';
import { clinicNow } from '../../shared/clinicTime.js';

test('clinic midnight follows IST', () => {
  assert.deepEqual(clinicNow(new Date('2026-11-05T18:30:00Z')), { date: '2026-11-06', time: '00:00' });
});

test('API protects roles and atomically books and releases slots', async (t) => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= `${process.cwd()}/node_modules/.cache/mongodb-binaries`;
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('medibook_test');
  process.env.JWT_SECRET = 'temporary-test-secret-not-used-outside-this-process';
  const server = app.listen(0, '127.0.0.1');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  });
  await once(server, 'listening');
  const baseURL = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(baseURL + path, {
      method,
      headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: body && JSON.stringify(body)
    });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/not-a-route')).status, 404);
  assert.equal((await request('/doctors?specialization[$ne]=x')).status, 400);
  const password = 'test-password-123!';
  const patient = { name: 'Test Patient', email: ' PATIENT@example.test ', password, role: 'admin' };
  const registered = await request('/auth/register', 'POST', patient);
  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.role, 'patient');
  assert.equal(registered.data.user.password, undefined);
  assert.equal((await request('/auth/register', 'POST', patient)).status, 409);
  const patientToken = registered.data.token;
  assert.equal((await request('/users')).status, 401);
  assert.equal((await request('/users', 'GET', undefined, patientToken)).status, 403);

  await User.create({ name: 'Test Admin', email: 'admin@example.test', password, role: 'admin' });
  const login = async (email) => {
    const result = await request('/auth/login', 'POST', { email, password });
    assert.equal(result.status, 200);
    return result.data.token;
  };
  const adminToken = await login('admin@example.test');
  const doctorEmail = 'doctor@example.test';
  const created = await request('/doctors', 'POST', {
    name: 'Test Doctor', email: doctorEmail, password, specialization: 'Cardiology', qualification: 'MD', consultationFee: 100
  }, adminToken);
  assert.equal(created.status, 201);
  const doctorId = created.data.doctor._id;
  const doctorToken = await login(doctorEmail);
  assert.equal((await request('/doctors/me/profile', 'PUT', { availability: null }, doctorToken)).status, 400);
  assert.equal((await request(`/doctors/${doctorId}/slots?date=2026-02-30`)).status, 400);

  const date = new Date(`${clinicNow().date}T00:00:00Z`);
  do { date.setUTCDate(date.getUTCDate() + 1); } while ([0, 6].includes(date.getUTCDay()));
  const appointmentDate = date.toISOString().slice(0, 10);
  const slotsURL = `/doctors/${doctorId}/slots?date=${appointmentDate}`;
  const { data: { slots } } = await request(slotsURL);
  const book = () => request('/appointments', 'POST', { doctorId, appointmentDate, timeSlot: slots[0] }, patientToken);
  const bookings = await Promise.all([book(), book()]);
  assert.deepEqual(bookings.map(({ status }) => status).sort(), [201, 409]);
  const first = bookings.find(({ status }) => status === 201).data.appointment;
  const changeStatus = (id, token, status) => request(`/appointments/${id}/status`, 'PUT', { status }, token);
  assert.equal((await changeStatus(first._id, patientToken, 'confirmed')).status, 403);
  assert.equal((await changeStatus(first._id, doctorToken, 'completed')).status, 409);
  const updates = await Promise.all([changeStatus(first._id, patientToken, 'cancelled'), changeStatus(first._id, patientToken, 'cancelled')]);
  assert.deepEqual(updates.map(({ status }) => status).sort(), [200, 409]);
  assert.ok((await request(slotsURL)).data.slots.includes(slots[0]));
  const second = await book();
  assert.equal(second.status, 201);
  assert.equal((await request(`/appointments/${first._id}`, 'DELETE', undefined, patientToken)).status, 200);
  assert.equal((await book()).status, 409);
  assert.equal((await request(`/doctors/${doctorId}`, 'DELETE', undefined, adminToken)).status, 409);
  assert.equal((await changeStatus(second.data.appointment._id, patientToken, 'cancelled')).status, 200);
  assert.equal((await request(`/doctors/${doctorId}`, 'DELETE', undefined, adminToken)).status, 200);
  assert.equal((await request(`/doctors/${doctorId}`)).status, 404);
  assert.equal((await request('/auth/me', 'GET', undefined, doctorToken)).status, 401);
  const history = await request('/appointments/my', 'GET', undefined, patientToken);
  assert.equal(history.data.appointments[0].doctorId.userId.name, 'Test Doctor');
});
