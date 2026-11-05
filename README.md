# MediBook

A college project demonstrating a doctor appointment booking system built with React, Vite, Tailwind CSS, Express, MongoDB, and Mongoose.

## Features

- Patient registration and JWT login; passwords are hashed with bcrypt.
- Separate patient, doctor, and admin workspaces with role-protected API routes.
- Doctor directory with name/specialty search, specialty filtering, and fee sorting.
- Doctor profiles with qualification, experience, visit fee, and available time slots.
- Appointment requests, doctor acceptance/decline/completion, and patient cancellation.
- A MongoDB unique index prevents two active bookings for the same doctor, date and time.
- Doctor availability management, admin doctor creation/removal, patient list, and appointment oversight.
- Responsive layouts, form validation, loading/empty states, and toast notifications.

## Requirements

- Node.js 24.x with npm
- MongoDB 7+ running locally, or a MongoDB Atlas connection URI

## Setup (Windows PowerShell)

Run these commands from the repository root:

```powershell
npm ci
Copy-Item backend/.env.example backend/.env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Paste the generated secret into `backend/.env` as `JWT_SECRET`. Set `MONGODB_URI` to your local or Atlas database. For a disposable local demo database, run `npm run seed` if you want sample accounts and doctors. Then start the API and frontend in two terminals at the root:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

Open `http://localhost:5173`. Vite forwards `/api` to port 5000; `http://localhost:5173/api/health` checks the frontend proxy and API together. If you change the local API port, update the proxy target in `frontend/vite.config.js` too. `npm run build` generates `frontend/dist`. `npm test` uses a disposable MongoDB instance; the first run downloads a MongoDB binary.

For hosting, follow the [Vercel and MongoDB Atlas guide](DEPLOYMENT.md).

## Demo accounts

Run `npm run seed` from the repository root against a disposable demo database before signing in. The seeder creates these demonstration accounts:

| Role | Email | Password |
|---|---|---|
| Patient | `patient@medibook.demo` | `Patient123!` |
| Doctor | `doctor@medibook.demo` | `Doctor123!` |
| Admin | `admin@medibook.demo` | `Admin123!` |

Additional seeded doctors use `noah@medibook.demo`, `sophia@medibook.demo`, `ethan@medibook.demo`, `grace@medibook.demo`, and `lucas@medibook.demo`, all with password `Doctor123!`. These are demo-only credentials; change or remove them before deploying anywhere public. The frontend does not contain login credentials.

## API overview

All routes are prefixed with `/api`.

| Method | Route | Access |
|---|---|---|
| `POST` | `/auth/register` | Public; always creates a patient |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | Signed in |
| `GET` | `/doctors` | Public; accepts `search`, `specialization`, `sort=fee-asc\|fee-desc` |
| `GET` | `/doctors/:id` | Public |
| `GET` | `/doctors/:id/slots?date=YYYY-MM-DD` | Public |
| `POST` | `/doctors` | Admin |
| `PUT` | `/doctors/:id` | Admin or owning doctor |
| `PUT` | `/doctors/me/profile` | Doctor |
| `DELETE` | `/doctors/:id` | Admin |
| `POST` | `/appointments` | Patient |
| `GET` | `/appointments/my` | Patient |
| `GET` | `/appointments/doctor` | Doctor |
| `GET` | `/appointments` | Admin |
| `PUT` | `/appointments/:id/status` | Authorized patient, doctor, or admin |
| `DELETE` | `/appointments/:id` | Owning patient or admin |
| `GET` | `/users/profile` | Signed in |
| `PUT` | `/users/profile` | Signed in |
| `GET` | `/users` | Admin |
| `POST` | `/contact` | Public; stores a validated support message |
| `GET` | `/contact` | Admin |

Protected API calls require `Authorization: Bearer <JWT>`. Appointment statuses are `pending`, `confirmed`, `cancelled`, and `completed`. Contact form messages are stored in MongoDB and can be reviewed from the admin dashboard; no external email service is required.

## Project structure

```text
backend/
  config/       MongoDB connection
  controllers/  API behavior and validation
  middleware/   Authentication, authorization, error handling
  models/       User, doctor, appointment, contact message
  routes/       Express API routes
  seed/         Demo accounts and doctors
frontend/
  src/components/ Reusable UI
  src/context/    Authentication state
  src/pages/      Home, doctors, profiles, auth, dashboards, contact
  src/services/   Axios API client
```

## Notes

- Do not commit `.env` files. `.env.example` contains placeholders only.
- Appointments use the clinic timezone (`Asia/Kolkata`); the date is stored as a UTC calendar label and the time as an IST wall-clock value.
- Doctor photos use Unsplash URLs and require an internet connection; the booking and dashboard functionality does not depend on them.
