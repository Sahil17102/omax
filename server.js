const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const productionBaseUrl = (process.env.PUBLIC_BASE_URL || "https://travel-production-2054.up.railway.app").replace(/\/$/, "");
const indexTemplate = fs.readFileSync(path.join(root, "index.html"), "utf8");
const publicIndexTemplate = indexTemplate
  .replaceAll("https://travel-production-2054.up.railway.app", productionBaseUrl)
  .replace("<!-- SEO_ROUTE_DATA -->", `<script>window.__SEO_BASE_URL__=${JSON.stringify(productionBaseUrl)};</script>`);
const tours = JSON.parse(fs.readFileSync(path.join(root, "seo", "tours.json"), "utf8"));
const tourBySlug = new Map(tours.map((tour) => [tour.slug, tour]));
const tourById = new Map(tours.map((tour) => [tour.id, tour]));

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

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
  if (!value) return `${productionBaseUrl}/assets/oamx-logo-transparent-D0fBhq3P.png`;
  return value.startsWith("/") ? `${productionBaseUrl}${value}` : value;
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildTourSchema(tour, canonical, image) {
  const offer = tour.price
    ? {
        "@type": "Offer",
        price: tour.price,
        priceCurrency: "USD",
        url: canonical,
        availability: "https://schema.org/InStock"
      }
    : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
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
          "@id": `${productionBaseUrl}/#organization`,
          name: "Vijay India Tours",
          telephone: "+91-7976064160",
          email: "info@vijayindiatours.com"
        },
        ...(offer ? { offers: offer } : {})
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${productionBaseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Tours", item: `${productionBaseUrl}/#packages` },
          { "@type": "ListItem", position: 3, name: tour.name, item: canonical }
        ]
      }
    ]
  };
}

function buildTourHtml(tour) {
  const canonical = `${productionBaseUrl}/tours/${tour.slug}`;
  const title = truncate(`${tour.name} | Vijay India Tours`, 60);
  const description = truncate(tour.description, 158);
  const image = absoluteAsset(tour.image);
  const routeData = `<script>window.__SEO_TOUR__=${safeJson({ id: tour.id, slug: tour.slug, type: tour.type })};history.replaceState(null,"",location.pathname+location.search+"#${tour.type}/${encodeURIComponent(tour.id)}");</script>`;
  const schema = safeJson(buildTourSchema(tour, canonical, image));

  return publicIndexTemplate
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
    .replace(`<script>window.__SEO_BASE_URL__=${JSON.stringify(productionBaseUrl)};</script>`, `${routeData}<script>window.__SEO_BASE_URL__=${JSON.stringify(productionBaseUrl)};</script>`);
}

function sendBuffer(request, response, status, contentType, buffer, cacheControl = "no-cache") {
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
    "Vary": "Accept-Encoding",
    "X-Content-Type-Options": "nosniff"
  };
  if (request.method === "HEAD") {
    headers["Content-Length"] = buffer.length;
    response.writeHead(status, headers);
    response.end();
    return;
  }
  const encoding = request.headers["accept-encoding"] || "";
  if (/\bbr\b/.test(encoding) && /^(text\/|application\/(javascript|json|xml))/.test(contentType)) {
    const compressed = zlib.brotliCompressSync(buffer);
    response.writeHead(status, { ...headers, "Content-Encoding": "br", "Content-Length": compressed.length });
    response.end(compressed);
  } else if (/\bgzip\b/.test(encoding) && /^(text\/|application\/(javascript|json|xml))/.test(contentType)) {
    const compressed = zlib.gzipSync(buffer);
    response.writeHead(status, { ...headers, "Content-Encoding": "gzip", "Content-Length": compressed.length });
    response.end(compressed);
  } else {
    response.writeHead(status, { ...headers, "Content-Length": buffer.length });
    response.end(buffer);
  }
}

function serveFile(request, response, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      sendBuffer(request, response, 404, "text/plain; charset=utf-8", Buffer.from("Not found"));
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    const contentType = types[extension] || "application/octet-stream";
    const cacheControl = /-[A-Za-z0-9_-]{8,}\./.test(path.basename(filePath))
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600";
    const range = request.headers.range;
    if (range && extension === ".mp4") {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (!match || start > end || start >= stat.size) {
        response.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        response.end();
        return;
      }
      response.writeHead(206, {
        "Content-Type": contentType,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Cache-Control": cacheControl
      });
      if (request.method === "HEAD") response.end();
      else fs.createReadStream(filePath, { start, end }).pipe(response);
      return;
    }
    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        sendBuffer(request, response, 500, "text/plain; charset=utf-8", Buffer.from("Unable to load the site."));
        return;
      }
      sendBuffer(request, response, 200, contentType, content, cacheControl);
    });
  });
}

http.createServer((request, response) => {
  const url = new URL(request.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") {
    sendBuffer(request, response, 200, types[".html"], Buffer.from(publicIndexTemplate));
    return;
  }

  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    serveFile(request, response, path.join(root, pathname.slice(1)));
    return;
  }

  const tourMatch = pathname.match(/^\/tours\/([a-z0-9-]+)\/?$/);
  if (tourMatch) {
    const tour = tourBySlug.get(tourMatch[1]);
    if (!tour) {
      sendBuffer(request, response, 404, types[".html"], Buffer.from("<!doctype html><html lang=\"en\"><title>Tour not found</title><meta name=\"robots\" content=\"noindex\"><body><h1>Tour not found</h1></body></html>"));
      return;
    }
    sendBuffer(request, response, 200, types[".html"], Buffer.from(buildTourHtml(tour)));
    return;
  }

  const idMatch = pathname.match(/^\/tour\/([^/]+)\/?$/);
  if (idMatch) {
    const tour = tourById.get(idMatch[1]);
    if (tour) {
      response.writeHead(301, { Location: `/tours/${tour.slug}`, "Cache-Control": "public, max-age=86400" });
      response.end();
      return;
    }
  }

  const relative = pathname.replace(/^\/+/, "");
  const requested = path.resolve(root, relative);
  if (!requested.startsWith(`${root}${path.sep}`)) {
    sendBuffer(request, response, 403, "text/plain; charset=utf-8", Buffer.from("Forbidden"));
    return;
  }
  serveFile(request, response, requested);
}).listen(port, "127.0.0.1", () => {
  console.log(`Vijay India Tours: http://127.0.0.1:${port}`);
  console.log(`SEO routes ready for ${tours.length} tours.`);
});
