# ELITE Marble & POP Works Ltd. Website

Portfolio and lead-generation website (not an online shop): React frontend, Express and MongoDB backend,
ImageKit for photos.

## Run it (development)

You need Node 22.9 or newer and a MongoDB database (MongoDB Atlas is fine).

```bash
# 1. Backend (first terminal)
cd server
npm install
cp .env.example .env        # then fill in the values (see below)
npm run admin:create        # creates the owner account, then remove ADMIN_PASSWORD from .env
npm run seed -- categories  # the proposed Marble and POP categories (safe to repeat)
npm run seed -- samples     # optional: DEMO projects (marked as samples)
npm run dev                 # http://localhost:5000

# 2. Frontend (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (it forwards /api to the backend)
```

Open the site at `http://localhost:5173`, not `127.0.0.1`: the server checks the website's address.
The admin is at `/admin`.

## Environment variables (server/.env, never committed)

| Name                                                                   | Purpose                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `NODE_ENV`                                                             | `development` or `production`                                                   |
| `PORT`                                                                 | API port (default 5000)                                                         |
| `CLIENT_ORIGIN`                                                        | The website's address. Only this site may call the API (required in production) |
| `MONGODB_URI`                                                          | MongoDB connection string, with the database name                               |
| `JWT_SECRET`                                                           | Signs admin sessions. 32+ random characters                                     |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`                                        | Used only by `npm run admin:create`. Remove the password afterwards             |
| `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` | Image hosting. The private key is a secret                                      |

The frontend has one optional, public setting (`client/.env.example`).

## Useful commands

| Where  | Command                                            | What it does                                                                  |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| server | `npm run admin:create`                             | Creates the owner account, or resets its password                             |
| server | `npm run seed -- categories`                       | Adds the proposed categories (skips existing ones)                            |
| server | `npm run seed -- samples`                          | Adds the DEMO projects                                                        |
| server | `npm run seed -- remove-samples`                   | Removes ONLY the demo projects (do this before launch)                        |
| server | `npm run cleanup:images`                           | Lists photos in ImageKit that nothing uses (add `-- --delete` to remove them) |
| client | `npm run lint`, `npm run build`, `npm run preview` | Check, build and try the production build                                     |

## How it fits together

- `client/src/data/` holds the content that is NOT edited in the admin: the two services and their
  pricing text, the hero slides and the site name. Everything else comes from the API.
- Admin (`/admin`) manages projects (with photos), categories, reviews, enquiries and the contact details.
- Reviews start as pending and appear only after approval. Featuring is a separate action.
- Enquiries are private and visible only in the admin.
- Reviews and enquiries are text only. Customers are invited to send photos on WhatsApp.

## Before launch

- Edit the sample projects into real ones (new title, text and photos), then tick "This is now a real project"
  on each. That is only allowed once every placeholder photo has been replaced. Run
  `npm run seed -- remove-samples` for any sample projects that are left over. It never touches projects you
  have marked as real, or categories.
- Replace the placeholder photo on each category in Admin > Categories.
- Replace the placeholder photos in `client/public/placeholders/` (hero, service pages, About) with real
  ones, and update their alt text in `client/src/data/services.js`, `heroSlides.js` and `siteConfig.js`.
  These photos are not editable in the admin: changing them needs a rebuild.
- Enter the real phone, WhatsApp number, email and address in Admin > Settings.
- Confirm the final service and category list, and the wording of "Why choose ELITE" and "About".
- Set `demoMode` to `false` in `client/src/data/siteConfig.js`.
- Add the final logo (only `components/shared/BrandLogo.jsx` changes).
- Deployment settings (hosting, domain, HTTPS, environment variables) are covered in the next stage.
