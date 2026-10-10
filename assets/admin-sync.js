(() => {
  const apiBase = "https://omax-admin-control.pkmmittal97.chatgpt.site";
  const navIds = ["international-trips", "india-trips", "india-tour-packages", "golden-triangle", "rajasthan", "tiger-safari", "food-tours"];
  const enquiryStyles = document.createElement("style");
  enquiryStyles.textContent = ".form-success-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:20px}.form-success-actions button{border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer}.form-success-actions .whatsapp-after-submit{background:#168b52;color:#fff;border:0}.form-success-actions .send-another{background:#eef3f5;color:#12304e;border:0}";
  document.head.append(enquiryStyles);
  const postJson = (url, payload) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = 10000;
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Submission failed"));
    request.onerror = request.ontimeout = () => reject(new Error("Submission failed"));
    request.send(JSON.stringify(payload));
  });

  function applyAdminControls(cms) {
    if (!cms) return;
    window.__VIT_CMS__ = cms;
    try { sessionStorage.setItem("vit-cms", JSON.stringify(cms)); } catch {}
    if (cms.settings?.siteName) document.title = `${cms.settings.siteName} — Private India & International Journeys`;
    const whatsappNumber = String(cms.settings?.whatsapp || "").replace(/\D/g, "");
    if (whatsappNumber) document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
      const message = new URL(link.href).searchParams.get("text");
      link.href = `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
    });
    const nav = document.querySelector(".mainnav");
    if (nav) {
      const controlHash = JSON.stringify([cms.settings?.navigationItems || "", (cms.tours || []).filter(t => t.showInNavbar && t.published).map(t => [t.id,t.name])]);
      if (nav.dataset.adminControlHash === controlHash) return;
      nav.dataset.adminControlHash = controlHash;
      const baseNodes = [...nav.children].filter(node => !node.classList.contains("mobile-enquire") && !node.classList.contains("cms-tour-nav"));
      baseNodes.slice(0, navIds.length).forEach((node, index) => node.dataset.adminNavId = navIds[index]);
      let items;
      try { items = JSON.parse(cms.settings?.navigationItems || "null"); } catch {}
      if (Array.isArray(items)) {
        items.sort((a,b) => a.order-b.order).forEach(item => {
          const node = nav.querySelector(`[data-admin-nav-id="${item.id}"]`);
          if (!node) return;
          node.hidden = item.visible === false;
          const label = node.matches("a") ? node : node.querySelector("button");
          if (label && node.matches("a")) label.textContent = item.label;
          else if (label?.firstChild) label.firstChild.textContent = `${item.label} `;
          nav.insertBefore(node, nav.querySelector(".mobile-enquire"));
        });
      }
      nav.querySelectorAll(".cms-tour-nav").forEach(node => node.remove());
      (cms.tours || []).filter(t => t.showInNavbar && t.published).forEach(tour => {
        const link = document.createElement("a");
        link.className = "cms-tour-nav";
        link.href = `#tour/${tour.id}`;
        link.textContent = tour.name;
        nav.insertBefore(link, nav.querySelector(".mobile-enquire"));
      });
    }
  }

  fetch(`${apiBase}/api/public/bootstrap?v=${Date.now()}`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(cms => {
    if (!cms) return;
    applyAdminControls(cms);
    const observer = new MutationObserver(() => applyAdminControls(cms));
    observer.observe(document.getElementById("root"), { childList:true, subtree:true });
  }).catch(() => {});

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.querySelector('button.submit')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = form.querySelector('button.submit');
    const original = button?.textContent || "Send enquiry";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending enquiry...";
    }

    const fields = new FormData(form);
    const hash = location.hash.match(/^#(?:tour|official|international)\/(.+)$/);
    const currentTour = window.__VIT_CMS__?.tours?.find((tour) => tour.id === hash?.[1]);
    const country = document.querySelector(".market-flag")?.parentElement?.textContent?.trim() || "";
    const payload = {
      name: fields.get("name"),
      phone: fields.get("phone"),
      email: fields.get("email"),
      travelDate: fields.get("dates"),
      message: fields.get("message"),
      country,
      tourId: currentTour?.id || null,
      tourName: currentTour?.name || "General enquiry",
    };

    try {
      await postJson(`${apiBase}/api/public/enquiries`, payload);
      const success = document.createElement("div");
      success.className = "form-success";
      const heading = document.createElement("h3");
      heading.textContent = "Enquiry sent to admin";
      const copy = document.createElement("p");
      copy.textContent = "Thank you. Your enquiry is saved in the admin inbox and the team will contact you shortly.";
      const actions = document.createElement("div");
      actions.className = "form-success-actions";
      const whatsappNumber = String(window.__VIT_CMS__?.settings?.whatsapp || "").replace(/\D/g, "");
      if (whatsappNumber) {
        const whatsapp = document.createElement("button");
        whatsapp.type = "button";
        whatsapp.className = "whatsapp-after-submit";
        whatsapp.textContent = "Continue on WhatsApp";
        const message = [
          `Hello ${window.__VIT_CMS__?.settings?.siteName || "OMAX"}, I have submitted an enquiry.`,
          `Name: ${payload.name || ""}`,
          `Phone: ${payload.phone || ""}`,
          `Email: ${payload.email || "Not provided"}`,
          `Travel date: ${payload.travelDate || "Flexible"}`,
          `Trip: ${payload.tourName}`,
          `Message: ${payload.message || "Please contact me."}`,
        ].join("\n");
        whatsapp.addEventListener("click", () => window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"));
        actions.append(whatsapp);
      }
      const another = document.createElement("button");
      another.type = "button";
      another.className = "send-another";
      another.textContent = "Send another enquiry";
      another.addEventListener("click", () => location.reload());
      actions.append(another);
      success.append(heading, copy, actions);
      form.replaceChildren(success);
    } catch {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
      window.alert("Enquiry could not be sent. Please try again or contact us by phone.");
    }
  }, true);
})();
