# Vijay India Tours clone

This folder contains a local, self-hosted clone of the supplied production site.

## Run

```bash
npm start
```

Then open `http://127.0.0.1:4173`.

The original first-visit country/currency selector, tour data, images, responsive layout, search, filters, package details, and enquiry flow are preserved.

## SEO routes and validation

The SEO build reads the existing 89-tour dataset and generates `robots.txt`, `sitemap.xml`, and the normalized metadata used by crawlable `/tours/<slug>` pages.

```bash
npm run build:seo
npm run test:seo
```

Set `PUBLIC_BASE_URL` when the production domain changes so canonical URLs, structured data, and sitemap entries use the final domain.
