(() => {
  const baseUrl = window.__SEO_BASE_URL__ || "https://travel-production-2054.up.railway.app";

  const setMeta = (selector, attribute, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute(attribute, value);
  };

  const updateMetadata = async () => {
    const match = location.hash.match(/^#(tour|official|international)\/(.+)$/);
    if (!match) return;
    try {
      const response = await fetch("/seo/tours.json", { credentials: "same-origin" });
      if (!response.ok) return;
      const tours = await response.json();
      const tour = tours.find((item) => item.type === match[1] && item.id === match[2]);
      if (!tour) return;
      const titleText = `${tour.name} | Vijay India Tours`;
      const description = tour.description.length > 158
        ? `${tour.description.slice(0, 155).replace(/\s+\S*$/, "")}…`
        : tour.description;
      const canonical = `${baseUrl}/tours/${tour.slug}`;
      const image = tour.image.startsWith("/") ? `${baseUrl}${tour.image}` : tour.image;
      document.title = titleText.length > 60 ? `${titleText.slice(0, 57).replace(/\s+\S*$/, "")}…` : titleText;
      setMeta('meta[name="description"]', "content", description);
      setMeta('link[rel="canonical"]', "href", canonical);
      setMeta('meta[property="og:title"]', "content", document.title);
      setMeta('meta[property="og:description"]', "content", description);
      setMeta('meta[property="og:url"]', "content", canonical);
      setMeta('meta[property="og:image"]', "content", image);
      setMeta('meta[name="twitter:title"]', "content", document.title);
      setMeta('meta[name="twitter:description"]', "content", description);
      setMeta('meta[name="twitter:image"]', "content", image);
    } catch {
      // SEO enhancement must never interfere with the tour application.
    }
  };

  const setImageDimensions = (image) => {
    if (image.alt.startsWith("O-A-M-X 99 LLP")) {
      image.alt = "Vijay India Tours — private India and international journeys";
    }
    if (image.hasAttribute("width") && image.hasAttribute("height")) return;
    if (image.src.includes("/1500x800/")) {
      image.setAttribute("width", "1500");
      image.setAttribute("height", "800");
    } else if (image.src.includes("/assets/expat-")) {
      image.setAttribute("width", "900");
      image.setAttribute("height", "1125");
    } else if (image.src.includes("/review/720/")) {
      image.setAttribute("width", "720");
      image.setAttribute("height", "540");
    } else if (image.src.includes("/review/480/")) {
      image.setAttribute("width", "480");
      image.setAttribute("height", "360");
    }
    if (image.hasAttribute("width") && image.hasAttribute("height")) {
      image.decoding = "async";
      return;
    }
    const apply = () => {
      if (!image.naturalWidth || !image.naturalHeight) return;
      image.setAttribute("width", String(image.naturalWidth));
      image.setAttribute("height", String(image.naturalHeight));
      image.decoding = "async";
    };
    if (image.complete) apply();
    else image.addEventListener("load", apply, { once: true });
  };

  const scanImages = (root = document) => root.querySelectorAll?.("img").forEach(setImageDimensions);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches?.("img")) setImageDimensions(node);
        scanImages(node);
      }
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    scanImages();
    observer.observe(document.body, { childList: true, subtree: true });
    updateMetadata();
  });
  addEventListener("hashchange", updateMetadata);
})();
