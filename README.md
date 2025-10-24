# Debnil Pal — Portfolio

A fast, modern, static portfolio showcasing AI/ML, Deep Learning, Cybersecurity, and Competitive Programming projects.

This repo contains a static site located in the `public/` directory. You can host it on Netlify or GitHub Pages.

## Structure

- `public/`
  - `index.html` (Home)
  - `about.html`
  - `skills.html`
  - `projects.html`
  - `blogs.html`
  - `contact.html`
  - `assets/` (images/icons)
  - `css/`, `js/` (styles and scripts)
- `netlify.toml` (Netlify configuration)
- `public/_redirects` (Pretty URLs for Netlify)
- `.github/workflows/gh-pages.yml` (Optional: auto-deploy to GitHub Pages)

## Local preview

Option 1 — Open directly:
- Open `public/index.html` in your browser.

Option 2 — Serve with a static server (recommended):
- VS Code Live Server extension, or
- Python: `python -m http.server 8000` from the `public/` folder and open http://localhost:8000

## Deploy to Netlify (recommended)

1. Push this repository to GitHub.
2. Create a new site on Netlify and "Import from Git".
3. Build settings:
   - Build command: (leave empty, it’s a static site)
   - Publish directory: `public`
4. Save and deploy.

Pretty URLs are enabled via `public/_redirects` so routes like `/about` resolve to `/about.html`.

## Deploy to GitHub Pages

There are two good approaches:

- Approach A (easiest): Deploy `public/` to `gh-pages` branch using GitHub Actions
  - The included workflow `.github/workflows/gh-pages.yml` publishes the `public/` folder to `gh-pages` on every push to `main`.
  - After the first run, go to Settings → Pages and set:
    - Source: `Deploy from a branch`
    - Branch: `gh-pages` / `/ (root)`

- Approach B: Serve from `docs/`
  - Rename `public/` → `docs/` and push.
  - Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `/docs`.

Note: For pretty URLs on GitHub Pages you typically have to link to `about.html` instead of `/about`. This project already uses clean URLs with Netlify redirects; for GitHub Pages, either keep `.html` in links or add a service worker/JS router workaround.

## Environment and customization

- Update images in `public/assets/`.
- Update social links and contact info in relevant HTML pages.
- Theme and layout styles live in `public/css/`.
- Interactive behavior lives in `public/js/`.

## License

MIT — see [`LICENSE`](LICENSE) for details.
