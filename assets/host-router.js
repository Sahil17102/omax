const isAdminHost = location.hostname.toLowerCase() === "omax-admin.onrender.com";

if (isAdminHost) {
  document.querySelector('link[href*="index-B-HpPFcG.css"]')?.remove();
  document.getElementById("app-css")?.remove();
  document.getElementById("root")?.replaceChildren();
  document.documentElement.classList.remove("admin-host");
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "/assets/render-admin.css?v=20261010-2";
  document.head.append(stylesheet);
  document.title = "OMAX Admin | Website Control Centre";
  document.querySelector('meta[name="robots"]')?.setAttribute("content", "noindex, nofollow");
  await import("/assets/render-admin.js?v=20261010-2");
} else {
  await Promise.all([
    import("/assets/admin-sync.js?v=20261010-2"),
    import("/assets/index-BA4wyRB2.js?v=20261010-6"),
  ]);
}
