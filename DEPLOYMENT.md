<<<<<<< HEAD
# Portfolio deployment

## Local development

1. Copy `backend\.env.example` to `backend\.env` and set MongoDB Atlas, a random JWT secret (at least 32 characters), the admin account, and Cloudinary credentials. Do not commit `.env` files.
2. Copy `frontend\.env.example` to `frontend\.env.local`. Set `VITE_API_URL` to the backend API origin plus `/api`.
3. Install dependencies and start both applications from PowerShell:

   ```powershell
   cd E:\Portfolio\backend
   npm install
   npm run create-admin
   npm run dev
   ```

   In a second terminal:

   ```powershell
   cd E:\Portfolio\frontend
   npm install
   npm run dev
   ```

4. Open the Vite URL and sign in at `/admin/login`. The admin script only creates the first account; set a password of at least 12 characters.

## Production

### MongoDB Atlas

- Create a database and restrict Atlas network access to the backend host's outbound IPs where possible.
- Add the production connection string to the backend's `MONGO_URI`.
- Create a database user with only the permissions needed by this application.

### Cloudinary

- Configure the cloud name, API key, and API secret as backend environment variables.
- Keep all three values private to the backend. Do not add them to Vite variables.
- Uploaded portfolio images and resumes are stored under the `tayyaba-portfolio` folder.

### Backend (Render or Railway)

- Use `backend` as the service root directory.
- Build command: `npm install`
- Start command: `npm start`
- Configure `NODE_ENV=production`, `PORT` (if required by the host), `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the exact deployed frontend origin), and Cloudinary values.
- Generate a new random `JWT_SECRET` with at least 32 characters. Production auth cookies require HTTPS.
- Configure the host's health check to `GET /api/health`.

### Frontend (Vercel)

- Use `frontend` as the project root directory.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed backend API URL, for example `https://api.example.com/api`.
- Configure Vercel to rewrite unknown routes to `/index.html` so `/admin/login` and other client routes work on refresh.

### First production admin

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the backend service environment, then run `npm run create-admin` once from a secure environment connected to the production database. Remove or rotate the bootstrap password after creating the account.

## Operational notes

- The contact form stores submissions in MongoDB and sends an admin notification through Gmail SMTP. The recipient comes from Admin > Contact Information > Notification recipient email, falling back to CONTACT_NOTIFICATION_EMAIL if it is blank. Configure SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_FROM, CONTACT_NOTIFICATION_EMAIL, and a Gmail App Password in the backend environment. Keep SMTP_PASS out of source control. Messages remain in Admin > Contact Messages if email delivery is unavailable.
- Appearance and section settings are persisted in the MongoDB portfolio record. Use **Admin → Appearance** for the live theme preview, and **Admin → Website Settings** for section visibility/order, heading copy, per-section backgrounds, and navigation options.
- Navigation items and appearance are saved to the same portfolio record under `data.settings.navbar`; manage them in **Admin → Navigation**. Enabled links are served from `GET /api/navigation`, while all create/update/delete/reset endpoints require admin authentication.
- Website animation presets are saved under `data.settings.animations`; manage supported targets, effects, timing, and triggers in **Admin → Website Animations**. `GET /api/animations` returns enabled configurations only. Framer Motion applies supported settings on the public site and disables motion for visitors with reduced-motion enabled.
- Dark and light palettes are configured independently in **Admin → Appearance**. The visitor's manual dark/light selection is kept in localStorage and restored after refresh; when there is no valid visitor preference, the configured default theme is used. A small appearance cache in localStorage initializes the page theme before the app renders, then refreshes from the public API.
- Public project APIs return only `published` projects. Drafts are available only through authenticated admin routes.
- Back up MongoDB and Cloudinary assets independently. Uploaded assets are not removed automatically when a content entry is deleted.
- Keep frontend and backend origins aligned: credentialed CORS accepts only the configured `CLIENT_URL`.
=======
# Portfolio deployment

## Local development

1. Copy `backend\.env.example` to `backend\.env` and set MongoDB Atlas, a random JWT secret (at least 32 characters), the admin account, and Cloudinary credentials. Do not commit `.env` files.
2. Copy `frontend\.env.example` to `frontend\.env.local`. Set `VITE_API_URL` to the backend API origin plus `/api`.
3. Install dependencies and start both applications from PowerShell:

   ```powershell
   cd E:\Portfolio\backend
   npm install
   npm run create-admin
   npm run dev
   ```

   In a second terminal:

   ```powershell
   cd E:\Portfolio\frontend
   npm install
   npm run dev
   ```

4. Open the Vite URL and sign in at `/admin/login`. The admin script only creates the first account; set a password of at least 12 characters.

## Production

### MongoDB Atlas

- Create a database and restrict Atlas network access to the backend host's outbound IPs where possible.
- Add the production connection string to the backend's `MONGO_URI`.
- Create a database user with only the permissions needed by this application.

### Cloudinary

- Configure the cloud name, API key, and API secret as backend environment variables.
- Keep all three values private to the backend. Do not add them to Vite variables.
- Uploaded portfolio images and resumes are stored under the `tayyaba-portfolio` folder.

### Backend (Render or Railway)

- Use `backend` as the service root directory.
- Build command: `npm install`
- Start command: `npm start`
- Configure `NODE_ENV=production`, `PORT` (if required by the host), `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (the exact deployed frontend origin), and Cloudinary values.
- Generate a new random `JWT_SECRET` with at least 32 characters. Production auth cookies require HTTPS.
- Configure the host's health check to `GET /api/health`.

### Frontend (Vercel)

- Use `frontend` as the project root directory.
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed backend API URL, for example `https://api.example.com/api`.
- Configure Vercel to rewrite unknown routes to `/index.html` so `/admin/login` and other client routes work on refresh.

### First production admin

Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in the backend service environment, then run `npm run create-admin` once from a secure environment connected to the production database. Remove or rotate the bootstrap password after creating the account.

## Operational notes

- The contact form stores submissions in MongoDB and sends an admin notification through Gmail SMTP. The recipient comes from Admin > Contact Information > Notification recipient email, falling back to CONTACT_NOTIFICATION_EMAIL if it is blank. Configure SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_FROM, and a Gmail App Password in the backend environment. Keep SMTP_PASS out of source control. Messages remain in Admin > Contact Messages if email delivery is unavailable.
- Appearance and section settings are persisted in the MongoDB portfolio record. Use **Admin → Appearance** for the live theme preview, and **Admin → Website Settings** for section visibility/order, heading copy, per-section backgrounds, and navigation options.
- Navigation items and appearance are saved to the same portfolio record under `data.settings.navbar`; manage them in **Admin → Navigation**. Enabled links are served from `GET /api/navigation`, while all create/update/delete/reset endpoints require admin authentication.
- Website animation presets are saved under `data.settings.animations`; manage supported targets, effects, timing, and triggers in **Admin → Website Animations**. `GET /api/animations` returns enabled configurations only. Framer Motion applies supported settings on the public site and disables motion for visitors with reduced-motion enabled.
- Dark and light palettes are configured independently in **Admin → Appearance**. The visitor's manual dark/light selection is kept in localStorage and restored after refresh; when there is no valid visitor preference, the configured default theme is used. A small appearance cache in localStorage initializes the page theme before the app renders, then refreshes from the public API.
- Public project APIs return only `published` projects. Drafts are available only through authenticated admin routes.
- Back up MongoDB and Cloudinary assets independently. Uploaded assets are not removed automatically when a content entry is deleted.
- Keep frontend and backend origins aligned: credentialed CORS accepts only the configured `CLIENT_URL`.
>>>>>>> 401c49b48f273caad6a103d8123add5ddc729486
