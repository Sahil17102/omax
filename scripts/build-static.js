const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const dist = path.resolve(root, "dist");
const defaultBaseUrl = "https://omax-1ui5.onrender.com";
const baseUrl = (process.env.PUBLIC_BASE_URL || defaultBaseUrl).replace(/\/$/, "");

if (path.dirname(dist) !== root || path.basename(dist) !== "dist") {
  throw new Error(`Refusing to replace unexpected output directory: ${dist}`);
}

execFileSync(process.execPath, [path.join(__dirname, "optimize-performance-assets.js")], {
  cwd: root,
  stdio: "inherit"
});

execFileSync(process.execPath, [path.join(__dirname, "build-seo-assets.js")], {
  cwd: root,
  env: { ...process.env, PUBLIC_BASE_URL: baseUrl },
  stdio: "inherit"
});

const tours = JSON.parse(fs.readFileSync(path.join(root, "seo", "tours.json"), "utf8"));
const appCss = fs.readFileSync(path.join(root, "assets", "index-B-HpPFcG.css"), "utf8");
const template = fs.readFileSync(path.join(root, "index.html"), "utf8")
  .replaceAll(defaultBaseUrl, baseUrl)
  .replace(
    '<link rel="stylesheet" crossorigin href="/assets/index-B-HpPFcG.css" />',
    `<style id="app-css">${appCss}</style>`
  );

function escapeHtml(value = "") {
  return String(value).replace(/[&<>\"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  })[character]);
}

function truncate(value, maximum) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maximum) return text;
  return `${text.slice(0, maximum - 1).replace(/\s+\S*$/, "")}…`;
}

function absoluteAsset(value) {
  if (!value) return `${baseUrl}/assets/oamx-logo-transparent-D0fBhq3P.png`;
  return value.startsWith("/") ? `${baseUrl}${value}` : value;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildTourSchema(tour, canonical, image) {
  const trip = {
    "@type": "TouristTrip",
    "@id": `${canonical}#trip`,
    name: tour.name,
    description: tour.description,
    image,
    url: canonical,
    touristType: tour.styles,
    itinerary: {
      "@type": "ItemList",
      itemListElement: tour.destinations.map((destination, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: destination
      }))
    },
    provider: {
      "@type": "TravelAgency",
      "@id": `${baseUrl}/#organization`,
      name: "Vijay India Tours",
      telephone: "+91-7976064160",
      email: "info@vijayindiatours.com"
    }
  };
  if (tour.price) {
    trip.offers = {
      "@type": "Offer",
      price: tour.price,
      priceCurrency: "USD",
      url: canonical,
      availability: "https://schema.org/InStock"
    };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      trip,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Tours", item: `${baseUrl}/#packages` },
          { "@type": "ListItem", position: 3, name: tour.name, item: canonical }
        ]
      }
    ]
  };
}

function buildTourHtml(tour) {
  const canonical = `${baseUrl}/tours/${tour.slug}`;
  const title = truncate(`${tour.name} | Vijay India Tours`, 60);
  const description = truncate(tour.description, 158);
  const image = absoluteAsset(tour.image);
  const routeData = `<script>window.__SEO_TOUR__=${safeJson({ id: tour.id, slug: tour.slug, type: tour.type })};window.__SEO_BASE_URL__=${safeJson(baseUrl)};history.replaceState(null,"",location.pathname+location.search+"#${tour.type}/${encodeURIComponent(tour.id)}");</script>`;
  const schema = safeJson(buildTourSchema(tour, canonical, image));

  return template
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:type" content="[^"]*"\s*\/>/, '<meta property="og:type" content="product" />')
    .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`)
    .replace(/<meta property="og:image" content="[^"]*"\s*\/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
    .replace(/<meta property="og:image:alt" content="[^"]*"\s*\/>/, `<meta property="og:image:alt" content="${escapeHtml(tour.name)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*"\s*\/>/, `<meta name="twitter:image" content="${escapeHtml(image)}" />`)
    .replace(/<script id="structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/, `<script id="structured-data" type="application/ld+json">${schema}</script>`)
    .replace("<!-- SEO_ROUTE_DATA -->", routeData);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
fs.cpSync(path.join(root, "seo"), path.join(dist, "seo"), { recursive: true });
fs.copyFileSync(path.join(root, "robots.txt"), path.join(dist, "robots.txt"));
fs.copyFileSync(path.join(root, "sitemap.xml"), path.join(dist, "sitemap.xml"));
fs.copyFileSync(path.join(root, "_headers"), path.join(dist, "_headers"));
fs.writeFileSync(
  path.join(dist, "index.html"),
  template.replace("<!-- SEO_ROUTE_DATA -->", `<script>window.__SEO_BASE_URL__=${safeJson(baseUrl)};</script>`)
);

for (const tour of tours) {
  const outputDirectory = path.join(dist, "tours", tour.slug);
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, "index.html"), buildTourHtml(tour));
}

fs.writeFileSync(
  path.join(dist, "404.html"),
  '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Page not found | Vijay India Tours</title></head><body><h1>Page not found</h1><p><a href="/">Return to Vijay India Tours</a></p></body></html>'
);

console.log(`Static export complete: homepage plus ${tours.length} tour pages in ${dist}.`);
