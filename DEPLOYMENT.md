# Deploy MediBook on Vercel with MongoDB Atlas

Deploy one Vercel project from the repository root. Vite builds the React site to `frontend/dist`; Vercel serves `/api/*` through `api/index.js`, which exports the Express app. The site calls `/api` on its own domain. The catch-all in `vercel.json` serves React pages such as `/dashboard` on direct visits and refreshes.

## 1. Create the Atlas cluster and database user

1. Sign in to [MongoDB Atlas](https://cloud.mongodb.com/) and create a project, e.g. `MediBook`. Open **Database / Clusters** and click **Create** or **Build a Database**. Choose a **Free** cluster for a college demo if offered, name it `medibook-cluster`, and choose a region near your Vercel function region when possible. Wait for the cluster to become available. [Atlas cluster guide](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/)
2. In **Database & Network Access → Database Users**, add a password-authenticated database user, e.g. `medibook_app`, with a generated password. Assign the built-in `readWrite` role for the `medibook` database. If the UI shows **Specific Privileges**, choose `readWrite`, enter `medibook` as the database and leave the collection unspecified. This database user is separate from your Atlas login and from your MediBook admin. [Atlas database users](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)
3. In **Database & Network Access → IP Access List**, choose **Add IP Address → Add Current IP Address** to allow local testing and one-time admin creation. For Vercel, add the function's **outbound** static IPs if configured. Vercel's default outbound IPs are dynamic. For a demo database with synthetic data only, you can use `0.0.0.0/0` (Allow Access from Anywhere), which lets any IPv4 address attempt authentication. For real data, restrict Atlas to configured static outbound IPs or an appropriate private network. [Atlas access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/) · [Vercel outbound IPs](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address)
4. In your cluster, open **Connect → Drivers → Node.js**, copy the SRV URI and replace the credentials. Put `/medibook` before the `?` and keep the Atlas-generated query options. For a standard Atlas SCRAM user, `authSource=admin` explicitly preserves authentication against `admin` while storing app records in `medibook`. URL-encode special characters in the username/password only (`@` → `%40`, `#` → `%23`, `%` → `%25`). [Atlas connection guide](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/)

```text
mongodb+srv://medibook_app:<ENCODED_PASSWORD>@<YOUR_CLUSTER_HOST>/medibook?retryWrites=true&w=majority&authSource=admin
```

You can use the same URI in `backend/.env` to test locally, or a separate dev database. MongoDB creates the app collections when initialized or written to. Existing local data does not move to Atlas automatically; import a backup first if you want to keep it.

## 2. Import the repository and set Vercel environment variables

1. Push the project files to GitHub, including root `package.json`, `package-lock.json`, `api/` and `vercel.json`. Keep `backend/.env` out of Git.
2. In Vercel, choose **Add New → Project**, import the repository, keep **Root Directory** at the repository root (`.`), and use the **Other** framework preset if prompted. The [project configuration](https://vercel.com/docs/project-configuration/vercel-json) sets install to `npm ci`, build to `npm run build` and output to `frontend/dist`. Node **24.x** is pinned in `package.json`.
3. In **Environment Variables**, add the two required values below for **Production**. If you use preview deployments, set both for **Preview** too; use a separate preview database/user and JWT secret. Save and deploy. After editing any env value, redeploy for it to take effect. [Vercel environment variables](https://vercel.com/docs/environment-variables)

| Variable | Value | Where to set it |
| --- | --- | --- |
| `MONGODB_URI` | Complete Atlas SRV URI targeting `/medibook` | Required in Vercel and `backend/.env` for local Atlas use |
| `JWT_SECRET` | Random secret of at least 32 characters; generate it below | Required in Vercel and `backend/.env`; keep private |
| `VITE_API_URL` | Defaults to `/api` | Leave unset on Vercel. Set only if using a separate API host, e.g. `https://api.example.com/api` |
| `CLIENT_URL` | Comma-separated exact origins, no trailing slash | Leave unset on Vercel for same-domain routing; set to frontend origins only if API and frontend are on different domains |
| `PORT` | `5000` by default | Local Node server only; leave unset on Vercel |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | App admin login credentials; name is optional | Temporary local shell variables for `npm run create-admin` only |

Generate a JWT secret and paste just the output as the value. Never prefix database or JWT secrets with `VITE_`; those variables are exposed to the browser build.

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

## 3. Create the first app admin

From the repository root, run `npm ci` if you haven't already. In `backend/.env`, temporarily set `MONGODB_URI` to the exact Atlas database used by the Vercel deployment. Make sure your current public IP is in the Atlas access list. Run the following in PowerShell; enter a unique admin email and a strong password when prompted:

```powershell
$env:ADMIN_EMAIL = Read-Host 'MediBook admin email'
$adminSecret = Read-Host 'MediBook admin password' -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new('', $adminSecret).Password
try { npm run create-admin } finally {
  Remove-Item Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD -ErrorAction SilentlyContinue
  Remove-Variable adminSecret
}
```

Sign in on the deployed site at `/login`, then use **Dashboard → Add a doctor**. Public registration creates patient accounts. The admin command refuses to overwrite an existing account. Use `npm run seed` only on an isolated demo database; it installs publicly documented demo passwords. If you temporarily changed `backend/.env`, restore your local development URI afterward.

## 4. Check the deployment

- `https://<project>.vercel.app/api/health` should return JSON with `status: "ok"`; this checks that the API initialized its MongoDB connection and indexes.
- `https://<project>.vercel.app/api/doctors` should return `{"doctors":[]}` before you add your first doctor.
- Open `/doctors` directly and refresh. Register a test patient, book a slot, accept it with the doctor account, and verify the status in the patient dashboard.
- If `/api/health` returns HTML or 404, check that the root is `.` and the deployment includes `api/index.js` and `vercel.json`. A database timeout usually means Atlas access list, cluster availability or DNS. An authentication error usually means DB username/password, URL encoding, or `authSource`. A message about server authentication means `JWT_SECRET` is missing, too short or still the example value. Check **Vercel → Logs** after calling the endpoint.
- When upgrading a pre-existing database, resolve any duplicate `pending` or `confirmed` appointments for the same doctor/date/time before deploying. MongoDB will refuse to create the new unique index if such rows exist. Old `slotreservations` documents are no longer used; existing appointments remain the source of truth.
