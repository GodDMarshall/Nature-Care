# Nature Care website

The website for Nature Care solar power fencing: seven pages, a 3D fence hero on the home page, a fence planner, a price chatbot, and a free site assessment form that emails each request to the business.

It is a small Node.js app. `server.js` serves the pages and sends the form by Gmail. There is no database and no build step.

## Pages

| Page | File | What it holds |
|---|---|---|
| Home | `index.html` | 3D fence hero, how the system works, products, key numbers, testimonials, fence planner, assessment form, Get a Quote chatbot |
| About | `about.html` | Company story, field photos, leadership |
| Solutions | `solution.html` | Product categories, fence configurations, energizers, solar power kit, specifications |
| Industries | `industries.html` | Sectors served, components and accessories, compliance matrix |
| Projects | `projects.html` | Deployment case studies |
| Gallery | `gallery.html` | Filterable photo gallery with lightbox |
| Form sent | `success.html` | Shown after the assessment form is emailed |
| Form failed | `error.html` | Shown when the form is incomplete or the email could not be sent |

## Project layout

```
server.js        Web server and the /submit-assessment form handler
package.json     Dependencies and the start command
.env.example     Template for the settings file (.env)
*.html           The pages listed above
style.css        All styling
js/              Site scripts
  main.js          Navigation, animations, chatbot
  estimator.js     Fence planner (posts and wire quantities)
  prices.js        Published prices and the Call Now number (one place for both)
  gallery.js       Gallery filters and lightbox
  scene-boot.js    Checks the browser can do 3D, then loads scene.js
  scene.js         The 3D fence hero (falls back to a flat image if 3D is unavailable)
vendor/          Bundled third-party libraries (three.js, GSAP, Lenis); no CDN needed
fonts/           Self-hosted web fonts
image/           Product photos and logos; image/web/ holds the optimised WebP copies the pages use
```

Some large PNG/JPEG files in `image/` are the original photos that the WebP files in `image/web/` were made from. The pages do not load them, but they are kept as the source copies.

## Requirements

- Node.js 20 or newer (https://nodejs.org)
- A Gmail account with 2-Step Verification turned on, to send the form emails

## Setup

```bash
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Then fill in `.env`:

| Setting | What to put |
|---|---|
| `EMAIL_USER` | The Gmail address that sends the form emails |
| `EMAIL_PASS` | A Gmail **App Password** for that account (not the normal login password) |
| `EMAIL_TO` | The address that should receive each assessment request (can be the same Gmail) |
| `PORT` | The port to run on. Leave it out and the server uses 8080 |

To create the App Password: sign in to the Gmail account, open https://myaccount.google.com/apppasswords, create one named "Nature Care website", and paste the 16-character code into `EMAIL_PASS` without spaces. App Passwords only appear once 2-Step Verification is on.

`.env` holds a password, so it is listed in `.gitignore` and must never be committed or emailed. Only `.env.example` belongs in the repository.

## Run

```bash
npm start
```

Open the address it prints, for example http://localhost:3000.

To check the form end to end, fill in the free site assessment form at the bottom of the home page. You should land on the "Your assessment request is in" page and an email should arrive at `EMAIL_TO`. If you land on the error page instead, the terminal shows the reason (usually a wrong App Password).

## Deploying

Any host that runs Node.js 20+ works, for example Render, Railway, a VPS, or cPanel hosting with Node.js support.

1. Upload the project (or connect the Git repository). Do not upload `node_modules/` or `.env`.
2. Install command: `npm install`. Start command: `npm start`.
3. Set `EMAIL_USER`, `EMAIL_PASS` and `EMAIL_TO` in the host's environment variables screen. Most hosts set `PORT` themselves; leave it to them.
4. Point the domain at the host and turn on HTTPS.
5. Send one test assessment from the live site and confirm the email arrives.

On a plain VPS, keep the server running with a process manager such as `pm2 start server.js --name naturecare` behind Nginx.

Some hosts block outgoing mail ports (SMTP). If the form always lands on the error page on the live site but works locally, that is the usual cause; check the host's documentation for SMTP access.

## Security notes

- The server only serves the pages, `style.css`, and the `image/`, `js/`, `vendor/` and `fonts/` folders. `server.js`, `package.json`, `.env` and every other file in the project folder return "Page not found". A new `.html` page dropped into the project folder is served after a restart; a new folder must be added to `PUBLIC_DIRS` in `server.js`.
- The form rejects submissions missing name, company, email or phone, and caps the fence plan notes at 2,000 characters.

## Common edits

| To change | Edit |
|---|---|
| Power set prices, or the Call Now number in the chatbot and planner | `js/prices.js` |
| The phone number in page headers and footers | Search the `.html` files for `9845571328` |
| Fence planner rules (post spacing, wire lines) | `js/estimator.js` |
| Colours, fonts, spacing | `style.css` (colour variables are at the top) |
| Where form emails go | `EMAIL_TO` in `.env` or the host's environment variables |
| Email wording | The `mailOptions` text in `server.js` |
| A photo | Replace the file in `image/web/` with the same name (WebP, around 1400 px wide, plus a `-sm` copy around 720 px) |

## Content still to confirm

These came from the 13-Oct-2026 requirement sheet and are open with the business:

- Set I is shown as "up to 500 m"; the sheet gives no band for it, so this is inferred from Set II.
- Set II components and ratings are shown as "sized to your boundary".
- Fences over 1,000 m, and every fence material other than posts and HT wire, are "On survey" by design.
- Railway Barricade and Steel Rope Barricade read "Specification on request" because no specs or photos exist yet.
