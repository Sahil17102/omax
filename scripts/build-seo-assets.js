const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundlePath = path.join(root, "assets", "index-BA4wyRB2.js");
const bundle = fs.readFileSync(bundlePath, "utf8");
const tick = String.fromCharCode(96);
const defaultBaseUrl = "https://travel-production-2054.up.railway.app";
const baseUrl = (process.env.PUBLIC_BASE_URL || defaultBaseUrl).replace(/\/$/, "");

function readEmbeddedJson(variableName) {
  const marker = `${variableName}=JSON.parse(${tick}`;
  const markerIndex = bundle.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Unable to find ${variableName} tour data.`);
  const start = markerIndex + marker.length;
  const end = bundle.indexOf(`${tick}),`, start);
  if (end === -1) throw new Error(`Unable to find the end of ${variableName} tour data.`);
  const rawTemplate = bundle.slice(start, end);
  const decoded = Function(`"use strict"; return ${tick}${rawTemplate}${tick};`)();
  return JSON.parse(decoded);
}

function readInternationalTours() {
  const marker = "pt=[";
  const markerIndex = bundle.indexOf(marker);
  const start = markerIndex + marker.length - 1;
  const end = bundle.indexOf("],mt=", start) + 1;
  if (markerIndex === -1 || end === 0) throw new Error("Unable to find international tour data.");

  const expression = bundle.slice(start, end);
  const imagePaths = [
    "/assets/expat-europe-taster-BH4ff3KW.webp",
    "/assets/expat-classic-europe-DFNEpIWr.webp",
    "/assets/expat-europe-escape-C72QO1uv.webp",
    "/assets/expat-europe-explorer-Cg2FQrpF.webp",
    "/assets/expat-eastern-usa-canada-B-kgBH5c.webp",
    "/assets/expat-eastern-usa-canada-ny-B6mM6_NH.webp"
  ];
  const makeDays = (rows) => rows.map(([place, landmarks], index) => ({
    day: index + 1,
    place,
    landmarks,
    activities: `Today’s route covers ${landmarks}.`,
    transport: "Air-conditioned tour coach",
    meals: "Breakfast, with selected dinners on specified days",
    optional: ""
  }));

  return Function(
    "it", "at", "ot", "st", "ct", "lt", "ut", "dt", "ft",
    `"use strict"; return ${expression};`
  )(
    ...imagePaths,
    makeDays,
    ["Accommodation", "Selected meals", "Tour transport", "Tour leader", "Listed sightseeing"],
    ["Flights", "Visas", "Travel insurance", "Optional excursions", "Personal expenses"]
  );
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTour(tour, type) {
  const description = stripHtml(tour.description || tour.overview || tour.highlights || "");
  const destinations = Array.isArray(tour.destinations)
    ? tour.destinations
    : stripHtml(tour.plan || "").split(/\s*(?:->|→|,)\s*/).filter(Boolean);
  return {
    id: String(tour.id),
    slug: String(tour.slug),
    type,
    name: stripHtml(tour.name),
    description,
    image: tour.image || "",
    duration: Number(tour.duration || tour.dayCount || tour.days?.length || 0),
    origin: stripHtml(tour.origin || destinations[0] || ""),
    end: stripHtml(tour.end || destinations.at(-1) || ""),
    destinations: destinations.map(stripHtml).filter(Boolean),
    audience: stripHtml(tour.audience || ""),
    languages: Array.isArray(tour.languages) ? tour.languages.map(stripHtml) : [],
    styles: Array.isArray(tour.styles) ? tour.styles.map(stripHtml) : [],
    price: Number.isFinite(Number(tour.price)) ? Number(tour.price) : null,
    departureYears: Array.isArray(tour.departureYears) ? tour.departureYears : [],
    sourceUrl: tour.sourceUrl || ""
  };
}

const tours = [
  ...readEmbeddedJson("nt").map((tour) => normalizeTour(tour, "tour")),
  ...readEmbeddedJson("rt").map((tour) => normalizeTour(tour, "official")),
  ...readInternationalTours().map((tour) => normalizeTour(tour, "international"))
];

const uniqueSlugs = new Set(tours.map((tour) => tour.slug));
const uniqueIds = new Set(tours.map((tour) => `${tour.type}:${tour.id}`));
if (tours.length !== 89 || uniqueSlugs.size !== tours.length || uniqueIds.size !== tours.length) {
  throw new Error(`SEO data validation failed: ${tours.length} tours, ${uniqueSlugs.size} slugs, ${uniqueIds.size} typed IDs.`);
}

const seoDirectory = path.join(root, "seo");
fs.mkdirSync(seoDirectory, { recursive: true });
fs.writeFileSync(path.join(seoDirectory, "tours.json"), `${JSON.stringify(tours, null, 2)}\n`);

const today = new Date().toISOString().slice(0, 10);
const escapeXml = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;"
})[character]);
const sitemapEntries = [
  `  <url><loc>${escapeXml(`${baseUrl}/`)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ...tours.map((tour) => `  <url><loc>${escapeXml(`${baseUrl}/tours/${tour.slug}`)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`)
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries.join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);

console.log(`Generated SEO assets for ${tours.length} tours.`);
