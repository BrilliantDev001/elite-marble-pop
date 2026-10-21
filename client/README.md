# ELITE Marble & POP Works Ltd. Website

Portfolio and lead-generation website. This is not an online shop.
Status: **frontend prototype**. There is no backend yet.

## Run it

```bash
cd client
npm install
npm run dev        # development server (usually http://localhost:5173)
npm run build      # production build
npm run preview    # serve the production build locally
npm run lint       # check the code
```

## Where things live (client/src)

- `data/`: ALL sample content and settings
  - `siteConfig.js`: business name, contact details (placeholders), navigation, `demoMode` banner flag
  - `services.js`, `categories.js`: Marble and POP services and their categories
  - `projects.js`: sample projects (replace with real ones); `reviews.js`: one placeholder review
  - `images.js`: builds image objects `{ src, alt, caption, isPlaceholder }`
  - `adminMock.js`, `heroSlides.js`: admin mock data and hero slides
- `components/`: `layout`, `home`, `projects`, `reviews`, `contact`, `services`, `admin`, `shared`
- `pages/`: one file per route; `hooks/usePageMeta.js` sets page titles and descriptions
- Placeholder photos: `client/public/placeholders/`

## Routes

`/`, `/marble`, `/pop`, `/gallery` (filters via `?service=` and `?category=`),
`/gallery/:slug`, `/reviews`, `/reviews/write`, `/contact`, `/admin`

## What is mocked (nothing is saved anywhere)

- Quote form and review form: validate, then pretend to send
- Admin: fake login (any email and password), mock data held in memory, resets on refresh
- Contact details, sample projects, the one review and all photos are placeholders

## Dev-only helpers (hidden in production builds)

- "Placeholder" badge on placeholder images
- `?state=loading` or `?state=error` on `/gallery`; `?state=error` on `/contact` and `/reviews/write`

## Before launch

- Replace placeholder photos, projects, contact details and the placeholder review with real content
- Set `demoMode` to `false` in `data/siteConfig.js`
- Confirm the final service and category list with the owner
- Add the final logo (only `components/shared/BrandLogo.jsx` changes)

## Backend (not started)

Express, MongoDB, real authentication and managed image hosting. Starts only after the
frontend is approved.