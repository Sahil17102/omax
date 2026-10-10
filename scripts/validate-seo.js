const fs = require("fs");

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:4173";
const canonicalBase = (process.env.PUBLIC_BASE_URL || "https://travel-production-2054.up.railway.app").replace(/\/$/, "");
const tours = JSON.parse(fs.readFileSync("seo/tours.json", "utf8"));

async function validate() {
  const robots = await fetch(`${baseUrl}/robots.txt`);
  const robotsText = await robots.text();
  if (!robots.ok || !robots.headers.get("content-type")?.startsWith("text/plain") || !robotsText.includes("Sitemap:")) {
    throw new Error("robots.txt validation failed.");
  }

  const sitemap = await fetch(`${baseUrl}/sitemap.xml`);
  const sitemapText = await sitemap.text();
  const sitemapUrlCount = (sitemapText.match(/<url>/g) || []).length;
  if (!sitemap.ok || !sitemap.headers.get("content-type")?.includes("xml") || sitemapUrlCount !== tours.length + 1) {
    throw new Error(`Sitemap validation failed with ${sitemapUrlCount} URLs.`);
  }

  const results = await Promise.all(tours.map(async (tour) => {
    const response = await fetch(`${baseUrl}/tours/${tour.slug}`);
    const html = await response.text();
    const canonical = `${canonicalBase}/tours/${tour.slug}`;
    return {
      slug: tour.slug,
      valid: response.status === 200
        && html.includes(`<link rel="canonical" href="${canonical}"`)
        && /<title>[^<]+<\/title>/.test(html)
        && html.includes('"@type":"TouristTrip"')
        && html.includes('property="og:title"')
        && html.includes('name="twitter:card"')
    };
  }));

  const failures = results.filter((result) => !result.valid);
  if (failures.length) throw new Error(`Tour SEO validation failed: ${failures.map((item) => item.slug).join(", ")}`);

  console.log(`SEO validation passed: ${tours.length} tour pages, ${sitemapUrlCount} sitemap URLs.`);
}

validate().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
