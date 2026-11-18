<<<<<<< HEAD
# Portfolio API

All endpoints are relative to `/api`. Admin authentication uses the HTTP-only `adminToken` cookie; browser requests must include credentials. CORS and unsafe-request origin checks use the same exact origins from the comma-separated `CLIENT_URLS` environment variable (the legacy single-origin `CLIENT_URL` remains supported). Development also allows `http://localhost:5173` and `http://localhost:5174`; production uses only explicitly configured origins. Credentialed requests are never allowed from a wildcard origin. The existing CORS middleware handles `OPTIONS` preflights and allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` with `Content-Type` and `Authorization` headers.

## Public

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/portfolio` | Public profile, contact, social, resume, and site settings |
| `GET` | `/portfolio/profile` | Public profile and Hero content only |
| `GET` | `/content` | Visible skills, experience, services, education, certifications, and testimonials |
| `GET` | `/projects` | Published projects, ordered by display order |
| `GET` | `/projects/:id` | A published project by MongoDB ID |
| `GET` | `/navigation` | Enabled navigation tree and active theme palette |
| `GET` | `/animations` | Enabled, supported website animation configurations |
| `POST` | `/contact` | Submit a contact message (five submissions per IP per 15 minutes) |
| `POST` | `/auth/login` | Admin login (ten attempts per IP per 15 minutes) |

## Admin

Authenticate with `POST /auth/login`; retrieve the current account with `GET /auth/me`; clear the cookie with `POST /auth/logout`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/portfolio/admin` | Read editable portfolio sections |
| `PUT` | `/portfolio/:section` | Update `profile`, `about`, `contact`, `socials`, `settings`, or `resume` |
| `PUT` | `/portfolio/appearance` | Validate and persist theme, color, typography, and design preferences |
| `GET` | `/content/:type` | List all entries of a CMS type |
| `POST` | `/content/:type` | Create a CMS entry |
| `PUT` | `/content/:type/:id` | Update a CMS entry |
| `DELETE` | `/content/:type/:id` | Delete a CMS entry |
| `GET` | `/projects/admin/all` | List projects, including drafts |
| `POST` | `/projects` | Create a project |
| `PUT` | `/projects/:id` | Update a project |
| `DELETE` | `/projects/:id` | Delete a project |
| `GET` | `/navigation/admin` | Read all navigation items and appearance settings |
| `POST` | `/navigation/items` | Create a navigation item |
| `PUT` | `/navigation/items/:id` | Update a navigation item |
| `DELETE` | `/navigation/items/:id` | Delete an item (deleting a dropdown also deletes its children) |
| `PUT` | `/navigation/appearance` | Update navigation appearance and responsive behavior |
| `PUT` | `/navigation/reset` | Restore default navigation items and appearance |
| `GET` | `/animations/admin` | Read all animation configurations, including disabled ones |
| `POST` | `/animations` | Create an animation configuration |
| `PUT` | `/animations/:id` | Update an animation configuration |
| `DELETE` | `/animations/:id` | Delete an animation configuration |
| `PUT` | `/animations/reset` | Restore the default animation presets |
| `POST` | `/upload/image` | Upload one JPG, PNG, WEBP, or GIF image (5 MB maximum) |
| `POST` | `/upload/multiple` | Upload up to ten images (5 MB each) |
| `POST` | `/upload/resume` | Upload a PDF resume (10 MB maximum) |
| `DELETE` | `/upload/resume` | Delete a resume only after removing its active portfolio reference |
| `DELETE` | `/upload/image` | Delete an image only when it is not referenced by portfolio content |
| `DELETE` | `/upload/multiple` | Safely attempt deletion of multiple unreferenced images |
| `GET` | `/contact/admin/messages` | Read the latest 100 contact submissions |
| `GET` | `/contact/admin/summary` | Read total/unread message counts and recent submissions |
| `PATCH` | `/contact/admin/messages/:id` | Update a message's `read` status |
| `DELETE` | `/contact/admin/messages/:id` | Delete a contact message |

`type` is one of `skills`, `experience`, `services`, `education`, `certifications`, or `testimonials`. CMS entry creation/update uses a `data` object; `visible` and `displayOrder` are top-level fields. Projects use `status: "draft" | "published"` and store uploaded image URLs and Cloudinary public IDs.

Appearance updates accept `theme`, `typography`, and `design` objects plus `colors.dark` and `colors.light` palette objects. Each palette supports `primary`, `secondary`, `accent`, `background`, `text`, `heading`, `surface`, `card`, `button`, `buttonText`, `border`, `gradientStart`, and `gradientEnd`; legacy flat color keys remain accepted for compatibility. Only supported values and bounded numeric settings are stored. The public portfolio applies the selected palette through CSS custom properties. Section visibility, ordering, headings/descriptions, background styles, and navigation options are stored in the `settings` section. Contact summary/read/delete routes are protected by the same admin authentication middleware as the message inbox.

The Profile / Hero editor continues to use the protected `GET /portfolio/admin` and `PUT /portfolio/profile` endpoints. Profile data, including `heroConfig`, is stored in the existing `Portfolio` document at `data.profile`; no duplicate Hero model or route is used. Partial profile and nested Hero updates use dotted `$set` paths so unrelated saved profile, Hero, and responsive-layout fields are preserved. `heroConfig` supports ordered/enabled title and technology-badge arrays, fixed badge positions (`top`, diagonals, and cardinal directions) with optional offsets, responsive desktop/tablet/mobile content-layout settings, typing timing and reduced-motion behavior, up to ten independently configured orbit rings, profile-image crop and glow, cursor settings, Hero-only layout/gradient settings, content visibility, and supported Hero animation targets. Responsive layout settings may be placed under `contentLayout.{desktop|tablet|mobile}.elements` for `heroContent`, `name`, `designation`, `description`, `buttons`, `socialIcons`, `orbit`, `profileImage`, and `container`. Each element supports applicable width/height, alignment, gap, and independent `margin`/`padding` sides (`top`, `right`, `bottom`, `left`) in whole pixels from 0 to 2000; social icons additionally support icon size, horizontal/vertical gaps, padding, radius, hover spacing, and hover effect. Set individual fields to `null` to reset them to defaults, or set a breakpoint object to `{}` to reset that breakpoint. The badge-position layer is static; only enabled ring rotors animate. Titles and badges are limited to 40 each, labels/IDs, positions, colors, and responsive spacing values are validated, timing/size values have explicit bounds, and unknown nested fields are rejected. Public `GET /portfolio` returns the stored public Hero configuration; secret/admin-only data is not part of this configuration. Profile and Hero image uploads reuse the authenticated Cloudinary endpoints, and resume uploads reuse the existing resume endpoint. Social URLs and About description are saved through their existing protected portfolio sections; custom social items accept an optional `enabled` boolean.

Navigation and animation settings are stored in the existing `Portfolio` document under `data.settings.navbar` and `data.settings.animations`; no separate settings collection is required. Navigation items contain an ID, label, URL, type (`internal`, `external`, `anchor`, `custom`, or `dropdown`), icon, position, enabled state, target, optional dropdown parent, and CTA flag. System links cannot be deleted, dropdown nesting is limited to three levels, and deleting a custom dropdown removes its descendants. Navigation appearance includes independent dark/light colors, logo sizing, positioning, typography, spacing, border/shadow, responsive layouts, and mobile/dropdown behavior.

Animation configurations contain an ID, name, target, effect, duration, delay, speed, easing, iteration count, direction, trigger, scroll threshold, enabled state, and bounded custom values. Supported effects are fade-in/up/down/left/right, slide-in, zoom-in/out, scale, rotate, bounce, float, pulse, and staggered reveal. Supported triggers are page load, scroll, hover, and click. Only one enabled animation may target a given element group. The public renderer uses Framer Motion and honors the visitor's reduced-motion preference. Unsupported effects (including typing) are rejected rather than stored as inert settings. Admin navigation and animation endpoints require the existing authenticated admin cookie; public endpoints expose only enabled items/configurations.

## Error responses

Errors use JSON with `success: false` and a user-safe `message`. Invalid input returns `400`, missing or invalid sessions return `401`, and attempts to remove a referenced asset return `409`.
=======
# Portfolio API

All endpoints are relative to `/api`. Admin authentication uses the HTTP-only `adminToken` cookie; browser requests must include credentials. CORS and unsafe-request origin checks use the same exact origins from the comma-separated `CLIENT_URLS` environment variable (the legacy single-origin `CLIENT_URL` remains supported). Development also allows `http://localhost:5173` and `http://localhost:5174`; production uses only explicitly configured origins. Credentialed requests are never allowed from a wildcard origin. The existing CORS middleware handles `OPTIONS` preflights and allows `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `OPTIONS` with `Content-Type` and `Authorization` headers.

## Public

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/portfolio` | Public profile, contact, social, resume, and site settings |
| `GET` | `/portfolio/profile` | Public profile and Hero content only |
| `GET` | `/content` | Visible skills, experience, services, education, certifications, and testimonials |
| `GET` | `/projects` | Published projects, ordered by display order |
| `GET` | `/projects/:id` | A published project by MongoDB ID |
| `GET` | `/navigation` | Enabled navigation tree and active theme palette |
| `GET` | `/animations` | Enabled, supported website animation configurations |
| `POST` | `/contact` | Submit a contact message (five submissions per IP per 15 minutes) |
| `POST` | `/auth/login` | Admin login (ten attempts per IP per 15 minutes) |

## Admin

Authenticate with `POST /auth/login`; retrieve the current account with `GET /auth/me`; clear the cookie with `POST /auth/logout`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/portfolio/admin` | Read editable portfolio sections |
| `PUT` | `/portfolio/:section` | Update `profile`, `about`, `contact`, `socials`, `settings`, or `resume` |
| `PUT` | `/portfolio/appearance` | Validate and persist theme, color, typography, and design preferences |
| `GET` | `/content/:type` | List all entries of a CMS type |
| `POST` | `/content/:type` | Create a CMS entry |
| `PUT` | `/content/:type/:id` | Update a CMS entry |
| `DELETE` | `/content/:type/:id` | Delete a CMS entry |
| `GET` | `/projects/admin/all` | List projects, including drafts |
| `POST` | `/projects` | Create a project |
| `PUT` | `/projects/:id` | Update a project |
| `DELETE` | `/projects/:id` | Delete a project |
| `GET` | `/navigation/admin` | Read all navigation items and appearance settings |
| `POST` | `/navigation/items` | Create a navigation item |
| `PUT` | `/navigation/items/:id` | Update a navigation item |
| `DELETE` | `/navigation/items/:id` | Delete an item (deleting a dropdown also deletes its children) |
| `PUT` | `/navigation/appearance` | Update navigation appearance and responsive behavior |
| `PUT` | `/navigation/reset` | Restore default navigation items and appearance |
| `GET` | `/animations/admin` | Read all animation configurations, including disabled ones |
| `POST` | `/animations` | Create an animation configuration |
| `PUT` | `/animations/:id` | Update an animation configuration |
| `DELETE` | `/animations/:id` | Delete an animation configuration |
| `PUT` | `/animations/reset` | Restore the default animation presets |
| `POST` | `/upload/image` | Upload one JPG, PNG, WEBP, or GIF image (5 MB maximum) |
| `POST` | `/upload/multiple` | Upload up to ten images (5 MB each) |
| `POST` | `/upload/resume` | Upload a PDF resume (10 MB maximum) |
| `DELETE` | `/upload/resume` | Delete a resume only after removing its active portfolio reference |
| `DELETE` | `/upload/image` | Delete an image only when it is not referenced by portfolio content |
| `DELETE` | `/upload/multiple` | Safely attempt deletion of multiple unreferenced images |
| `GET` | `/contact/admin/messages` | Read the latest 100 contact submissions |
| `GET` | `/contact/admin/summary` | Read total/unread message counts and recent submissions |
| `PATCH` | `/contact/admin/messages/:id` | Update a message's `read` status |
| `DELETE` | `/contact/admin/messages/:id` | Delete a contact message |

`type` is one of `skills`, `experience`, `services`, `education`, `certifications`, or `testimonials`. CMS entry creation/update uses a `data` object; `visible` and `displayOrder` are top-level fields. Projects use `status: "draft" | "published"` and store uploaded image URLs and Cloudinary public IDs.

Appearance updates accept `theme`, `typography`, and `design` objects plus `colors.dark` and `colors.light` palette objects. Each palette supports `primary`, `secondary`, `accent`, `background`, `text`, `heading`, `surface`, `card`, `button`, `buttonText`, `border`, `gradientStart`, and `gradientEnd`; legacy flat color keys remain accepted for compatibility. Only supported values and bounded numeric settings are stored. The public portfolio applies the selected palette through CSS custom properties. Section visibility, ordering, headings/descriptions, background styles, and navigation options are stored in the `settings` section. Contact summary/read/delete routes are protected by the same admin authentication middleware as the message inbox.

The Profile / Hero editor continues to use the protected `GET /portfolio/admin` and `PUT /portfolio/profile` endpoints. Profile data, including `heroConfig`, is stored in the existing `Portfolio` document at `data.profile`; no duplicate Hero model or route is used. Partial profile and nested Hero updates use dotted `$set` paths so unrelated saved profile, Hero, and responsive-layout fields are preserved. `heroConfig` supports ordered/enabled title and technology-badge arrays, fixed badge positions (`top`, diagonals, and cardinal directions) with optional offsets, responsive desktop/tablet/mobile content-layout settings, typing timing and reduced-motion behavior, up to ten independently configured orbit rings, profile-image crop and glow, cursor settings, Hero-only layout/gradient settings, content visibility, and supported Hero animation targets. Responsive layout settings may be placed under `contentLayout.{desktop|tablet|mobile}.elements` for `heroContent`, `name`, `designation`, `description`, `buttons`, `socialIcons`, `orbit`, `profileImage`, and `container`. Each element supports applicable width/height, alignment, gap, and independent `margin`/`padding` sides (`top`, `right`, `bottom`, `left`) in whole pixels from 0 to 2000; social icons additionally support icon size, horizontal/vertical gaps, padding, radius, hover spacing, and hover effect. Set individual fields to `null` to reset them to defaults, or set a breakpoint object to `{}` to reset that breakpoint. The badge-position layer is static; only enabled ring rotors animate. Titles and badges are limited to 40 each, labels/IDs, positions, colors, and responsive spacing values are validated, timing/size values have explicit bounds, and unknown nested fields are rejected. Public `GET /portfolio` returns the stored public Hero configuration; secret/admin-only data is not part of this configuration. Profile and Hero image uploads reuse the authenticated Cloudinary endpoints, and resume uploads reuse the existing resume endpoint. Social URLs and About description are saved through their existing protected portfolio sections; custom social items accept an optional `enabled` boolean.

Navigation and animation settings are stored in the existing `Portfolio` document under `data.settings.navbar` and `data.settings.animations`; no separate settings collection is required. Navigation items contain an ID, label, URL, type (`internal`, `external`, `anchor`, `custom`, or `dropdown`), icon, position, enabled state, target, optional dropdown parent, and CTA flag. System links cannot be deleted, dropdown nesting is limited to three levels, and deleting a custom dropdown removes its descendants. Navigation appearance includes independent dark/light colors, logo sizing, positioning, typography, spacing, border/shadow, responsive layouts, and mobile/dropdown behavior.

Animation configurations contain an ID, name, target, effect, duration, delay, speed, easing, iteration count, direction, trigger, scroll threshold, enabled state, and bounded custom values. Supported effects are fade-in/up/down/left/right, slide-in, zoom-in/out, scale, rotate, bounce, float, pulse, and staggered reveal. Supported triggers are page load, scroll, hover, and click. Only one enabled animation may target a given element group. The public renderer uses Framer Motion and honors the visitor's reduced-motion preference. Unsupported effects (including typing) are rejected rather than stored as inert settings. Admin navigation and animation endpoints require the existing authenticated admin cookie; public endpoints expose only enabled items/configurations.

## Error responses

Errors use JSON with `success: false` and a user-safe `message`. Invalid input returns `400`, missing or invalid sessions return `401`, and attempts to remove a referenced asset return `409`.
>>>>>>> 401c49b48f273caad6a103d8123add5ddc729486
